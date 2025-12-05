import { Suspense } from 'react';
import { LoginForm } from '@/components/features/auth';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '로그인 | AI Video Maker',
  description: '계정에 로그인하여 AI Video Maker 서비스를 이용하세요.',
};

function LoginFormWrapper() {
  return <LoginForm />;
}

export default function LoginPage() {
  return (
    <Suspense fallback={<LoginFormSkeleton />}>
      <LoginFormWrapper />
    </Suspense>
  );
}

function LoginFormSkeleton() {
  return (
    <div className="rounded-xl border bg-card p-6 shadow-sm">
      <div className="space-y-4">
        <div className="space-y-2 text-center">
          <div className="mx-auto h-7 w-24 animate-pulse rounded bg-muted" />
          <div className="mx-auto h-4 w-48 animate-pulse rounded bg-muted" />
        </div>
        <div className="space-y-4">
          <div className="space-y-2">
            <div className="h-4 w-16 animate-pulse rounded bg-muted" />
            <div className="h-9 w-full animate-pulse rounded bg-muted" />
          </div>
          <div className="space-y-2">
            <div className="h-4 w-16 animate-pulse rounded bg-muted" />
            <div className="h-9 w-full animate-pulse rounded bg-muted" />
          </div>
          <div className="h-11 w-full animate-pulse rounded bg-muted" />
        </div>
      </div>
    </div>
  );
}
