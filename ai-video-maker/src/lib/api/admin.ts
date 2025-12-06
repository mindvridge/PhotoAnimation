/**
 * Admin API Utilities
 * 관리자 API 유틸리티 함수
 */

import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * 관리자 권한 확인
 * @returns 인증된 사용자 ID 또는 에러 응답
 */
export async function checkAdminAuth(): Promise<
  | { authorized: true; userId: string }
  | { authorized: false; response: NextResponse }
> {
  const supabase = await createClient();

  // 인증 확인
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return {
      authorized: false,
      response: NextResponse.json(
        { error: '인증이 필요합니다.' },
        { status: 401 }
      ),
    };
  }

  // 관리자 권한 확인
  const { data: userData, error: userError } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single();

  if (userError || !userData || userData.role !== 'admin') {
    return {
      authorized: false,
      response: NextResponse.json(
        { error: '관리자 권한이 필요합니다.' },
        { status: 403 }
      ),
    };
  }

  return { authorized: true, userId: user.id };
}

/**
 * 날짜 범위 계산 유틸리티
 */
export function getDateRange(days: number): { start: Date; end: Date } {
  const end = new Date();
  end.setHours(23, 59, 59, 999);

  const start = new Date();
  start.setDate(start.getDate() - days);
  start.setHours(0, 0, 0, 0);

  return { start, end };
}

/**
 * 월별 데이터 생성
 */
export function generateMonthlyLabels(months: number = 6): string[] {
  const labels: string[] = [];
  const now = new Date();

  for (let i = months - 1; i >= 0; i--) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
    labels.push(
      date.toLocaleDateString('ko-KR', { year: 'numeric', month: 'short' })
    );
  }

  return labels;
}
