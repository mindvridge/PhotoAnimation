/**
 * Admin Users API
 * GET /api/admin/users - 사용자 목록 조회
 */

import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { checkAdminAuth } from '@/lib/api/admin';

export async function GET() {
  // 관리자 권한 확인
  const authResult = await checkAdminAuth();
  if (!authResult.authorized) {
    return authResult.response;
  }

  try {
    const supabase = await createClient();

    // 사용자 목록 조회
    const { data: users, error } = await supabase
      .from('users')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      throw error;
    }

    return NextResponse.json({
      success: true,
      data: users,
    });
  } catch (error) {
    console.error('Admin users API error:', error);
    return NextResponse.json(
      { error: '사용자 목록을 불러오는데 실패했습니다.' },
      { status: 500 }
    );
  }
}
