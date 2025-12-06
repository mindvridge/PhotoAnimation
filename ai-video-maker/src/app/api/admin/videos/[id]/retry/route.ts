/**
 * Admin Video Retry API
 * POST /api/admin/videos/[id]/retry - 실패한 영상 재시도
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { checkAdminAuth } from '@/lib/api/admin';

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // 관리자 권한 확인
  const authResult = await checkAdminAuth();
  if (!authResult.authorized) {
    return authResult.response;
  }

  try {
    const { id } = await params;
    const supabase = await createClient();

    // 영상 정보 조회
    const { data: video, error: videoError } = await supabase
      .from('videos')
      .select('*, project:projects(*)')
      .eq('id', id)
      .single();

    if (videoError || !video) {
      return NextResponse.json(
        { error: '영상을 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    if (video.render_status !== 'failed') {
      return NextResponse.json(
        { error: '실패한 영상만 재시도할 수 있습니다.' },
        { status: 400 }
      );
    }

    // 영상 상태를 queued로 변경
    const { error: updateError } = await supabase
      .from('videos')
      .update({
        render_status: 'queued',
        error_message: null,
      })
      .eq('id', id);

    if (updateError) {
      throw updateError;
    }

    // TODO: 실제 렌더링 큐에 추가 (별도 렌더링 서비스 필요)
    // 현재는 DB 상태만 변경

    return NextResponse.json({
      success: true,
      message: '재시도가 요청되었습니다.',
    });
  } catch (error) {
    console.error('Admin video retry error:', error);
    return NextResponse.json(
      { error: '재시도 요청에 실패했습니다.' },
      { status: 500 }
    );
  }
}
