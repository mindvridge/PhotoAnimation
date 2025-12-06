/**
 * Render Status API - 렌더링 상태 확인
 * GET /api/render/[id]/status - 진행률 반환
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getRenderJob, getProjectRenderJob } from '@/lib/queue/render-queue';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();

    // 인증 확인
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 });
    }

    // 작업 ID로 조회 시도
    let job = getRenderJob(id);

    // 작업을 찾지 못하면 프로젝트 ID로 시도
    if (!job) {
      job = getProjectRenderJob(id);
    }

    if (!job) {
      return NextResponse.json(
        { error: '렌더링 작업을 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        jobId: job.id,
        projectId: job.projectId,
        status: job.status,
        progress: job.progress,
        currentStep: job.currentStep,
        startedAt: job.startedAt?.toISOString(),
        completedAt: job.completedAt?.toISOString(),
        outputUrl: job.outputUrl,
        fileSize: job.fileSize,
        duration: job.duration,
        error: job.error,
      },
    });
  } catch (error) {
    console.error('Render status error:', error);
    return NextResponse.json(
      { error: '상태 확인 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
