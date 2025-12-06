'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Check, Sparkles, Zap, Crown } from 'lucide-react';
import { formatPrice } from '@/lib/tosspayments';

interface PricingCardProps {
  id: string;
  name: string;
  price: number;
  credits: number;
  bonus?: number;
  description: string;
  features: readonly string[];
  popular?: boolean;
  interval?: 'monthly' | 'yearly';
  type: 'package' | 'subscription';
  onSelect?: (id: string) => void;
}

const iconMap = {
  basic: Zap,
  standard: Sparkles,
  premium: Crown,
  'pro-monthly': Crown,
};

export function PricingCard({
  id,
  name,
  price,
  credits,
  bonus,
  description,
  features,
  popular = false,
  interval,
  type,
  onSelect,
}: PricingCardProps) {
  const router = useRouter();
  const Icon = iconMap[id as keyof typeof iconMap] || Zap;

  const handleSelect = () => {
    if (onSelect) {
      onSelect(id);
    } else {
      // 결제 페이지로 이동
      const params = new URLSearchParams({
        type,
        id,
      });
      router.push(`/checkout?${params.toString()}`);
    }
  };

  return (
    <Card
      className={cn(
        'relative flex flex-col transition-all duration-200 hover:shadow-lg',
        popular && 'border-rose-500 shadow-lg shadow-rose-500/10'
      )}
    >
      {popular && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
          <Badge className="bg-rose-500 text-white hover:bg-rose-600">
            인기
          </Badge>
        </div>
      )}

      <CardHeader className="text-center pb-2">
        <div
          className={cn(
            'mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full',
            popular
              ? 'bg-rose-100 text-rose-600 dark:bg-rose-900/50 dark:text-rose-400'
              : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'
          )}
        >
          <Icon className="h-6 w-6" />
        </div>
        <CardTitle className="text-xl">{name}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>

      <CardContent className="flex-1 space-y-6">
        {/* 가격 */}
        <div className="text-center">
          <div className="flex items-baseline justify-center gap-1">
            <span className="text-4xl font-bold text-gray-900 dark:text-gray-100">
              {formatPrice(price)}
            </span>
            {interval && (
              <span className="text-gray-500 dark:text-gray-400">
                /{interval === 'monthly' ? '월' : '년'}
              </span>
            )}
          </div>

          {type === 'package' && (
            <div className="mt-2 flex items-center justify-center gap-2">
              <span className="text-lg font-semibold text-rose-600 dark:text-rose-400">
                {credits} 크레딧
              </span>
              {bonus && bonus > 0 && (
                <Badge variant="secondary" className="bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-400">
                  +{bonus} 보너스
                </Badge>
              )}
            </div>
          )}

          {type === 'subscription' && (
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
              무제한 이용
            </p>
          )}
        </div>

        {/* 기능 목록 */}
        <ul className="space-y-3">
          {features.map((feature, index) => (
            <li key={index} className="flex items-start gap-3">
              <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/50">
                <Check className="h-3 w-3 text-green-600 dark:text-green-400" />
              </div>
              <span className="text-sm text-gray-600 dark:text-gray-400">
                {feature}
              </span>
            </li>
          ))}
        </ul>
      </CardContent>

      <CardFooter>
        <Button
          onClick={handleSelect}
          className={cn(
            'w-full',
            popular
              ? 'bg-rose-600 hover:bg-rose-700 text-white'
              : ''
          )}
          variant={popular ? 'default' : 'outline'}
        >
          {type === 'subscription' ? '구독하기' : '구매하기'}
        </Button>
      </CardFooter>
    </Card>
  );
}

export default PricingCard;
