'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { AlertTriangle, RefreshCcw, Home } from 'lucide-react';
import Link from 'next/link';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    // 에러 로깅 (Sentry 등과 연동 가능)
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  handleReset = (): void => {
    this.setState({ hasError: false, error: null });
  };

  render(): ReactNode {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="flex min-h-[400px] flex-col items-center justify-center p-8">
          <div className="text-center">
            {/* 에러 아이콘 */}
            <div className="mb-6">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-900/30">
                <AlertTriangle className="h-8 w-8 text-amber-500" />
              </div>
            </div>

            {/* 제목 */}
            <h2 className="mb-2 text-xl font-semibold text-gray-900 dark:text-gray-100">
              문제가 발생했습니다
            </h2>

            {/* 설명 */}
            <p className="mb-6 text-gray-600 dark:text-gray-400">
              컴포넌트를 렌더링하는 중 오류가 발생했습니다.
            </p>

            {/* 에러 메시지 (개발 환경에서만) */}
            {process.env.NODE_ENV === 'development' && this.state.error && (
              <div className="mb-6 max-w-md overflow-auto rounded-lg bg-gray-100 p-3 text-left dark:bg-gray-800">
                <p className="font-mono text-sm text-red-600 dark:text-red-400">
                  {this.state.error.message}
                </p>
              </div>
            )}

            {/* 버튼 그룹 */}
            <div className="flex flex-col gap-2 sm:flex-row sm:justify-center">
              <Button onClick={this.handleReset} size="sm">
                <RefreshCcw className="mr-2 h-4 w-4" />
                다시 시도
              </Button>
              <Button asChild variant="outline" size="sm">
                <Link href="/">
                  <Home className="mr-2 h-4 w-4" />
                  홈으로
                </Link>
              </Button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
