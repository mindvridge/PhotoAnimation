'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import {
  CheckCircle,
  XCircle,
  Loader2,
  Clock,
  Film,
  Upload,
  FileVideo,
  AlertTriangle,
} from 'lucide-react';
import type { RenderStatus } from '@/lib/queue/render-queue';

interface RenderProgressProps {
  status: RenderStatus;
  progress: number;
  currentStep: string;
  estimatedTime?: number;
  error?: string;
  onRetry?: () => void;
  onCancel?: () => void;
}

// 렌더링 단계 정의
const RENDER_STAGES = [
  { id: 'preparing', label: '준비', icon: Clock },
  { id: 'rendering', label: '렌더링', icon: Film },
  { id: 'encoding', label: '인코딩', icon: FileVideo },
  { id: 'uploading', label: '저장', icon: Upload },
  { id: 'completed', label: '완료', icon: CheckCircle },
];

export function RenderProgress({
  status,
  progress,
  currentStep,
  estimatedTime,
  error,
  onRetry,
  onCancel,
}: RenderProgressProps) {
  const currentStageIndex = RENDER_STAGES.findIndex((s) => s.id === status);

  // 예상 시간 포맷
  const formatTime = (seconds: number) => {
    if (seconds < 60) return `${seconds}초`;
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return secs > 0 ? `${minutes}분 ${secs}초` : `${minutes}분`;
  };

  if (status === 'failed') {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-4 rounded-xl border border-red-200 bg-red-50 p-6 dark:border-red-900 dark:bg-red-950/30">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/50">
            <XCircle className="h-6 w-6 text-red-600 dark:text-red-400" />
          </div>
          <div className="flex-1">
            <h3 className="font-medium text-red-800 dark:text-red-200">
              렌더링 실패
            </h3>
            <p className="text-sm text-red-700 dark:text-red-300">
              {error || '알 수 없는 오류가 발생했습니다.'}
            </p>
          </div>
          {onRetry && (
            <Button onClick={onRetry} variant="outline" size="sm">
              다시 시도
            </Button>
          )}
        </div>
      </div>
    );
  }

  if (status === 'completed') {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-4 rounded-xl border border-green-200 bg-green-50 p-6 dark:border-green-900 dark:bg-green-950/30">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/50">
            <CheckCircle className="h-6 w-6 text-green-600 dark:text-green-400" />
          </div>
          <div className="flex-1">
            <h3 className="font-medium text-green-800 dark:text-green-200">
              렌더링 완료!
            </h3>
            <p className="text-sm text-green-700 dark:text-green-300">
              영상이 성공적으로 생성되었습니다.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 상태 헤더 */}
      <div className="flex items-center gap-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-rose-100 dark:bg-rose-900/50">
          <Loader2 className="h-6 w-6 animate-spin text-rose-600 dark:text-rose-400" />
        </div>
        <div className="flex-1">
          <h3 className="font-medium text-gray-900 dark:text-gray-100">
            영상 생성 중...
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {currentStep}
          </p>
        </div>
        {estimatedTime && estimatedTime > 0 && (
          <div className="text-right">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              예상 남은 시간
            </p>
            <p className="font-medium text-gray-900 dark:text-gray-100">
              약 {formatTime(Math.ceil(estimatedTime * (1 - progress / 100)))}
            </p>
          </div>
        )}
      </div>

      {/* 진행률 바 */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-600 dark:text-gray-400">진행률</span>
          <span className="font-medium text-gray-900 dark:text-gray-100">
            {progress}%
          </span>
        </div>
        <Progress value={progress} className="h-3" />
      </div>

      {/* 단계 표시 */}
      <div className="flex items-center justify-between">
        {RENDER_STAGES.slice(0, 4).map((stage, index) => {
          const StageIcon = stage.icon;
          const isActive = stage.id === status;
          const isCompleted = currentStageIndex > index;
          const isPending = currentStageIndex < index;

          return (
            <React.Fragment key={stage.id}>
              <div className="flex flex-col items-center gap-1">
                <div
                  className={cn(
                    'flex h-10 w-10 items-center justify-center rounded-full transition-all',
                    isActive &&
                      'bg-rose-100 text-rose-600 dark:bg-rose-900/50 dark:text-rose-400',
                    isCompleted &&
                      'bg-green-100 text-green-600 dark:bg-green-900/50 dark:text-green-400',
                    isPending &&
                      'bg-gray-100 text-gray-400 dark:bg-gray-800 dark:text-gray-500'
                  )}
                >
                  {isActive ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : isCompleted ? (
                    <CheckCircle className="h-5 w-5" />
                  ) : (
                    <StageIcon className="h-5 w-5" />
                  )}
                </div>
                <span
                  className={cn(
                    'text-xs',
                    isActive && 'font-medium text-rose-600 dark:text-rose-400',
                    isCompleted && 'text-green-600 dark:text-green-400',
                    isPending && 'text-gray-400 dark:text-gray-500'
                  )}
                >
                  {stage.label}
                </span>
              </div>
              {index < 3 && (
                <div
                  className={cn(
                    'h-0.5 flex-1 mx-2',
                    currentStageIndex > index
                      ? 'bg-green-400 dark:bg-green-600'
                      : 'bg-gray-200 dark:bg-gray-700'
                  )}
                />
              )}
            </React.Fragment>
          );
        })}
      </div>

      {/* 취소 버튼 */}
      {onCancel && (
        <div className="flex justify-center">
          <Button variant="ghost" size="sm" onClick={onCancel}>
            렌더링 취소
          </Button>
        </div>
      )}

      {/* 경고 메시지 */}
      <div className="flex items-start gap-2 rounded-lg bg-amber-50 p-3 dark:bg-amber-950/30">
        <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400" />
        <p className="text-xs text-amber-700 dark:text-amber-300">
          렌더링이 진행되는 동안 이 페이지를 닫지 마세요.
          영상 생성에는 사진 수에 따라 수 분이 소요될 수 있습니다.
        </p>
      </div>
    </div>
  );
}

export default RenderProgress;
