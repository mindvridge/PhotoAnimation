'use client';

import { cn } from '@/lib/utils';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import {
  CheckCircle,
  XCircle,
  Loader2,
  Clock,
  RefreshCw,
  Play,
  AlertTriangle,
} from 'lucide-react';
import type { Database } from '@/types/database';

type Photo = Database['public']['Tables']['photos']['Row'];

interface AnimationJobStatus {
  id: string;
  photoId: string;
  status: 'queued' | 'processing' | 'completed' | 'failed';
  progress: number;
  error?: string;
}

interface AnimationProgressProps {
  photos: Photo[];
  jobs: AnimationJobStatus[];
  isGenerating: boolean;
  onRetry: (jobId: string) => void;
  onCancel?: () => void;
}

export function AnimationProgress({
  photos,
  jobs,
  isGenerating,
  onRetry,
  onCancel,
}: AnimationProgressProps) {
  // 전체 진행률 계산
  const totalProgress =
    jobs.length > 0
      ? Math.round(jobs.reduce((sum, j) => sum + j.progress, 0) / jobs.length)
      : 0;

  const completedCount = jobs.filter((j) => j.status === 'completed').length;
  const failedCount = jobs.filter((j) => j.status === 'failed').length;
  const processingCount = jobs.filter((j) => j.status === 'processing').length;
  const queuedCount = jobs.filter((j) => j.status === 'queued').length;

  // 예상 남은 시간 (대략적)
  const estimatedTimePerPhoto = 60; // 초
  const remainingPhotos = queuedCount + processingCount;
  const estimatedMinutes = Math.ceil((remainingPhotos * estimatedTimePerPhoto) / 60);

  const getPhotoJob = (photoId: string) => {
    return jobs.find((j) => j.photoId === photoId);
  };

  const getStatusIcon = (status: AnimationJobStatus['status']) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'failed':
        return <XCircle className="h-5 w-5 text-red-500" />;
      case 'processing':
        return <Loader2 className="h-5 w-5 animate-spin text-rose-500" />;
      case 'queued':
        return <Clock className="h-5 w-5 text-gray-400" />;
      default:
        return null;
    }
  };

  const getStatusText = (status: AnimationJobStatus['status']) => {
    switch (status) {
      case 'completed':
        return '완료';
      case 'failed':
        return '실패';
      case 'processing':
        return '생성 중...';
      case 'queued':
        return '대기 중';
      default:
        return '';
    }
  };

  if (jobs.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4">
      {/* 전체 진행률 */}
      <div className="rounded-xl border bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            {isGenerating ? (
              <Loader2 className="h-5 w-5 animate-spin text-rose-500" />
            ) : completedCount === photos.length ? (
              <CheckCircle className="h-5 w-5 text-green-500" />
            ) : failedCount > 0 ? (
              <AlertTriangle className="h-5 w-5 text-amber-500" />
            ) : (
              <Play className="h-5 w-5 text-gray-400" />
            )}
            <span className="font-medium text-gray-900 dark:text-gray-100">
              {isGenerating
                ? 'AI 애니메이션 생성 중...'
                : completedCount === photos.length
                ? '모든 애니메이션 생성 완료!'
                : failedCount > 0
                ? `${failedCount}개 실패`
                : '생성 준비 완료'}
            </span>
          </div>
          <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
            {completedCount}/{photos.length}
          </span>
        </div>

        <Progress value={totalProgress} className="h-2" />

        <div className="mt-2 flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
          <span>{totalProgress}% 완료</span>
          {isGenerating && remainingPhotos > 0 && (
            <span>예상 남은 시간: 약 {estimatedMinutes}분</span>
          )}
        </div>

        {onCancel && isGenerating && (
          <Button
            variant="outline"
            size="sm"
            className="mt-3 w-full"
            onClick={onCancel}
          >
            생성 취소
          </Button>
        )}
      </div>

      {/* 개별 사진 상태 */}
      <div className="space-y-2">
        <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">
          사진별 상태
        </h4>
        <div className="max-h-[300px] space-y-2 overflow-y-auto">
          {photos.map((photo, index) => {
            const job = getPhotoJob(photo.id);
            const status = job?.status || 'queued';
            const progress = job?.progress || 0;

            return (
              <div
                key={photo.id}
                className={cn(
                  'flex items-center gap-3 rounded-lg border p-3 transition-all',
                  status === 'completed'
                    ? 'border-green-200 bg-green-50 dark:border-green-900 dark:bg-green-950/30'
                    : status === 'failed'
                    ? 'border-red-200 bg-red-50 dark:border-red-900 dark:bg-red-950/30'
                    : status === 'processing'
                    ? 'border-rose-200 bg-rose-50 dark:border-rose-900 dark:bg-rose-950/30'
                    : 'border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900'
                )}
              >
                {/* 썸네일 */}
                <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-lg">
                  <img
                    src={photo.original_url}
                    alt={`사진 ${index + 1}`}
                    className="h-full w-full object-cover"
                  />
                  {status === 'completed' && photo.animated_url && (
                    <div className="absolute inset-0 flex items-center justify-center bg-green-500/80">
                      <CheckCircle className="h-6 w-6 text-white" />
                    </div>
                  )}
                </div>

                {/* 상태 정보 */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    {getStatusIcon(status)}
                    <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                      사진 {index + 1}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {getStatusText(status)}
                    </span>
                    {status === 'processing' && (
                      <span className="text-xs text-rose-500">{progress}%</span>
                    )}
                    {job?.error && (
                      <span className="text-xs text-red-500 truncate">
                        {job.error}
                      </span>
                    )}
                  </div>
                  {status === 'processing' && (
                    <Progress value={progress} className="mt-1 h-1" />
                  )}
                </div>

                {/* 액션 버튼 */}
                {status === 'failed' && job && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="shrink-0"
                    onClick={() => onRetry(job.id)}
                  >
                    <RefreshCw className="h-4 w-4" />
                  </Button>
                )}

                {/* 완료된 경우 미리보기 */}
                {status === 'completed' && photo.animated_url && (
                  <video
                    src={photo.animated_url}
                    className="h-12 w-12 shrink-0 rounded-lg object-cover"
                    autoPlay
                    loop
                    muted
                    playsInline
                  />
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
