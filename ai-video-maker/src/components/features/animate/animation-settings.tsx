'use client';

import { cn } from '@/lib/utils';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Clock, Zap, Crown, Coins } from 'lucide-react';

interface AnimationSettingsProps {
  duration: 5 | 10;
  mode: 'standard' | 'pro';
  onDurationChange: (duration: 5 | 10) => void;
  onModeChange: (mode: 'standard' | 'pro') => void;
  photoCount: number;
  disabled?: boolean;
}

export function AnimationSettings({
  duration,
  mode,
  onDurationChange,
  onModeChange,
  photoCount,
  disabled,
}: AnimationSettingsProps) {
  // 크레딧 비용 계산
  const baseCost = mode === 'pro' ? 2 : 1;
  const durationMultiplier = duration === 10 ? 1.5 : 1;
  const totalCost = Math.ceil(photoCount * baseCost * durationMultiplier);

  return (
    <div className="space-y-6">
      {/* 영상 길이 */}
      <div className="space-y-3">
        <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">
          영상 길이
        </Label>
        <RadioGroup
          value={duration.toString()}
          onValueChange={(value) => onDurationChange(parseInt(value) as 5 | 10)}
          disabled={disabled}
          className="grid grid-cols-2 gap-3"
        >
          <label
            className={cn(
              'flex cursor-pointer items-center gap-3 rounded-xl border-2 p-4 transition-all',
              duration === 5
                ? 'border-rose-400 bg-rose-50 dark:border-rose-600 dark:bg-rose-950/30'
                : 'border-gray-200 bg-white hover:border-gray-300 dark:border-gray-700 dark:bg-gray-900 dark:hover:border-gray-600',
              disabled && 'cursor-not-allowed opacity-50'
            )}
          >
            <RadioGroupItem value="5" id="duration-5" />
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-gray-500" />
                <span className="font-medium text-gray-900 dark:text-gray-100">
                  5초
                </span>
              </div>
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                짧고 임팩트있는 애니메이션
              </p>
            </div>
          </label>

          <label
            className={cn(
              'flex cursor-pointer items-center gap-3 rounded-xl border-2 p-4 transition-all',
              duration === 10
                ? 'border-rose-400 bg-rose-50 dark:border-rose-600 dark:bg-rose-950/30'
                : 'border-gray-200 bg-white hover:border-gray-300 dark:border-gray-700 dark:bg-gray-900 dark:hover:border-gray-600',
              disabled && 'cursor-not-allowed opacity-50'
            )}
          >
            <RadioGroupItem value="10" id="duration-10" />
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-gray-500" />
                <span className="font-medium text-gray-900 dark:text-gray-100">
                  10초
                </span>
              </div>
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                더 길고 자연스러운 움직임
              </p>
            </div>
          </label>
        </RadioGroup>
      </div>

      {/* 품질 모드 */}
      <div className="space-y-3">
        <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">
          품질 모드
        </Label>
        <RadioGroup
          value={mode}
          onValueChange={(value) => onModeChange(value as 'standard' | 'pro')}
          disabled={disabled}
          className="grid grid-cols-2 gap-3"
        >
          <label
            className={cn(
              'flex cursor-pointer items-center gap-3 rounded-xl border-2 p-4 transition-all',
              mode === 'standard'
                ? 'border-rose-400 bg-rose-50 dark:border-rose-600 dark:bg-rose-950/30'
                : 'border-gray-200 bg-white hover:border-gray-300 dark:border-gray-700 dark:bg-gray-900 dark:hover:border-gray-600',
              disabled && 'cursor-not-allowed opacity-50'
            )}
          >
            <RadioGroupItem value="standard" id="mode-standard" />
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <Zap className="h-4 w-4 text-blue-500" />
                <span className="font-medium text-gray-900 dark:text-gray-100">
                  스탠다드
                </span>
              </div>
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                빠른 생성, 1 크레딧/장
              </p>
            </div>
          </label>

          <label
            className={cn(
              'flex cursor-pointer items-center gap-3 rounded-xl border-2 p-4 transition-all',
              mode === 'pro'
                ? 'border-rose-400 bg-rose-50 dark:border-rose-600 dark:bg-rose-950/30'
                : 'border-gray-200 bg-white hover:border-gray-300 dark:border-gray-700 dark:bg-gray-900 dark:hover:border-gray-600',
              disabled && 'cursor-not-allowed opacity-50'
            )}
          >
            <RadioGroupItem value="pro" id="mode-pro" />
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <Crown className="h-4 w-4 text-amber-500" />
                <span className="font-medium text-gray-900 dark:text-gray-100">
                  프로
                </span>
              </div>
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                높은 품질, 2 크레딧/장
              </p>
            </div>
          </label>
        </RadioGroup>
      </div>

      {/* 비용 안내 */}
      <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 dark:border-amber-900 dark:bg-amber-950/30">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Coins className="h-5 w-5 text-amber-600 dark:text-amber-400" />
            <span className="font-medium text-amber-800 dark:text-amber-300">
              예상 비용
            </span>
          </div>
          <div className="text-right">
            <span className="text-2xl font-bold text-amber-600 dark:text-amber-400">
              {totalCost}
            </span>
            <span className="ml-1 text-sm text-amber-700 dark:text-amber-300">
              크레딧
            </span>
          </div>
        </div>
        <p className="mt-2 text-xs text-amber-700 dark:text-amber-400">
          {photoCount}장 × {baseCost} 크레딧
          {duration === 10 && ' × 1.5 (10초)'}
        </p>
      </div>
    </div>
  );
}
