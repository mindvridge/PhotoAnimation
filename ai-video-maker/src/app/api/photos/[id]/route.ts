import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

interface RouteParams {
  params: Promise<{ id: string }>;
}

// URL에서 스토리지 경로 추출
function extractStoragePathFromUrl(url: string): string | null {
  try {
    const urlObj = new URL(url);
    // /storage/v1/object/public/photos/user_id/project_id/filename.jpg 형식에서 경로 추출
    const match = urlObj.pathname.match(/\/storage\/v1\/object\/public\/photos\/(.+)/);
    return match ? match[1] : null;
  } catch {
    return null;
  }
}

// DELETE: 사진 삭제
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
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

    // 사진 정보 가져오기
    const { data: photo, error: photoError } = await supabase
      .from('photos')
      .select('*, projects!inner(user_id)')
      .eq('id', id)
      .single();

    if (photoError || !photo) {
      return NextResponse.json(
        { error: '사진을 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    // 권한 확인
    if ((photo.projects as { user_id: string }).user_id !== user.id) {
      return NextResponse.json(
        { error: '삭제 권한이 없습니다.' },
        { status: 403 }
      );
    }

    // 스토리지에서 원본 삭제 (URL에서 경로 추출)
    if (photo.original_url) {
      const storagePath = extractStoragePathFromUrl(photo.original_url);
      if (storagePath) {
        await supabase.storage.from('photos').remove([storagePath]);
      }
    }

    // 애니메이션 이미지도 삭제 (있는 경우)
    if (photo.animated_url) {
      const animatedPath = extractStoragePathFromUrl(photo.animated_url);
      if (animatedPath) {
        await supabase.storage.from('photos').remove([animatedPath]);
      }
    }

    // 데이터베이스에서 삭제
    const { error: deleteError } = await supabase
      .from('photos')
      .delete()
      .eq('id', id);

    if (deleteError) {
      console.error('Delete photo error:', deleteError);
      return NextResponse.json(
        { error: '사진 삭제에 실패했습니다.' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Photos API error:', error);
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

// PATCH: 사진 애니메이션 설정 업데이트
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
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

    const body = await request.json();

    // 사진 권한 확인
    const { data: photo, error: photoError } = await supabase
      .from('photos')
      .select('*, projects!inner(user_id)')
      .eq('id', id)
      .single();

    if (photoError || !photo) {
      return NextResponse.json(
        { error: '사진을 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    if ((photo.projects as { user_id: string }).user_id !== user.id) {
      return NextResponse.json(
        { error: '수정 권한이 없습니다.' },
        { status: 403 }
      );
    }

    // 업데이트할 데이터 구성
    const updateData: Record<string, unknown> = {};
    if (body.animation_settings !== undefined) updateData.animation_settings = body.animation_settings;
    if (body.animation_status !== undefined) updateData.animation_status = body.animation_status;
    if (body.animated_url !== undefined) updateData.animated_url = body.animated_url;

    const { data: updatedPhoto, error: updateError } = await supabase
      .from('photos')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (updateError) {
      console.error('Update photo error:', updateError);
      return NextResponse.json(
        { error: '사진 정보 업데이트에 실패했습니다.' },
        { status: 500 }
      );
    }

    return NextResponse.json({ data: updatedPhoto });
  } catch (error) {
    console.error('Photos API error:', error);
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
