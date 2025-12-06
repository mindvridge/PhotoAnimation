/**
 * Admin Payments API
 * GET /api/admin/payments - 결제 목록 및 통계 조회
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

    // 결제 목록 조회 (with user email)
    const { data: payments, error: paymentsError } = await supabase
      .from('payments')
      .select('*')
      .order('created_at', { ascending: false });

    if (paymentsError) {
      throw paymentsError;
    }

    // 사용자 이메일 매핑
    const userIds = [...new Set(payments?.map((p) => p.user_id) || [])];
    const { data: users } = await supabase
      .from('users')
      .select('id, email')
      .in('id', userIds);

    const userMap = new Map(users?.map((u) => [u.id, u.email]) || []);
    const paymentsWithEmail = payments?.map((p) => ({
      ...p,
      user_email: userMap.get(p.user_id) || 'Unknown',
    }));

    // 통계 계산
    const completedPayments = payments?.filter((p) => p.status === 'completed') || [];
    const refundedPayments = payments?.filter((p) => p.status === 'refunded') || [];

    const totalRevenue = completedPayments.reduce((sum, p) => sum + p.amount, 0);
    const refundedAmount = refundedPayments.reduce((sum, p) => sum + p.amount, 0);

    // 이번 달 매출
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthlyPayments = completedPayments.filter(
      (p) => new Date(p.created_at) >= startOfMonth
    );
    const monthlyRevenue = monthlyPayments.reduce((sum, p) => sum + p.amount, 0);

    // 월별 매출 데이터 (최근 6개월)
    const monthlyData = [];
    for (let i = 5; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const endDate = new Date(now.getFullYear(), now.getMonth() - i + 1, 0);

      const monthPayments = completedPayments.filter((p) => {
        const paymentDate = new Date(p.created_at);
        return paymentDate >= date && paymentDate <= endDate;
      });

      const revenue = monthPayments.reduce((sum, p) => sum + p.amount, 0);

      monthlyData.push({
        name: date.toLocaleDateString('ko-KR', { month: 'short' }),
        revenue: Math.floor(revenue / 10000), // 만원 단위
      });
    }

    return NextResponse.json({
      success: true,
      data: {
        payments: paymentsWithEmail,
        stats: {
          totalRevenue,
          monthlyRevenue,
          totalPayments: completedPayments.length,
          refundedAmount,
        },
        monthlyData,
      },
    });
  } catch (error) {
    console.error('Admin payments API error:', error);
    return NextResponse.json(
      { error: '결제 목록을 불러오는데 실패했습니다.' },
      { status: 500 }
    );
  }
}
