'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Home, RefreshCcw, AlertTriangle } from 'lucide-react';

interface ErrorPageProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function Error({ error, reset }: ErrorPageProps) {
  useEffect(() => {
    // 에러 로깅 (Sentry 등과 연동 가능)
    console.error('Application error:', error);
  }, [error]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-gray-50 to-gray-100 px-4 dark:from-gray-900 dark:to-gray-950">
      <div className="text-center">
        {/* 에러 아이콘 */}
        <div className="mb-8">
          <div className="mx-auto flex h-32 w-32 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-900/30">
            <AlertTriangle className="h-16 w-16 text-amber-500" strokeWidth={1.5} />
          </div>
        </div>

        {/* 제목 */}
        <h1 className="mb-4 text-2xl font-bold text-gray-900 dark:text-gray-100">
          문제가 발생했습니다
        </h1>

        {/* 설명 */}
        <p className="mb-2 max-w-md text-gray-600 dark:text-gray-400">
          죄송합니다. 페이지를 로드하는 중 오류가 발생했습니다.
        </p>
        <p className="mb-8 max-w-md text-sm text-gray-500 dark:text-gray-500">
          잠시 후 다시 시도해주세요. 문제가 계속되면 고객센터로 문의해주세요.
        </p>

        {/* 에러 디테일 (개발 환경에서만) */}
        {process.env.NODE_ENV === 'development' && (
          <div className="mb-8 max-w-lg overflow-auto rounded-lg bg-gray-100 p-4 text-left dark:bg-gray-800">
            <p className="mb-2 font-mono text-sm text-red-600 dark:text-red-400">
              {error.name}: {error.message}
            </p>
            {error.digest && (
              <p className="font-mono text-xs text-gray-500">
                Error ID: {error.digest}
              </p>
            )}
          </div>
        )}

        {/* 버튼 그룹 */}
        <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Button onClick={reset} size="lg">
            <RefreshCcw className="mr-2 h-4 w-4" />
            다시 시도
          </Button>
          <Button asChild variant="outline" size="lg">
            <Link href="/">
              <Home className="mr-2 h-4 w-4" />
              홈으로 이동
            </Link>
          </Button>
        </div>

        {/* 도움말 링크 */}
        <p className="mt-8 text-sm text-gray-500 dark:text-gray-500">
          문제가 계속되면{' '}
          <Link
            href="mailto:support@aivideomaker.io"
            className="text-rose-500 hover:underline"
          >
            고객센터
          </Link>
          로 문의해주세요.
        </p>
      </div>
    </div>
  );
}
