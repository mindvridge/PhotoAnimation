'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PaymentWidget } from '@/components/features/payment';
import {
  getPackageById,
  getSubscriptionPlanById,
  formatPrice,
} from '@/lib/tosspayments';
import { ArrowLeft, Loader2, Package, AlertCircle } from 'lucide-react';

interface PaymentInfo {
  paymentId: string;
  orderId: string;
  orderName: string;
  amount: number;
  credits: number;
  customerName: string;
  customerEmail: string;
}

function CheckoutContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [paymentInfo, setPaymentInfo] = useState<PaymentInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const type = searchParams.get('type') as 'package' | 'subscription';
  const itemId = searchParams.get('id');

  // 상품 정보 조회
  const item = type === 'package'
    ? getPackageById(itemId || '')
    : getSubscriptionPlanById(itemId || '');

  useEffect(() => {
    if (!type || !itemId || !item) {
      setError('유효하지 않은 상품입니다.');
      setIsLoading(false);
      return;
    }

    // 결제 요청 API 호출
    const preparePayment = async () => {
      try {
        const response = await fetch('/api/payments/request', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ type, itemId }),
        });

        const result = await response.json();

        if (!response.ok) {
          throw new Error(result.error || '결제 준비에 실패했습니다.');
        }

        setPaymentInfo(result.data);
      } catch (err) {
        console.error('Payment preparation error:', err);
        setError(err instanceof Error ? err.message : '결제 준비 중 오류가 발생했습니다.');
      } finally {
        setIsLoading(false);
      }
    };

    preparePayment();
  }, [type, itemId, item]);

  if (isLoading) {
    return (
      <div className="container mx-auto max-w-2xl px-4 py-8">
        <div className="flex flex-col items-center justify-center py-16">
          <Loader2 className="h-12 w-12 animate-spin text-rose-600" />
          <p className="mt-4 text-gray-600 dark:text-gray-400">
            결제 정보를 준비하고 있습니다...
          </p>
        </div>
      </div>
    );
  }

  if (error || !item) {
    return (
      <div className="container mx-auto max-w-2xl px-4 py-8">
        <Card className="border-red-200 dark:border-red-900">
          <CardContent className="py-12">
            <div className="flex flex-col items-center gap-4 text-center">
              <AlertCircle className="h-16 w-16 text-red-500" />
              <div>
                <h2 className="text-xl font-bold text-red-800 dark:text-red-200">
                  결제 오류
                </h2>
                <p className="mt-2 text-red-600 dark:text-red-400">
                  {error || '유효하지 않은 상품입니다.'}
                </p>
              </div>
              <Button asChild variant="outline">
                <Link href="/pricing">요금제 페이지로 돌아가기</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!paymentInfo) {
    return (
      <div className="container mx-auto max-w-2xl px-4 py-8">
        <Card className="border-red-200 dark:border-red-900">
          <CardContent className="py-12">
            <div className="flex flex-col items-center gap-4 text-center">
              <AlertCircle className="h-16 w-16 text-red-500" />
              <div>
                <h2 className="text-xl font-bold text-red-800 dark:text-red-200">
                  결제 정보 오류
                </h2>
                <p className="mt-2 text-red-600 dark:text-red-400">
                  결제 정보를 불러올 수 없습니다.
                </p>
              </div>
              <Button asChild variant="outline">
                <Link href="/pricing">다시 시도</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-2xl px-4 py-8">
      {/* 뒤로가기 */}
      <Button
        variant="ghost"
        className="mb-6"
        onClick={() => router.back()}
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        뒤로가기
      </Button>

      {/* 헤더 */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
          결제하기
        </h1>
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          선택하신 상품을 결제해주세요
        </p>
      </div>

      {/* 선택한 상품 요약 */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            주문 상품
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-medium text-gray-900 dark:text-gray-100">
                {item.name}
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {item.description}
              </p>
              {type === 'package' && paymentInfo.credits > 0 && (
                <p className="mt-1 text-sm font-medium text-rose-600 dark:text-rose-400">
                  {paymentInfo.credits} 크레딧
                </p>
              )}
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {formatPrice(paymentInfo.amount)}
              </p>
              {type === 'subscription' && (
                <p className="text-sm text-gray-500">/ 월</p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 결제 위젯 */}
      <PaymentWidget
        orderId={paymentInfo.orderId}
        orderName={paymentInfo.orderName}
        amount={paymentInfo.amount}
        customerName={paymentInfo.customerName}
        customerEmail={paymentInfo.customerEmail}
      />
    </div>
  );
}

export default function CheckoutPage() {
  return (
    <Suspense
      fallback={
        <div className="container mx-auto max-w-2xl px-4 py-8">
          <div className="flex flex-col items-center justify-center py-16">
            <Loader2 className="h-12 w-12 animate-spin text-rose-600" />
            <p className="mt-4 text-gray-600 dark:text-gray-400">
              로딩 중...
            </p>
          </div>
        </div>
      }
    >
      <CheckoutContent />
    </Suspense>
  );
}
