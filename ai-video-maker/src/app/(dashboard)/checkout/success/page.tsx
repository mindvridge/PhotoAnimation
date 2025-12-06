'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { formatPrice } from '@/lib/tosspayments';
import {
  CheckCircle,
  Loader2,
  Coins,
  Receipt,
  ArrowRight,
  AlertCircle,
  PartyPopper,
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface PaymentResult {
  paymentId: string;
  orderId: string;
  orderName: string;
  amount: number;
  method: string;
  creditsAdded: number;
  receiptUrl?: string;
  approvedAt: string;
}

function SuccessContent() {
  const searchParams = useSearchParams();
  const [paymentResult, setPaymentResult] = useState<PaymentResult | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const paymentKey = searchParams.get('paymentKey');
  const orderId = searchParams.get('orderId');
  const amount = searchParams.get('amount');

  useEffect(() => {
    if (!paymentKey || !orderId || !amount) {
      setError('결제 정보가 누락되었습니다.');
      setIsLoading(false);
      return;
    }

    // 결제 승인 API 호출
    const confirmPayment = async () => {
      try {
        const response = await fetch('/api/payments/confirm', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            paymentKey,
            orderId,
            amount: parseInt(amount),
          }),
        });

        const result = await response.json();

        if (!response.ok) {
          throw new Error(result.error || '결제 승인에 실패했습니다.');
        }

        setPaymentResult(result.data);

        // 성공 시 컨페티 효과
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 },
        });
      } catch (err) {
        console.error('Payment confirmation error:', err);
        setError(err instanceof Error ? err.message : '결제 승인 중 오류가 발생했습니다.');
      } finally {
        setIsLoading(false);
      }
    };

    confirmPayment();
  }, [paymentKey, orderId, amount]);

  if (isLoading) {
    return (
      <div className="container mx-auto max-w-lg px-4 py-16">
        <div className="flex flex-col items-center justify-center text-center">
          <Loader2 className="h-16 w-16 animate-spin text-rose-600" />
          <h2 className="mt-6 text-xl font-bold text-gray-900 dark:text-gray-100">
            결제를 확인하고 있습니다...
          </h2>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            잠시만 기다려주세요.
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto max-w-lg px-4 py-16">
        <Card className="border-red-200 dark:border-red-900">
          <CardContent className="py-12">
            <div className="flex flex-col items-center gap-4 text-center">
              <AlertCircle className="h-16 w-16 text-red-500" />
              <div>
                <h2 className="text-xl font-bold text-red-800 dark:text-red-200">
                  결제 확인 실패
                </h2>
                <p className="mt-2 text-red-600 dark:text-red-400">
                  {error}
                </p>
              </div>
              <div className="flex gap-3">
                <Button asChild variant="outline">
                  <Link href="/pricing">요금제 페이지</Link>
                </Button>
                <Button asChild>
                  <Link href="/dashboard">대시보드</Link>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!paymentResult) {
    return null;
  }

  return (
    <div className="container mx-auto max-w-lg px-4 py-16">
      <Card>
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/50">
            <CheckCircle className="h-10 w-10 text-green-600 dark:text-green-400" />
          </div>
          <CardTitle className="flex items-center justify-center gap-2 text-2xl">
            <PartyPopper className="h-6 w-6 text-yellow-500" />
            결제 완료!
            <PartyPopper className="h-6 w-6 text-yellow-500" />
          </CardTitle>
          <CardDescription>
            결제가 성공적으로 처리되었습니다
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* 결제 정보 */}
          <div className="space-y-4 rounded-lg bg-gray-50 p-4 dark:bg-gray-900">
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">주문명</span>
              <span className="font-medium text-gray-900 dark:text-gray-100">
                {paymentResult.orderName}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">결제 금액</span>
              <span className="font-medium text-gray-900 dark:text-gray-100">
                {formatPrice(paymentResult.amount)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">결제 수단</span>
              <span className="font-medium text-gray-900 dark:text-gray-100">
                {paymentResult.method}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">주문 번호</span>
              <span className="text-sm text-gray-900 dark:text-gray-100">
                {paymentResult.orderId}
              </span>
            </div>
          </div>

          {/* 크레딧 추가 안내 */}
          {paymentResult.creditsAdded > 0 && (
            <div className="flex items-center gap-4 rounded-lg border border-green-200 bg-green-50 p-4 dark:border-green-900 dark:bg-green-950/30">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/50">
                <Coins className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p className="font-medium text-green-800 dark:text-green-200">
                  크레딧이 추가되었습니다!
                </p>
                <p className="text-sm text-green-700 dark:text-green-300">
                  +{paymentResult.creditsAdded} 크레딧
                </p>
              </div>
            </div>
          )}

          {/* 영수증 */}
          {paymentResult.receiptUrl && (
            <Button
              asChild
              variant="outline"
              className="w-full"
            >
              <a
                href={paymentResult.receiptUrl}
                target="_blank"
                rel="noopener noreferrer"
              >
                <Receipt className="mr-2 h-4 w-4" />
                영수증 보기
              </a>
            </Button>
          )}

          {/* 다음 단계 */}
          <div className="flex flex-col gap-3 pt-4">
            <Button asChild className="w-full bg-rose-600 hover:bg-rose-700">
              <Link href="/create">
                영상 만들기
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button asChild variant="outline" className="w-full">
              <Link href="/dashboard">대시보드로 이동</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function CheckoutSuccessPage() {
  return (
    <Suspense
      fallback={
        <div className="container mx-auto max-w-lg px-4 py-16">
          <div className="flex flex-col items-center justify-center text-center">
            <Loader2 className="h-16 w-16 animate-spin text-rose-600" />
            <h2 className="mt-6 text-xl font-bold text-gray-900 dark:text-gray-100">
              로딩 중...
            </h2>
          </div>
        </div>
      }
    >
      <SuccessContent />
    </Suspense>
  );
}
