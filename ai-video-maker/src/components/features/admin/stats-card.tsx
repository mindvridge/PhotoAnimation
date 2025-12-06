'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { LucideIcon, TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface StatsCardProps {
  title: string;
  value: string | number;
  description?: string;
  icon?: LucideIcon;
  trend?: {
    value: number;
    label: string;
  };
  className?: string;
}

export function StatsCard({
  title,
  value,
  description,
  icon: Icon,
  trend,
  className,
}: StatsCardProps) {
  const TrendIcon =
    trend?.value && trend.value > 0
      ? TrendingUp
      : trend?.value && trend.value < 0
        ? TrendingDown
        : Minus;

  const trendColor =
    trend?.value && trend.value > 0
      ? 'text-green-600 dark:text-green-400'
      : trend?.value && trend.value < 0
        ? 'text-red-600 dark:text-red-400'
        : 'text-gray-500';

  return (
    <Card className={cn('', className)}>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
          {title}
        </CardTitle>
        {Icon && (
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-rose-100 dark:bg-rose-900/50">
            <Icon className="h-5 w-5 text-rose-600 dark:text-rose-400" />
          </div>
        )}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
          {value}
        </div>
        {(description || trend) && (
          <div className="mt-1 flex items-center gap-2">
            {trend && (
              <span className={cn('flex items-center text-xs font-medium', trendColor)}>
                <TrendIcon className="mr-1 h-3 w-3" />
                {trend.value > 0 ? '+' : ''}
                {trend.value}%
              </span>
            )}
            {description && (
              <span className="text-xs text-gray-500 dark:text-gray-400">
                {description}
              </span>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default StatsCard;
