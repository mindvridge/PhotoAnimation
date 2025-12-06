'use client';

import { createClient } from '@/lib/supabase/client';
import type { Database } from '@/types/database';

type Photo = Database['public']['Tables']['photos']['Row'];

function getSupabase() {
  return createClient();
}

export interface UploadPhotoInput {
  projectId: string;
  file: File;
  order: number;
}

export interface PhotoUploadResult {
  success: boolean;
  photo?: Photo;
  error?: string;
}

// URL에서 스토리지 경로 추출
function extractStoragePathFromUrl(url: string): string | null {
  try {
    const urlObj = new URL(url);
    const match = urlObj.pathname.match(/\/storage\/v1\/object\/public\/photos\/(.+)/);
    return match ? match[1] : null;
  } catch {
    return null;
  }
}

// 사진 업로드
export async function uploadPhoto(input: UploadPhotoInput): Promise<PhotoUploadResult> {
  const supabase = getSupabase();

  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: '로그인이 필요합니다.' };
    }

    // 프로젝트 확인
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('id, template_id')
      .eq('id', input.projectId)
      .eq('user_id', user.id)
      .single();

    if (projectError || !project) {
      return { success: false, error: '프로젝트를 찾을 수 없습니다.' };
    }

    // 파일 업로드
    const fileExt = input.file.name.split('.').pop()?.toLowerCase() || 'jpg';
    const fileName = `${user.id}/${input.projectId}/${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from('photos')
      .upload(fileName, input.file, {
        cacheControl: '3600',
        upsert: false,
      });

    if (uploadError) {
      console.error('Storage upload error:', uploadError);
      return { success: false, error: '파일 업로드에 실패했습니다.' };
    }

    // 공개 URL 가져오기
    const { data: urlData } = supabase.storage.from('photos').getPublicUrl(fileName);

    // 데이터베이스에 저장
    const { data: photo, error: dbError } = await supabase
      .from('photos')
      .insert({
        project_id: input.projectId,
        original_url: urlData.publicUrl,
        order_index: input.order,
        animation_status: 'pending',
      })
      .select()
      .single();

    if (dbError) {
      console.error('Database insert error:', dbError);
      // 스토리지에서 삭제 시도
      await supabase.storage.from('photos').remove([fileName]);
      return { success: false, error: '사진 정보 저장에 실패했습니다.' };
    }

    return { success: true, photo };
  } catch (error) {
    console.error('Upload photo error:', error);
    return { success: false, error: '사진 업로드 중 오류가 발생했습니다.' };
  }
}

// 프로젝트의 모든 사진 조회
export async function getPhotos(projectId: string): Promise<Photo[]> {
  const supabase = getSupabase();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('로그인이 필요합니다.');
  }

  // 프로젝트 권한 확인
  const { data: project } = await supabase
    .from('projects')
    .select('id')
    .eq('id', projectId)
    .eq('user_id', user.id)
    .single();

  if (!project) {
    throw new Error('프로젝트를 찾을 수 없습니다.');
  }

  const { data, error } = await supabase
    .from('photos')
    .select('*')
    .eq('project_id', projectId)
    .order('order_index', { ascending: true });

  if (error) {
    console.error('Get photos error:', error);
    throw new Error('사진 목록을 불러오는데 실패했습니다.');
  }

  return data || [];
}

// 사진 순서 업데이트
export async function updatePhotoOrder(
  projectId: string,
  photoIds: string[]
): Promise<void> {
  const supabase = getSupabase();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('로그인이 필요합니다.');
  }

  // 프로젝트 권한 확인
  const { data: project } = await supabase
    .from('projects')
    .select('id')
    .eq('id', projectId)
    .eq('user_id', user.id)
    .single();

  if (!project) {
    throw new Error('프로젝트를 찾을 수 없습니다.');
  }

  // 각 사진의 순서 업데이트
  const updates = photoIds.map((photoId, index) =>
    supabase
      .from('photos')
      .update({ order_index: index })
      .eq('id', photoId)
      .eq('project_id', projectId)
  );

  const results = await Promise.all(updates);
  const errors = results.filter((r) => r.error);

  if (errors.length > 0) {
    console.error('Update order errors:', errors);
    throw new Error('사진 순서 업데이트에 실패했습니다.');
  }
}

// 사진 삭제
export async function deletePhoto(photoId: string): Promise<void> {
  const supabase = getSupabase();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('로그인이 필요합니다.');
  }

  // 사진 정보 가져오기
  const { data: photo, error: photoError } = await supabase
    .from('photos')
    .select('*, projects!inner(user_id)')
    .eq('id', photoId)
    .single();

  if (photoError || !photo) {
    throw new Error('사진을 찾을 수 없습니다.');
  }

  // 권한 확인
  if ((photo.projects as { user_id: string }).user_id !== user.id) {
    throw new Error('삭제 권한이 없습니다.');
  }

  // 스토리지에서 원본 삭제
  if (photo.original_url) {
    const storagePath = extractStoragePathFromUrl(photo.original_url);
    if (storagePath) {
      await supabase.storage.from('photos').remove([storagePath]);
    }
  }

  // 애니메이션 이미지도 삭제
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
    .eq('id', photoId);

  if (deleteError) {
    console.error('Delete photo error:', deleteError);
    throw new Error('사진 삭제에 실패했습니다.');
  }
}

// 사진 애니메이션 설정 업데이트
export async function updatePhotoAnimationSettings(
  photoId: string,
  settings: {
    animation_settings?: Record<string, unknown>;
    animation_status?: 'pending' | 'processing' | 'completed' | 'failed';
  }
): Promise<void> {
  const supabase = getSupabase();

  const updateData: Record<string, unknown> = {};
  if (settings.animation_settings !== undefined) {
    updateData.animation_settings = settings.animation_settings;
  }
  if (settings.animation_status !== undefined) {
    updateData.animation_status = settings.animation_status;
  }

  const { error } = await supabase
    .from('photos')
    .update(updateData)
    .eq('id', photoId);

  if (error) {
    console.error('Update photo settings error:', error);
    throw new Error('사진 정보 업데이트에 실패했습니다.');
  }
}
