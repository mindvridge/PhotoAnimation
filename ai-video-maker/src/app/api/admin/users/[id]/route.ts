/**
 * Admin User API
 * PATCH /api/admin/users/[id] - 사용자 정보 수정
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
    const { credits, role, subscription_tier } = body;

    const supabase = await createClient();

    // 업데이트할 데이터 구성
    const updateData: Record<string, unknown> = {};
    if (credits !== undefined) updateData.credits = credits;
    if (role !== undefined) updateData.role = role;
    if (subscription_tier !== undefined) updateData.subscription_tier = subscription_tier;

    // 사용자 업데이트
    const { data, error } = await supabase
      .from('users')
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
    console.error('Admin user update error:', error);
    return NextResponse.json(
      { error: '사용자 정보 수정에 실패했습니다.' },
      { status: 500 }
    );
  }
}
