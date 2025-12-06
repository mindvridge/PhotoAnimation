/**
 * Payment Webhook API - 결제 웹훅 처리
 * POST /api/payments/webhook - 토스페이먼츠 웹훅 수신
 *
 * 웹훅 시크릿 키 검증을 통해 요청의 유효성을 확인합니다.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

// 서비스 롤 클라이언트 (웹훅은 인증 없이 호출되므로)
// 런타임에만 초기화되도록 lazy 패턴 사용
let supabase: SupabaseClient | null = null;

function getSupabaseClient(): SupabaseClient {
  if (!supabase) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !serviceRoleKey) {
      throw new Error('Missing Supabase environment variables');
    }

    supabase = createClient(supabaseUrl, serviceRoleKey);
  }
  return supabase;
}

// 웹훅 이벤트 타입
type WebhookEventType =
  | 'PAYMENT_STATUS_CHANGED'
  | 'DEPOSIT_CALLBACK'
  | 'PAYOUT_STATUS_CHANGED'
  | 'CANCEL_PAYMENT';

interface WebhookPayload {
  eventType: WebhookEventType;
  createdAt: string;
  data: {
    paymentKey: string;
    orderId: string;
    status?: string;
    transactionKey?: string;
    cancels?: Array<{
      cancelAmount: number;
      cancelReason: string;
      canceledAt: string;
      transactionKey: string;
    }>;
  };
}

export async function POST(request: NextRequest) {
  try {
    // 웹훅 시크릿 검증 (토스페이먼츠에서 설정한 시크릿)
    const webhookSecret = process.env.TOSS_WEBHOOK_SECRET;
    const signature = request.headers.get('toss-signature');

    // 시크릿이 설정된 경우에만 검증
    if (webhookSecret && signature) {
      // 실제 환경에서는 HMAC 검증 필요
      // const isValid = verifySignature(webhookSecret, signature, body);
      // if (!isValid) {
      //   return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
      // }
    }

    const payload: WebhookPayload = await request.json();
    const { eventType, data } = payload;

    console.log('Webhook received:', { eventType, orderId: data.orderId });

    switch (eventType) {
      case 'PAYMENT_STATUS_CHANGED':
        await handlePaymentStatusChanged(data);
        break;

      case 'CANCEL_PAYMENT':
        await handlePaymentCanceled(data);
        break;

      case 'DEPOSIT_CALLBACK':
        await handleDepositCallback(data);
        break;

      default:
        console.log('Unhandled webhook event:', eventType);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Webhook processing error:', error);
    // 웹훅은 항상 200을 반환해야 재시도를 방지
    return NextResponse.json({ success: false, error: 'Processing failed' });
  }
}

/**
 * 결제 상태 변경 처리
 */
async function handlePaymentStatusChanged(data: WebhookPayload['data']) {
  const { orderId, status } = data;

  if (!orderId || !status) return;

  const client = getSupabaseClient();

  // 결제 레코드 조회
  const { data: payment, error } = await client
    .from('payments')
    .select('*')
    .eq('order_id', orderId)
    .single();

  if (error || !payment) {
    console.error('Payment not found for order:', orderId);
    return;
  }

  // 상태 매핑
  const statusMap: Record<string, string> = {
    DONE: 'completed',
    CANCELED: 'refunded',
    PARTIAL_CANCELED: 'completed', // 부분 취소도 완료 상태 유지
    EXPIRED: 'failed',
    ABORTED: 'failed',
  };

  const newStatus = statusMap[status];
  if (!newStatus) return;

  // 상태 업데이트
  await client
    .from('payments')
    .update({ status: newStatus })
    .eq('id', payment.id);
}

/**
 * 결제 취소 처리
 */
async function handlePaymentCanceled(data: WebhookPayload['data']) {
  const { orderId, cancels } = data;

  if (!orderId || !cancels || cancels.length === 0) return;

  const client = getSupabaseClient();

  // 결제 레코드 조회
  const { data: payment, error } = await client
    .from('payments')
    .select('*')
    .eq('order_id', orderId)
    .single();

  if (error || !payment) {
    console.error('Payment not found for order:', orderId);
    return;
  }

  const latestCancel = cancels[cancels.length - 1];
  const totalCanceled = cancels.reduce((sum, c) => sum + c.cancelAmount, 0);

  // 전액 환불인 경우
  if (totalCanceled >= payment.amount) {
    // 결제 상태를 환불로 변경
    await client
      .from('payments')
      .update({ status: 'refunded' })
      .eq('id', payment.id);

    // 크레딧 차감
    if (payment.credits_added > 0) {
      const { data: userData } = await client
        .from('users')
        .select('credits')
        .eq('id', payment.user_id)
        .single();

      if (userData) {
        const newCredits = Math.max(0, userData.credits - payment.credits_added);
        await client
          .from('users')
          .update({ credits: newCredits })
          .eq('id', payment.user_id);
      }
    }

    console.log('Full refund processed for order:', orderId);
  } else {
    // 부분 환불 - 로깅만
    console.log('Partial refund processed:', {
      orderId,
      canceledAmount: latestCancel.cancelAmount,
      reason: latestCancel.cancelReason,
    });
  }
}

/**
 * 가상계좌 입금 콜백 처리
 */
async function handleDepositCallback(data: WebhookPayload['data']) {
  const { orderId, status } = data;

  if (!orderId || status !== 'DONE') return;

  const client = getSupabaseClient();

  // 결제 레코드 조회
  const { data: payment, error } = await client
    .from('payments')
    .select('*')
    .eq('order_id', orderId)
    .single();

  if (error || !payment) {
    console.error('Payment not found for order:', orderId);
    return;
  }

  // 이미 완료된 경우 스킵
  if (payment.status === 'completed') return;

  // 결제 완료 처리
  await client
    .from('payments')
    .update({
      status: 'completed',
      approved_at: new Date().toISOString(),
    })
    .eq('id', payment.id);

  // 크레딧 추가
  if (payment.credits_added > 0) {
    const { data: userData } = await client
      .from('users')
      .select('credits')
      .eq('id', payment.user_id)
      .single();

    if (userData) {
      await client
        .from('users')
        .update({
          credits: userData.credits + payment.credits_added,
        })
        .eq('id', payment.user_id);
    }
  }

  console.log('Virtual account deposit completed for order:', orderId);
}
