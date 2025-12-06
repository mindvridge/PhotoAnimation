'use client';

import Link from 'next/link';
import { Coins } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CreditBalanceProps {
  credits: number;
  showLabel?: boolean;
  size?: 'sm' | 'default';
  className?: string;
}

export function CreditBalance({
  credits,
  showLabel = true,
  size = 'default',
  className,
}: CreditBalanceProps) {
  const isLow = credits < 10;

  return (
    <Link
      href="/credits"
      className={cn(
        'flex items-center gap-1.5 rounded-full border px-3 py-1.5 transition-all hover:shadow-md',
        isLow
          ? 'border-orange-200 bg-orange-50 text-orange-700 dark:border-orange-800 dark:bg-orange-950 dark:text-orange-300'
          : 'border-amber-200 bg-gradient-to-r from-amber-50 to-yellow-50 text-amber-700 dark:border-amber-800 dark:from-amber-950 dark:to-yellow-950 dark:text-amber-300',
        size === 'sm' && 'px-2 py-1 text-xs',
        className
      )}
    >
      <Coins
        className={cn(
          'text-amber-500',
          size === 'sm' ? 'h-3.5 w-3.5' : 'h-4 w-4'
        )}
      />
      <span className={cn('font-semibold', size === 'sm' ? 'text-xs' : 'text-sm')}>
        {credits.toLocaleString()}
      </span>
      {showLabel && (
        <span
          className={cn(
            'hidden text-amber-600/80 sm:inline dark:text-amber-400/80',
            size === 'sm' ? 'text-xs' : 'text-sm'
          )}
        >
          크레딧
        </span>
      )}
    </Link>
  );
}

interface CreditBalanceCardProps {
  credits: number;
  className?: string;
}

export function CreditBalanceCard({ credits, className }: CreditBalanceCardProps) {
  const isLow = credits < 10;

  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-2xl p-6',
        'bg-gradient-to-br from-amber-400 via-orange-400 to-rose-400',
        className
      )}
    >
      {/* Background decoration */}
      <div className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-white/10" />
      <div className="absolute -bottom-4 -left-4 h-20 w-20 rounded-full bg-white/10" />

      <div className="relative">
        <div className="flex items-center gap-2">
          <div className="rounded-full bg-white/20 p-2">
            <Coins className="h-5 w-5 text-white" />
          </div>
          <span className="text-sm font-medium text-white/90">보유 크레딧</span>
        </div>

        <div className="mt-4">
          <span className="text-4xl font-bold text-white">
            {credits.toLocaleString()}
          </span>
          <span className="ml-2 text-lg text-white/80">크레딧</span>
        </div>

        {isLow && (
          <p className="mt-2 text-sm text-white/80">
            크레딧이 부족합니다. 충전하세요!
          </p>
        )}

        <Link
          href="/credits"
          className="mt-4 inline-flex items-center gap-1 rounded-full bg-white px-4 py-2 text-sm font-medium text-orange-600 transition-all hover:bg-white/90 hover:shadow-lg"
        >
          크레딧 충전하기
        </Link>
      </div>
    </div>
  );
}
