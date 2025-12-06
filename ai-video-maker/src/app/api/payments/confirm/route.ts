/**
 * Payment Confirm API - 결제 승인
 * POST /api/payments/confirm - 토스페이먼츠 승인 API 호출
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { confirmPayment } from '@/lib/tosspayments';

interface PaymentConfirmBody {
  paymentKey: string;
  orderId: string;
  amount: number;
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // 인증 확인
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 });
    }

    // 요청 바디 파싱
    const body: PaymentConfirmBody = await request.json();
    const { paymentKey, orderId, amount } = body;

    if (!paymentKey || !orderId || !amount) {
      return NextResponse.json(
        { error: '결제 정보가 누락되었습니다.' },
        { status: 400 }
      );
    }

    // 결제 레코드 조회
    const { data: payment, error: paymentQueryError } = await supabase
      .from('payments')
      .select('*')
      .eq('order_id', orderId)
      .eq('user_id', user.id)
      .single();

    if (paymentQueryError || !payment) {
      return NextResponse.json(
        { error: '결제 정보를 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    // 금액 검증
    if (payment.amount !== amount) {
      console.error('Amount mismatch:', { expected: payment.amount, received: amount });
      return NextResponse.json(
        { error: '결제 금액이 일치하지 않습니다.' },
        { status: 400 }
      );
    }

    // 이미 완료된 결제인지 확인
    if (payment.status === 'completed') {
      return NextResponse.json(
        { error: '이미 처리된 결제입니다.' },
        { status: 400 }
      );
    }

    // 토스페이먼츠 결제 승인 API 호출
    let confirmResult;
    try {
      confirmResult = await confirmPayment(paymentKey, orderId, amount);
    } catch (error) {
      console.error('TossPayments confirm error:', error);

      // 결제 실패 처리
      await supabase
        .from('payments')
        .update({
          status: 'failed',
          payment_key: paymentKey,
        })
        .eq('id', payment.id);

      return NextResponse.json(
        { error: error instanceof Error ? error.message : '결제 승인에 실패했습니다.' },
        { status: 400 }
      );
    }

    // 결제 성공 - 레코드 업데이트
    const { error: updateError } = await supabase
      .from('payments')
      .update({
        status: 'completed',
        payment_key: paymentKey,
        payment_method: confirmResult.method,
        approved_at: confirmResult.approvedAt,
        receipt_url: confirmResult.receipt?.url || null,
      })
      .eq('id', payment.id);

    if (updateError) {
      console.error('Payment update error:', updateError);
      // 결제는 성공했지만 DB 업데이트 실패 - 로깅하고 계속 진행
    }

    // 크레딧 추가
    if (payment.credits_added > 0) {
      const { data: userData } = await supabase
        .from('users')
        .select('credits')
        .eq('id', user.id)
        .single();

      if (userData) {
        const { error: creditError } = await supabase
          .from('users')
          .update({
            credits: userData.credits + payment.credits_added,
          })
          .eq('id', user.id);

        if (creditError) {
          console.error('Credit update error:', creditError);
          // 결제는 성공했지만 크레딧 업데이트 실패 - 로깅
        }
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        paymentId: payment.id,
        orderId,
        orderName: payment.order_name,
        amount: confirmResult.totalAmount,
        method: confirmResult.method,
        creditsAdded: payment.credits_added,
        receiptUrl: confirmResult.receipt?.url,
        approvedAt: confirmResult.approvedAt,
      },
    });
  } catch (error) {
    console.error('Payment confirm error:', error);
    return NextResponse.json(
      { error: '결제 승인 처리 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
