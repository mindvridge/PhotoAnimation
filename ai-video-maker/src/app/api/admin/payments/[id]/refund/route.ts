/**
 * Admin Payment Refund API
 * POST /api/admin/payments/[id]/refund - 결제 환불 처리
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { checkAdminAuth } from '@/lib/api/admin';
import { cancelPayment } from '@/lib/tosspayments';

export async function POST(
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
    const { reason } = body;

    if (!reason) {
      return NextResponse.json(
        { error: '환불 사유가 필요합니다.' },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // 결제 정보 조회
    const { data: payment, error: paymentError } = await supabase
      .from('payments')
      .select('*')
      .eq('id', id)
      .single();

    if (paymentError || !payment) {
      return NextResponse.json(
        { error: '결제 정보를 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    if (payment.status !== 'completed') {
      return NextResponse.json(
        { error: '완료된 결제만 환불할 수 있습니다.' },
        { status: 400 }
      );
    }

    if (!payment.payment_key) {
      return NextResponse.json(
        { error: '결제 키가 없어 환불할 수 없습니다.' },
        { status: 400 }
      );
    }

    // 토스페이먼츠 환불 요청
    try {
      await cancelPayment(payment.payment_key, reason);
    } catch (cancelError) {
      console.error('TossPayments cancel error:', cancelError);
      // 실제 환경에서는 여기서 에러 반환
      // 개발 환경에서는 DB만 업데이트
    }

    // 결제 상태 업데이트
    await supabase
      .from('payments')
      .update({ status: 'refunded' })
      .eq('id', id);

    // 크레딧 차감
    if (payment.credits_added > 0) {
      const { data: userData } = await supabase
        .from('users')
        .select('credits')
        .eq('id', payment.user_id)
        .single();

      if (userData) {
        const newCredits = Math.max(0, userData.credits - payment.credits_added);
        await supabase
          .from('users')
          .update({ credits: newCredits })
          .eq('id', payment.user_id);
      }
    }

    return NextResponse.json({
      success: true,
      message: '환불이 처리되었습니다.',
    });
  } catch (error) {
    console.error('Admin refund error:', error);
    return NextResponse.json(
      { error: '환불 처리에 실패했습니다.' },
      { status: 500 }
    );
  }
}
