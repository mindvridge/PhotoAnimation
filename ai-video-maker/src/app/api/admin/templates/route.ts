/**
 * Admin Templates API
 * GET /api/admin/templates - 템플릿 목록 조회
 * POST /api/admin/templates - 새 템플릿 추가
 */

import { NextRequest, NextResponse } from 'next/server';
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

    // 템플릿 목록 조회
    const { data: templates, error } = await supabase
      .from('templates')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      throw error;
    }

    return NextResponse.json({
      success: true,
      data: templates,
    });
  } catch (error) {
    console.error('Admin templates API error:', error);
    return NextResponse.json(
      { error: '템플릿 목록을 불러오는데 실패했습니다.' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  // 관리자 권한 확인
  const authResult = await checkAdminAuth();
  if (!authResult.authorized) {
    return authResult.response;
  }

  try {
    const body = await request.json();
    const {
      name,
      slug,
      description,
      category,
      max_photos,
      duration_seconds,
      is_premium,
      is_active,
    } = body;

    if (!name || !slug || !category) {
      return NextResponse.json(
        { error: '필수 필드가 누락되었습니다.' },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // 새 템플릿 생성
    const { data, error } = await supabase
      .from('templates')
      .insert({
        name,
        slug,
        description,
        category,
        max_photos: max_photos || 10,
        duration_seconds: duration_seconds || 60,
        is_premium: is_premium || false,
        is_active: is_active !== false,
      })
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
    console.error('Admin template create error:', error);
    return NextResponse.json(
      { error: '템플릿 생성에 실패했습니다.' },
      { status: 500 }
    );
  }
}
