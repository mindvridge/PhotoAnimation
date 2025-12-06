/**
 * Render API - 렌더링 시작
 * POST /api/render - 렌더링 작업 생성
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import {
  addRenderJob,
  getProjectRenderJob,
  startRenderJob,
  type RenderJobOptions,
} from '@/lib/queue/render-queue';
import { renderVideo, MUSIC_TRACKS } from '@/lib/remotion/render-video';
import { PHOTO_DURATION_FRAMES } from '@/remotion/types';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // 인증 확인
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 });
    }

    const body = await request.json();
    const {
      projectId,
      title,
      subtitle,
      date,
      message,
      musicTrack,
      musicVolume = 0.5,
      resolution = 'hd',
    } = body;

    if (!projectId) {
      return NextResponse.json(
        { error: '프로젝트 ID가 필요합니다.' },
        { status: 400 }
      );
    }

    if (!title) {
      return NextResponse.json(
        { error: '제목이 필요합니다.' },
        { status: 400 }
      );
    }

    // 프로젝트 확인
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select(`
        *,
        templates (
          id,
          slug,
          name
        )
      `)
      .eq('id', projectId)
      .eq('user_id', user.id)
      .single();

    if (projectError || !project) {
      return NextResponse.json(
        { error: '프로젝트를 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    // 사진 목록 가져오기
    const { data: photos, error: photosError } = await supabase
      .from('photos')
      .select('*')
      .eq('project_id', projectId)
      .order('order_index', { ascending: true });

    if (photosError) {
      return NextResponse.json(
        { error: '사진을 불러올 수 없습니다.' },
        { status: 500 }
      );
    }

    if (!photos || photos.length === 0) {
      return NextResponse.json(
        { error: '렌더링할 사진이 없습니다.' },
        { status: 400 }
      );
    }

    // 기존 진행 중인 작업 확인
    const existingJob = getProjectRenderJob(projectId);
    if (existingJob && !['completed', 'failed'].includes(existingJob.status)) {
      return NextResponse.json({
        success: true,
        data: {
          jobId: existingJob.id,
          status: existingJob.status,
          progress: existingJob.progress,
          currentStep: existingJob.currentStep,
        },
        message: '이미 렌더링이 진행 중입니다.',
      });
    }

    // 배경음악 유효성 검사
    if (musicTrack && !MUSIC_TRACKS.find((t) => t.id === musicTrack)) {
      return NextResponse.json(
        { error: '유효하지 않은 배경음악입니다.' },
        { status: 400 }
      );
    }

    // 템플릿 슬러그로 컴포지션 ID 결정
    const compositionId = getCompositionIdFromSlug(project.templates?.slug || 'wedding');

    // 렌더링 작업 옵션
    const renderOptions: RenderJobOptions = {
      compositionId,
      resolution,
      title,
      subtitle,
      date,
      message,
      musicTrack,
      musicVolume,
    };

    // 렌더링 작업 추가
    const job = addRenderJob(projectId, renderOptions);

    // 작업 시작 시도
    const started = startRenderJob(job.id);

    if (started) {
      // 백그라운드에서 렌더링 실행 (비동기)
      const photoItems = photos.map((photo) => ({
        id: photo.id,
        animatedUrl: photo.animated_url || photo.original_url,
        originalUrl: photo.original_url,
        duration: PHOTO_DURATION_FRAMES,
      }));

      // 렌더링 비동기 실행
      renderVideo({
        jobId: job.id,
        projectId,
        options: renderOptions,
        photos: photoItems,
      }).catch((error) => {
        console.error('Render error:', error);
      });
    }

    return NextResponse.json({
      success: true,
      data: {
        jobId: job.id,
        status: job.status,
        progress: job.progress,
        currentStep: job.currentStep,
        estimatedTime: photos.length * (resolution === 'full-hd' ? 30 : 20),
      },
    });
  } catch (error) {
    console.error('Render API error:', error);
    return NextResponse.json(
      { error: '렌더링 요청 처리 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

/**
 * 템플릿 슬러그로 컴포지션 ID 결정
 */
function getCompositionIdFromSlug(slug: string): string {
  const mapping: Record<string, string> = {
    'wedding': 'WEDDING',
    'wedding-invitation': 'WEDDING',
    'birthday': 'BIRTHDAY',
    'birthday-celebration': 'BIRTHDAY',
    'seventy': 'SEVENTY',
    '70th-birthday': 'SEVENTY',
    'seventy-celebration': 'SEVENTY',
  };
  return mapping[slug] || 'WEDDING';
}
