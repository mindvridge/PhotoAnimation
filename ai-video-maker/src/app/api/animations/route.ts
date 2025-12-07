import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { withAuth, type ApiContext } from '@/lib/api-handler';
import { ValidationError, NotFoundError } from '@/lib/errors';
import { logAnimation, logEvent } from '@/lib/logger';
import { addToQueue, getProjectJobs, type AnimationJob } from '@/lib/queue/animation-queue';
import { calculateCreditCost, ANIMATION_PRESETS, type AnimationPresetId } from '@/lib/kling-ai';

interface AnimationRequest {
  projectId: string;
  photoIds: string[];
  settings: {
    preset?: AnimationPresetId;
    customPrompt?: string;
    duration: 5 | 10;
    mode: 'standard' | 'pro';
  };
}

// POST: 애니메이션 일괄 생성 요청
export const POST = withAuth(async (request: NextRequest, ctx: ApiContext) => {
  const supabase = await createClient();
  const userId = ctx.userId!; // withAuth가 인증을 보장함

  const body: AnimationRequest = await request.json();
  const { projectId, photoIds, settings } = body;

  if (!projectId || !photoIds || photoIds.length === 0) {
    throw new ValidationError('프로젝트와 사진을 선택해주세요.');
  }

  // 프로젝트 권한 확인
  const { data: project, error: projectError } = await supabase
    .from('projects')
    .select('id, user_id')
    .eq('id', projectId)
    .eq('user_id', userId)
    .single();

  if (projectError || !project) {
    throw new NotFoundError('프로젝트를 찾을 수 없습니다.');
  }

  // 사진 정보 조회
  const { data: photos, error: photosError } = await supabase
    .from('photos')
    .select('id, original_url, animation_status')
    .in('id', photoIds)
    .eq('project_id', projectId);

  if (photosError || !photos || photos.length === 0) {
    throw new NotFoundError('사진을 찾을 수 없습니다.');
  }

  // 이미 처리 중인 사진 필터링
  const photosToProcess = photos.filter(
    (p) => p.animation_status !== 'processing' && p.animation_status !== 'completed'
  );

  if (photosToProcess.length === 0) {
    throw new ValidationError('처리할 사진이 없습니다. 이미 생성 중이거나 완료된 사진입니다.');
  }

  // 크레딧 확인
  const creditCost = calculateCreditCost(
    photosToProcess.length,
    settings.duration,
    settings.mode
  );

  const { data: userProfile, error: profileError } = await supabase
    .from('users')
    .select('credits')
    .eq('id', userId)
    .single();

  if (profileError || !userProfile) {
    throw new Error('사용자 정보를 불러올 수 없습니다.');
  }

  if (userProfile.credits < creditCost) {
    throw new ValidationError(
      `크레딧이 부족합니다. (필요: ${creditCost}, 보유: ${userProfile.credits})`
    );
  }

  // 프롬프트 결정
  let prompt = settings.customPrompt || '';
  if (settings.preset && ANIMATION_PRESETS[settings.preset]) {
    prompt = ANIMATION_PRESETS[settings.preset].prompt;
  }

  if (!prompt) {
    prompt = ANIMATION_PRESETS.smile.prompt; // 기본값
  }

  // 큐에 작업 추가
  const jobs: AnimationJob[] = [];

  for (const photo of photosToProcess) {
    // 사진 상태 업데이트
    await supabase
      .from('photos')
      .update({ animation_status: 'processing' })
      .eq('id', photo.id);

    // 큐에 추가
    const job = addToQueue(photo.id, projectId, photo.original_url, {
      prompt,
      duration: settings.duration,
      mode: settings.mode,
    });

    jobs.push(job);

    // 애니메이션 생성 시작 로깅
    logAnimation('request', {
      taskId: job.id,
      photoId: photo.id,
      userId,
    });
  }

  // 크레딧 차감 (선차감 방식)
  await supabase
    .from('users')
    .update({ credits: userProfile.credits - creditCost })
    .eq('id', userId);

  // 비즈니스 이벤트 로깅
  logEvent('animation_batch_started', {
    projectId,
    photoCount: photosToProcess.length,
    creditUsed: creditCost,
    preset: settings.preset,
    duration: settings.duration,
    mode: settings.mode,
  }, userId);

  return NextResponse.json({
    success: true,
    jobs: jobs.map((j) => ({
      id: j.id,
      photoId: j.photoId,
      status: j.status,
    })),
    creditUsed: creditCost,
    remainingCredits: userProfile.credits - creditCost,
  });
});

// GET: 프로젝트의 애니메이션 작업 목록 조회
export const GET = withAuth(async (request: NextRequest, ctx: ApiContext) => {
  const supabase = await createClient();
  const userId = ctx.userId!; // withAuth가 인증을 보장함

  const { searchParams } = new URL(request.url);
  const projectId = searchParams.get('projectId');

  if (!projectId) {
    throw new ValidationError('프로젝트 ID가 필요합니다.');
  }

  // 프로젝트 권한 확인
  const { data: project } = await supabase
    .from('projects')
    .select('id')
    .eq('id', projectId)
    .eq('user_id', userId)
    .single();

  if (!project) {
    throw new NotFoundError('프로젝트를 찾을 수 없습니다.');
  }

  // 큐에서 작업 조회
  const jobs = getProjectJobs(projectId);

  return NextResponse.json({
    jobs: jobs.map((j) => ({
      id: j.id,
      photoId: j.photoId,
      status: j.status,
      progress: j.progress,
      resultUrl: j.resultUrl,
      error: j.error,
      createdAt: j.createdAt,
      updatedAt: j.updatedAt,
    })),
  });
});
