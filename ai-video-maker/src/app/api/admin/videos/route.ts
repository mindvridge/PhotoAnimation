/**
 * Admin Videos API
 * GET /api/admin/videos - 영상 목록 및 렌더링 큐 조회
 */

import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { checkAdminAuth } from '@/lib/api/admin';
import { getActiveJobs, getJobsStats } from '@/lib/queue/render-queue';

export async function GET() {
  // 관리자 권한 확인
  const authResult = await checkAdminAuth();
  if (!authResult.authorized) {
    return authResult.response;
  }

  try {
    const supabase = await createClient();

    // 영상 목록 조회
    const { data: videos, error: videosError } = await supabase
      .from('videos')
      .select('*, project:projects(id, name, user_id)')
      .order('created_at', { ascending: false });

    if (videosError) {
      throw videosError;
    }

    // 사용자 이메일 매핑
    const userIds = [...new Set(videos?.map((v) => v.project?.user_id).filter(Boolean) || [])];
    const { data: users } = await supabase
      .from('users')
      .select('id, email')
      .in('id', userIds as string[]);

    const userMap = new Map(users?.map((u) => [u.id, u.email]) || []);

    // 영상에 사용자 이메일 추가
    const videosWithEmail = videos?.map((v) => ({
      ...v,
      project: v.project
        ? {
            ...v.project,
            user_email: userMap.get(v.project.user_id) || 'Unknown',
          }
        : null,
    }));

    // 실패한 영상 필터링
    const failedVideos = videosWithEmail?.filter((v) => v.render_status === 'failed') || [];

    // 렌더링 큐 조회 (인메모리)
    const activeJobs = getActiveJobs();
    const queue = activeJobs.map((job) => ({
      id: job.id,
      projectId: job.options.projectId,
      projectName: job.options.projectName || 'Unknown',
      userEmail: job.options.userId || 'Unknown',
      status: job.status,
      progress: job.progress,
      currentStep: job.currentStep,
      startedAt: job.startedAt?.toISOString() || new Date().toISOString(),
    }));

    // 통계 계산
    const queueStats = getJobsStats();
    const completedCount = videos?.filter((v) => v.render_status === 'completed').length || 0;
    const failedCount = videos?.filter((v) => v.render_status === 'failed').length || 0;

    return NextResponse.json({
      success: true,
      data: {
        videos: videosWithEmail,
        failedVideos,
        queue,
        stats: {
          queueLength: queueStats.pending + queueStats.processing,
          processing: queueStats.processing,
          completed: completedCount,
          failed: failedCount,
        },
      },
    });
  } catch (error) {
    console.error('Admin videos API error:', error);
    return NextResponse.json(
      { error: '영상 목록을 불러오는데 실패했습니다.' },
      { status: 500 }
    );
  }
}
