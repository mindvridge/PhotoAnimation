import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// POST: 사진 업로드
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

    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const projectId = formData.get('projectId') as string | null;
    const order = parseInt(formData.get('order') as string) || 0;

    if (!file) {
      return NextResponse.json(
        { error: '파일이 필요합니다.' },
        { status: 400 }
      );
    }

    if (!projectId) {
      return NextResponse.json(
        { error: '프로젝트 ID가 필요합니다.' },
        { status: 400 }
      );
    }

    // 파일 형식 확인
    const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'JPG, PNG, WebP 형식만 지원됩니다.' },
        { status: 400 }
      );
    }

    // 파일 크기 확인 (10MB)
    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: '파일 크기는 10MB 이하여야 합니다.' },
        { status: 400 }
      );
    }

    // 프로젝트 및 템플릿 확인
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('id, template_id, templates(max_photos)')
      .eq('id', projectId)
      .eq('user_id', user.id)
      .single();

    if (projectError || !project) {
      return NextResponse.json(
        { error: '프로젝트를 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    // 현재 사진 개수 확인
    const { count: photoCount } = await supabase
      .from('photos')
      .select('*', { count: 'exact', head: true })
      .eq('project_id', projectId);

    const maxPhotos = (project.templates as { max_photos: number } | null)?.max_photos || 30;

    if ((photoCount || 0) >= maxPhotos) {
      return NextResponse.json(
        { error: `최대 ${maxPhotos}장까지 업로드할 수 있습니다.` },
        { status: 400 }
      );
    }

    // 파일 업로드
    const fileExt = file.name.split('.').pop()?.toLowerCase() || 'jpg';
    const fileName = `${user.id}/${projectId}/${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const { error: uploadError } = await supabase.storage
      .from('photos')
      .upload(fileName, buffer, {
        contentType: file.type,
        cacheControl: '3600',
        upsert: false,
      });

    if (uploadError) {
      console.error('Storage upload error:', uploadError);
      return NextResponse.json(
        { error: '파일 업로드에 실패했습니다.' },
        { status: 500 }
      );
    }

    // 공개 URL 가져오기
    const { data: urlData } = supabase.storage.from('photos').getPublicUrl(fileName);

    // 데이터베이스에 저장
    const { data: photo, error: dbError } = await supabase
      .from('photos')
      .insert({
        project_id: projectId,
        original_url: urlData.publicUrl,
        order_index: order,
        animation_status: 'pending',
      })
      .select()
      .single();

    if (dbError) {
      console.error('Database insert error:', dbError);
      // 스토리지에서 삭제 시도
      await supabase.storage.from('photos').remove([fileName]);
      return NextResponse.json(
        { error: '사진 정보 저장에 실패했습니다.' },
        { status: 500 }
      );
    }

    return NextResponse.json({ data: photo }, { status: 201 });
  } catch (error) {
    console.error('Photos API error:', error);
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

// GET: 프로젝트의 사진 목록 조회
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

    const { data: photos, error } = await supabase
      .from('photos')
      .select('*')
      .eq('project_id', projectId)
      .order('order_index', { ascending: true });

    if (error) {
      console.error('Get photos error:', error);
      return NextResponse.json(
        { error: '사진 목록을 불러오는데 실패했습니다.' },
        { status: 500 }
      );
    }

    return NextResponse.json({ data: photos });
  } catch (error) {
    console.error('Photos API error:', error);
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

// PATCH: 사진 순서 업데이트
export async function PATCH(request: NextRequest) {
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

    const body = await request.json();
    const { projectId, photoIds } = body;

    if (!projectId || !Array.isArray(photoIds)) {
      return NextResponse.json(
        { error: '프로젝트 ID와 사진 ID 배열이 필요합니다.' },
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

    // 각 사진의 순서 업데이트
    for (let i = 0; i < photoIds.length; i++) {
      const { error } = await supabase
        .from('photos')
        .update({ order_index: i })
        .eq('id', photoIds[i])
        .eq('project_id', projectId);

      if (error) {
        console.error('Update order error:', error);
        return NextResponse.json(
          { error: '사진 순서 업데이트에 실패했습니다.' },
          { status: 500 }
        );
      }
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
