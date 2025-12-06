'use client';

import React, { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { XCircle, ArrowLeft, RefreshCw, HelpCircle, Loader2 } from 'lucide-react';

// 에러 코드별 메시지
const ERROR_MESSAGES: Record<string, string> = {
  PAY_PROCESS_CANCELED: '결제가 취소되었습니다.',
  PAY_PROCESS_ABORTED: '결제가 중단되었습니다.',
  REJECT_CARD_COMPANY: '카드사에서 결제가 거절되었습니다.',
  EXCEED_MAX_DAILY_PAYMENT_COUNT: '일일 결제 횟수를 초과했습니다.',
  EXCEED_MAX_PAYMENT_AMOUNT: '결제 한도를 초과했습니다.',
  INVALID_CARD_NUMBER: '유효하지 않은 카드 번호입니다.',
  INVALID_CARD_EXPIRY: '카드 유효기간이 만료되었습니다.',
  INSUFFICIENT_BALANCE: '잔액이 부족합니다.',
  NOT_AVAILABLE_PAYMENT: '현재 이용할 수 없는 결제 수단입니다.',
  UNKNOWN_ERROR: '알 수 없는 오류가 발생했습니다.',
};

// 에러 코드별 도움말
const ERROR_HELP: Record<string, string> = {
  PAY_PROCESS_CANCELED: '다시 결제를 진행하시거나, 다른 결제 수단을 선택해주세요.',
  REJECT_CARD_COMPANY: '카드사로 문의하시거나, 다른 카드로 결제해주세요.',
  EXCEED_MAX_DAILY_PAYMENT_COUNT: '내일 다시 시도하시거나, 다른 결제 수단을 이용해주세요.',
  EXCEED_MAX_PAYMENT_AMOUNT: '결제 금액을 분할하시거나, 다른 카드를 사용해주세요.',
  INVALID_CARD_NUMBER: '카드 번호를 다시 확인해주세요.',
  INVALID_CARD_EXPIRY: '유효기간이 만료되지 않은 카드를 사용해주세요.',
  INSUFFICIENT_BALANCE: '충분한 잔액이 있는 카드나 계좌로 결제해주세요.',
  NOT_AVAILABLE_PAYMENT: '다른 결제 수단을 선택해주세요.',
};

function FailContent() {
  const searchParams = useSearchParams();

  const code = searchParams.get('code') || 'UNKNOWN_ERROR';
  const message = searchParams.get('message') || ERROR_MESSAGES[code] || ERROR_MESSAGES.UNKNOWN_ERROR;
  const orderId = searchParams.get('orderId');

  const helpText = ERROR_HELP[code] || '문제가 지속되면 고객센터로 문의해주세요.';

  return (
    <div className="container mx-auto max-w-lg px-4 py-16">
      <Card className="border-red-200 dark:border-red-900">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/50">
            <XCircle className="h-10 w-10 text-red-600 dark:text-red-400" />
          </div>
          <CardTitle className="text-2xl text-red-800 dark:text-red-200">
            결제 실패
          </CardTitle>
          <CardDescription className="text-red-600 dark:text-red-400">
            {message}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* 에러 정보 */}
          <div className="space-y-3 rounded-lg bg-gray-50 p-4 dark:bg-gray-900">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600 dark:text-gray-400">에러 코드</span>
              <span className="font-mono text-gray-900 dark:text-gray-100">
                {code}
              </span>
            </div>
            {orderId && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400">주문 번호</span>
                <span className="font-mono text-gray-900 dark:text-gray-100">
                  {orderId}
                </span>
              </div>
            )}
          </div>

          {/* 도움말 */}
          <div className="flex items-start gap-3 rounded-lg bg-blue-50 p-4 dark:bg-blue-950/30">
            <HelpCircle className="mt-0.5 h-5 w-5 shrink-0 text-blue-600 dark:text-blue-400" />
            <div>
              <p className="font-medium text-blue-800 dark:text-blue-200">
                해결 방법
              </p>
              <p className="mt-1 text-sm text-blue-700 dark:text-blue-300">
                {helpText}
              </p>
            </div>
          </div>

          {/* 버튼 */}
          <div className="flex flex-col gap-3 pt-4">
            <Button asChild className="w-full">
              <Link href="/pricing">
                <RefreshCw className="mr-2 h-4 w-4" />
                다시 결제하기
              </Link>
            </Button>
            <Button asChild variant="outline" className="w-full">
              <Link href="/dashboard">
                <ArrowLeft className="mr-2 h-4 w-4" />
                대시보드로 돌아가기
              </Link>
            </Button>
          </div>

          {/* 고객센터 안내 */}
          <div className="text-center text-sm text-gray-500 dark:text-gray-400">
            문제가 계속되면{' '}
            <a
              href="mailto:support@example.com"
              className="text-rose-600 underline hover:text-rose-700 dark:text-rose-400"
            >
              고객센터
            </a>
            로 문의해주세요.
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function CheckoutFailPage() {
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
      <FailContent />
    </Suspense>
  );
}
