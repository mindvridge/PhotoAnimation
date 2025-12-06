/**
 * TossPayments Integration
 * 토스페이먼츠 결제 연동 유틸리티
 */

// 클라이언트/서버 키
export const TOSS_CLIENT_KEY = process.env.NEXT_PUBLIC_TOSS_CLIENT_KEY || '';
export const TOSS_SECRET_KEY = process.env.TOSS_SECRET_KEY || '';

// 크레딧 패키지 정의
export const CREDIT_PACKAGES = [
  {
    id: 'basic',
    name: 'Basic',
    price: 9900,
    credits: 10,
    description: '영상 1개 제작 가능',
    features: ['10 크레딧', 'HD 영상 렌더링', '이메일 지원'],
    popular: false,
  },
  {
    id: 'standard',
    name: 'Standard',
    price: 29900,
    credits: 35,
    bonus: 5,
    description: '영상 3개 + 보너스 5 크레딧',
    features: ['35 크레딧 (30+5 보너스)', 'Full HD 영상 렌더링', '우선 렌더링', '이메일 지원'],
    popular: true,
  },
  {
    id: 'premium',
    name: 'Premium',
    price: 59900,
    credits: 80,
    bonus: 10,
    description: '영상 8개 + 보너스 10 크레딧',
    features: [
      '80 크레딧 (70+10 보너스)',
      'Full HD 영상 렌더링',
      '최우선 렌더링',
      '전화/이메일 지원',
      '워터마크 제거',
    ],
    popular: false,
  },
] as const;

// 구독 플랜 정의
export const SUBSCRIPTION_PLANS = [
  {
    id: 'pro-monthly',
    name: 'Pro',
    price: 59000,
    interval: 'monthly' as const,
    description: '무제한 영상 제작',
    features: [
      '무제한 영상 제작',
      'Full HD 영상 렌더링',
      '최우선 렌더링',
      '전화/이메일 지원',
      '워터마크 제거',
      '고급 템플릿 이용',
      'API 접근',
    ],
    popular: true,
  },
] as const;

// 크레딧 소모량
export const CREDIT_COSTS = {
  AI_ANIMATION: 1, // AI 애니메이션 생성: 1 크레딧/사진
  HD_RENDER: 0, // HD 영상 렌더링: 포함
  FULL_HD_RENDER: 1, // Full HD 영상 렌더링: 추가 1 크레딧
} as const;

export type CreditPackageId = (typeof CREDIT_PACKAGES)[number]['id'];
export type SubscriptionPlanId = (typeof SUBSCRIPTION_PLANS)[number]['id'];

// 결제 상태
export type PaymentStatus =
  | 'READY'
  | 'IN_PROGRESS'
  | 'WAITING_FOR_DEPOSIT'
  | 'DONE'
  | 'CANCELED'
  | 'PARTIAL_CANCELED'
  | 'ABORTED'
  | 'EXPIRED';

// 결제 요청 파라미터
export interface PaymentRequestParams {
  orderId: string;
  orderName: string;
  amount: number;
  customerName?: string;
  customerEmail?: string;
  successUrl: string;
  failUrl: string;
}

// 결제 승인 응답
export interface PaymentConfirmResponse {
  mId: string;
  version: string;
  paymentKey: string;
  orderId: string;
  orderName: string;
  currency: string;
  method: string;
  status: PaymentStatus;
  requestedAt: string;
  approvedAt: string;
  totalAmount: number;
  balanceAmount: number;
  suppliedAmount: number;
  vat: number;
  receipt?: {
    url: string;
  };
  card?: {
    company: string;
    number: string;
    installmentPlanMonths: number;
    isInterestFree: boolean;
    approveNo: string;
    useCardPoint: boolean;
    cardType: string;
    ownerType: string;
    acquireStatus: string;
  };
  virtualAccount?: {
    accountNumber: string;
    accountType: string;
    bank: string;
    customerName: string;
    dueDate: string;
    expired: boolean;
    settlementStatus: string;
  };
  transfer?: {
    bank: string;
    settlementStatus: string;
  };
  easyPay?: {
    provider: string;
    amount: number;
    discountAmount: number;
  };
}

// 주문 ID 생성
export function generateOrderId(): string {
  const timestamp = Date.now().toString(36);
  const randomStr = Math.random().toString(36).substring(2, 8);
  return `ORDER_${timestamp}_${randomStr}`.toUpperCase();
}

// 금액 포맷
export function formatPrice(price: number): string {
  return new Intl.NumberFormat('ko-KR', {
    style: 'currency',
    currency: 'KRW',
  }).format(price);
}

// 패키지 정보 조회
export function getPackageById(packageId: string) {
  return CREDIT_PACKAGES.find((pkg) => pkg.id === packageId);
}

// 구독 플랜 정보 조회
export function getSubscriptionPlanById(planId: string) {
  return SUBSCRIPTION_PLANS.find((plan) => plan.id === planId);
}

// 필요 크레딧 계산
export function calculateRequiredCredits(
  photoCount: number,
  resolution: 'hd' | 'full-hd'
): number {
  const animationCredits = photoCount * CREDIT_COSTS.AI_ANIMATION;
  const renderCredits =
    resolution === 'full-hd' ? CREDIT_COSTS.FULL_HD_RENDER : CREDIT_COSTS.HD_RENDER;
  return animationCredits + renderCredits;
}

// 서버사이드: 토스페이먼츠 결제 승인 API 호출
export async function confirmPayment(
  paymentKey: string,
  orderId: string,
  amount: number
): Promise<PaymentConfirmResponse> {
  const secretKey = TOSS_SECRET_KEY;

  if (!secretKey) {
    throw new Error('TOSS_SECRET_KEY is not configured');
  }

  const authHeader = Buffer.from(`${secretKey}:`).toString('base64');

  const response = await fetch('https://api.tosspayments.com/v1/payments/confirm', {
    method: 'POST',
    headers: {
      Authorization: `Basic ${authHeader}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      paymentKey,
      orderId,
      amount,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || '결제 승인에 실패했습니다.');
  }

  return response.json();
}

// 서버사이드: 결제 취소 API 호출
export async function cancelPayment(
  paymentKey: string,
  cancelReason: string,
  cancelAmount?: number
): Promise<PaymentConfirmResponse> {
  const secretKey = TOSS_SECRET_KEY;

  if (!secretKey) {
    throw new Error('TOSS_SECRET_KEY is not configured');
  }

  const authHeader = Buffer.from(`${secretKey}:`).toString('base64');

  const body: Record<string, unknown> = { cancelReason };
  if (cancelAmount !== undefined) {
    body.cancelAmount = cancelAmount;
  }

  const response = await fetch(
    `https://api.tosspayments.com/v1/payments/${paymentKey}/cancel`,
    {
      method: 'POST',
      headers: {
        Authorization: `Basic ${authHeader}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    }
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || '결제 취소에 실패했습니다.');
  }

  return response.json();
}
