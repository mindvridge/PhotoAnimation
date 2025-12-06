import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getJob, retryJob } from '@/lib/queue/animation-queue';

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET: 작업 상태 조회
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id: jobId } = await params;
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

    // 큐에서 작업 조회
    const job = getJob(jobId);

    if (!job) {
      return NextResponse.json(
        { error: '작업을 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    // 프로젝트 권한 확인
    const { data: project } = await supabase
      .from('projects')
      .select('id')
      .eq('id', job.projectId)
      .eq('user_id', user.id)
      .single();

    if (!project) {
      return NextResponse.json(
        { error: '접근 권한이 없습니다.' },
        { status: 403 }
      );
    }

    // 완료된 경우 DB 업데이트
    if (job.status === 'completed' && job.resultUrl) {
      await supabase
        .from('photos')
        .update({
          animated_url: job.resultUrl,
          animation_status: 'completed',
        })
        .eq('id', job.photoId);
    }

    // 실패한 경우 DB 업데이트
    if (job.status === 'failed') {
      await supabase
        .from('photos')
        .update({
          animation_status: 'failed',
        })
        .eq('id', job.photoId);
    }

    return NextResponse.json({
      job: {
        id: job.id,
        photoId: job.photoId,
        status: job.status,
        progress: job.progress,
        resultUrl: job.resultUrl,
        error: job.error,
        createdAt: job.createdAt,
        updatedAt: job.updatedAt,
        retryCount: job.retryCount,
      },
    });
  } catch (error) {
    console.error('Animation status API error:', error);
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

// POST: 작업 재시도
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { id: jobId } = await params;
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

    // 큐에서 작업 조회
    const job = getJob(jobId);

    if (!job) {
      return NextResponse.json(
        { error: '작업을 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    // 프로젝트 권한 확인
    const { data: project } = await supabase
      .from('projects')
      .select('id')
      .eq('id', job.projectId)
      .eq('user_id', user.id)
      .single();

    if (!project) {
      return NextResponse.json(
        { error: '접근 권한이 없습니다.' },
        { status: 403 }
      );
    }

    // 재시도
    const success = retryJob(jobId);

    if (!success) {
      return NextResponse.json(
        { error: '재시도할 수 없는 작업입니다.' },
        { status: 400 }
      );
    }

    // 사진 상태 업데이트
    await supabase
      .from('photos')
      .update({ animation_status: 'processing' })
      .eq('id', job.photoId);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Animation retry API error:', error);
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
