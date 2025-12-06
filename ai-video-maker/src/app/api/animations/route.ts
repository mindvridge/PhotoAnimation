import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
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
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: '로그인이 필요합니다.' },
        { status: 401 }
      );
    }

    const body: AnimationRequest = await request.json();
    const { projectId, photoIds, settings } = body;

    if (!projectId || !photoIds || photoIds.length === 0) {
      return NextResponse.json(
        { error: '프로젝트와 사진을 선택해주세요.' },
        { status: 400 }
      );
    }

    // 프로젝트 권한 확인
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('id, user_id')
      .eq('id', projectId)
      .eq('user_id', user.id)
      .single();

    if (projectError || !project) {
      return NextResponse.json(
        { error: '프로젝트를 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    // 사진 정보 조회
    const { data: photos, error: photosError } = await supabase
      .from('photos')
      .select('id, original_url, animation_status')
      .in('id', photoIds)
      .eq('project_id', projectId);

    if (photosError || !photos || photos.length === 0) {
      return NextResponse.json(
        { error: '사진을 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    // 이미 처리 중인 사진 필터링
    const photosToProcess = photos.filter(
      (p) => p.animation_status !== 'processing' && p.animation_status !== 'completed'
    );

    if (photosToProcess.length === 0) {
      return NextResponse.json(
        { error: '처리할 사진이 없습니다. 이미 생성 중이거나 완료된 사진입니다.' },
        { status: 400 }
      );
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
      .eq('id', user.id)
      .single();

    if (profileError || !userProfile) {
      return NextResponse.json(
        { error: '사용자 정보를 불러올 수 없습니다.' },
        { status: 500 }
      );
    }

    if (userProfile.credits < creditCost) {
      return NextResponse.json(
        {
          error: '크레딧이 부족합니다.',
          required: creditCost,
          available: userProfile.credits,
        },
        { status: 400 }
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
    }

    // 크레딧 차감 (선차감 방식)
    await supabase
      .from('users')
      .update({ credits: userProfile.credits - creditCost })
      .eq('id', user.id);

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
  } catch (error) {
    console.error('Animation API error:', error);
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

// GET: 프로젝트의 애니메이션 작업 목록 조회
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: '로그인이 필요합니다.' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('projectId');

    if (!projectId) {
      return NextResponse.json(
        { error: '프로젝트 ID가 필요합니다.' },
        { status: 400 }
      );
    }

    // 프로젝트 권한 확인
    const { data: project } = await supabase
      .from('projects')
      .select('id')
      .eq('id', projectId)
      .eq('user_id', user.id)
      .single();

    if (!project) {
      return NextResponse.json(
        { error: '프로젝트를 찾을 수 없습니다.' },
        { status: 404 }
      );
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
  } catch (error) {
    console.error('Animation API error:', error);
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
