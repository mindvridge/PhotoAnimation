/**
 * Payment Request API - 결제 요청 준비
 * POST /api/payments/request - 주문 정보 생성
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import {
  generateOrderId,
  getPackageById,
  getSubscriptionPlanById,
} from '@/lib/tosspayments';

interface PaymentRequestBody {
  type: 'package' | 'subscription';
  itemId: string;
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
    const body: PaymentRequestBody = await request.json();
    const { type, itemId } = body;

    if (!type || !itemId) {
      return NextResponse.json(
        { error: '결제 유형과 상품 ID가 필요합니다.' },
        { status: 400 }
      );
    }

    // 상품 정보 조회
    let orderName: string;
    let amount: number;
    let credits: number;

    if (type === 'package') {
      const pkg = getPackageById(itemId);
      if (!pkg) {
        return NextResponse.json(
          { error: '유효하지 않은 패키지입니다.' },
          { status: 400 }
        );
      }
      orderName = `${pkg.name} 크레딧 패키지`;
      amount = pkg.price;
      credits = pkg.credits + (('bonus' in pkg && pkg.bonus) || 0);
    } else if (type === 'subscription') {
      const plan = getSubscriptionPlanById(itemId);
      if (!plan) {
        return NextResponse.json(
          { error: '유효하지 않은 구독 플랜입니다.' },
          { status: 400 }
        );
      }
      orderName = `${plan.name} 구독`;
      amount = plan.price;
      credits = 0; // 구독은 무제한
    } else {
      return NextResponse.json(
        { error: '유효하지 않은 결제 유형입니다.' },
        { status: 400 }
      );
    }

    // 주문 ID 생성
    const orderId = generateOrderId();

    // 사용자 정보 조회
    const { data: userData } = await supabase
      .from('users')
      .select('name, email')
      .eq('id', user.id)
      .single();

    // 결제 레코드 생성 (pending 상태)
    const { data: payment, error: paymentError } = await supabase
      .from('payments')
      .insert({
        user_id: user.id,
        order_id: orderId,
        order_name: orderName,
        amount,
        currency: 'KRW',
        status: 'pending',
        package_id: itemId,
        credits_added: credits,
      })
      .select()
      .single();

    if (paymentError) {
      console.error('Payment record creation error:', paymentError);
      return NextResponse.json(
        { error: '결제 정보 저장에 실패했습니다.' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        paymentId: payment.id,
        orderId,
        orderName,
        amount,
        credits,
        customerName: userData?.name || user.email?.split('@')[0] || '고객',
        customerEmail: user.email,
      },
    });
  } catch (error) {
    console.error('Payment request error:', error);
    return NextResponse.json(
      { error: '결제 요청 처리 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
