'use client';

import React, { useEffect, useRef, useState } from 'react';
import { loadTossPayments, TossPaymentsWidgets } from '@tosspayments/tosspayments-sdk';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, CreditCard, AlertCircle } from 'lucide-react';
import { formatPrice, TOSS_CLIENT_KEY } from '@/lib/tosspayments';

interface PaymentWidgetProps {
  orderId: string;
  orderName: string;
  amount: number;
  customerName?: string;
  customerEmail?: string;
  onSuccess?: () => void;
  onFail?: (error: Error) => void;
}

export function PaymentWidget({
  orderId,
  orderName,
  amount,
  customerName,
  customerEmail,
  onSuccess,
  onFail,
}: PaymentWidgetProps) {
  const [widgets, setWidgets] = useState<TossPaymentsWidgets | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const paymentMethodRef = useRef<HTMLDivElement>(null);
  const agreementRef = useRef<HTMLDivElement>(null);

  // TossPayments 위젯 초기화
  useEffect(() => {
    const initWidget = async () => {
      try {
        if (!TOSS_CLIENT_KEY) {
          throw new Error('TossPayments 클라이언트 키가 설정되지 않았습니다.');
        }

        const tossPayments = await loadTossPayments(TOSS_CLIENT_KEY);
        const widgets = tossPayments.widgets({
          customerKey: customerEmail || 'guest',
        });

        // 결제 금액 설정
        await widgets.setAmount({
          currency: 'KRW',
          value: amount,
        });

        setWidgets(widgets);
        setIsLoading(false);
      } catch (err) {
        console.error('TossPayments 초기화 오류:', err);
        setError(err instanceof Error ? err.message : '결제 위젯 초기화에 실패했습니다.');
        setIsLoading(false);
      }
    };

    initWidget();
  }, [amount, customerEmail]);

  // 위젯 렌더링
  useEffect(() => {
    if (!widgets || !paymentMethodRef.current || !agreementRef.current) return;

    const renderWidgets = async () => {
      try {
        // 결제 수단 위젯 렌더링
        await widgets.renderPaymentMethods({
          selector: '#payment-method',
          variantKey: 'DEFAULT',
        });

        // 약관 동의 위젯 렌더링
        await widgets.renderAgreement({
          selector: '#agreement',
          variantKey: 'AGREEMENT',
        });
      } catch (err) {
        console.error('위젯 렌더링 오류:', err);
        setError('결제 위젯을 표시할 수 없습니다.');
      }
    };

    renderWidgets();
  }, [widgets]);

  // 결제 요청
  const handlePayment = async () => {
    if (!widgets) return;

    setIsProcessing(true);
    setError(null);

    try {
      const successUrl = `${window.location.origin}/checkout/success`;
      const failUrl = `${window.location.origin}/checkout/fail`;

      await widgets.requestPayment({
        orderId,
        orderName,
        successUrl,
        failUrl,
        customerName,
        customerEmail,
      });

      onSuccess?.();
    } catch (err) {
      console.error('결제 요청 오류:', err);
      const errorMessage = err instanceof Error ? err.message : '결제 요청에 실패했습니다.';
      setError(errorMessage);
      onFail?.(err instanceof Error ? err : new Error(errorMessage));
    } finally {
      setIsProcessing(false);
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="h-8 w-8 animate-spin text-rose-600" />
            <p className="text-sm text-gray-600 dark:text-gray-400">
              결제 위젯을 불러오는 중...
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error && !widgets) {
    return (
      <Card className="border-red-200 dark:border-red-900">
        <CardContent className="py-8">
          <div className="flex flex-col items-center gap-4 text-center">
            <AlertCircle className="h-12 w-12 text-red-500" />
            <div>
              <p className="font-medium text-red-800 dark:text-red-200">
                결제 위젯 오류
              </p>
              <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                {error}
              </p>
            </div>
            <Button
              variant="outline"
              onClick={() => window.location.reload()}
            >
              다시 시도
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* 결제 금액 요약 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            결제 정보
          </CardTitle>
          <CardDescription>주문 내역을 확인해주세요</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between border-b pb-4">
            <span className="text-gray-600 dark:text-gray-400">{orderName}</span>
            <span className="text-xl font-bold text-gray-900 dark:text-gray-100">
              {formatPrice(amount)}
            </span>
          </div>
          <div className="flex items-center justify-between pt-4">
            <span className="font-medium text-gray-900 dark:text-gray-100">
              총 결제금액
            </span>
            <span className="text-2xl font-bold text-rose-600 dark:text-rose-400">
              {formatPrice(amount)}
            </span>
          </div>
        </CardContent>
      </Card>

      {/* 결제 수단 */}
      <Card>
        <CardHeader>
          <CardTitle>결제 수단</CardTitle>
          <CardDescription>결제 수단을 선택해주세요</CardDescription>
        </CardHeader>
        <CardContent>
          <div id="payment-method" ref={paymentMethodRef} />
        </CardContent>
      </Card>

      {/* 약관 동의 */}
      <Card>
        <CardContent className="pt-6">
          <div id="agreement" ref={agreementRef} />
        </CardContent>
      </Card>

      {/* 오류 메시지 */}
      {error && (
        <div className="flex items-center gap-2 rounded-lg bg-red-50 p-4 text-red-800 dark:bg-red-950/30 dark:text-red-200">
          <AlertCircle className="h-5 w-5 shrink-0" />
          <p className="text-sm">{error}</p>
        </div>
      )}

      {/* 결제 버튼 */}
      <Button
        onClick={handlePayment}
        disabled={isProcessing || !widgets}
        className="w-full bg-rose-600 py-6 text-lg hover:bg-rose-700"
        size="lg"
      >
        {isProcessing ? (
          <>
            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
            결제 처리 중...
          </>
        ) : (
          `${formatPrice(amount)} 결제하기`
        )}
      </Button>

      <p className="text-center text-xs text-gray-500 dark:text-gray-400">
        결제 시 서비스 이용약관 및 개인정보 처리방침에 동의하게 됩니다.
      </p>
    </div>
  );
}

export default PaymentWidget;
