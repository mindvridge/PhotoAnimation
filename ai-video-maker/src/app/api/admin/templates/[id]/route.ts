/**
 * Admin Template API
 * PATCH /api/admin/templates/[id] - 템플릿 수정
 * DELETE /api/admin/templates/[id] - 템플릿 삭제
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { checkAdminAuth } from '@/lib/api/admin';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // 관리자 권한 확인
  const authResult = await checkAdminAuth();
  if (!authResult.authorized) {
    return authResult.response;
  }

  try {
    const { id } = await params;
    const body = await request.json();

    const supabase = await createClient();

    // 업데이트할 데이터 필터링
    const allowedFields = [
      'name',
      'slug',
      'description',
      'category',
      'thumbnail_url',
      'preview_video_url',
      'remotion_template_id',
      'max_photos',
      'duration_seconds',
      'is_premium',
      'is_active',
    ];

    const updateData: Record<string, unknown> = {};
    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        updateData[field] = body[field];
      }
    }

    // 템플릿 업데이트
    const { data, error } = await supabase
      .from('templates')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw error;
    }

    return NextResponse.json({
      success: true,
      data,
    });
  } catch (error) {
    console.error('Admin template update error:', error);
    return NextResponse.json(
      { error: '템플릿 수정에 실패했습니다.' },
      { status: 500 }
    );
  }
}

export async function DELETE(
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

    // 템플릿 삭제
    const { error } = await supabase
      .from('templates')
      .delete()
      .eq('id', id);

    if (error) {
      throw error;
    }

    return NextResponse.json({
      success: true,
    });
  } catch (error) {
    console.error('Admin template delete error:', error);
    return NextResponse.json(
      { error: '템플릿 삭제에 실패했습니다.' },
      { status: 500 }
    );
  }
}
