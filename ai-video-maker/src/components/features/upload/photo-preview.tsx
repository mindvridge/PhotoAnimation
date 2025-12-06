'use client';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  CheckCircle,
  AlertTriangle,
  XCircle,
  Image as ImageIcon,
  Maximize2,
  Info,
  Clock,
  Sparkles,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Database } from '@/types/database';

type Photo = Database['public']['Tables']['photos']['Row'];

interface PhotoPreviewProps {
  photo: Photo | null;
  open: boolean;
  onClose: () => void;
  onDelete?: (photoId: string) => void;
}

export function PhotoPreview({ photo, open, onClose, onDelete }: PhotoPreviewProps) {
  if (!photo) return null;

  const getStatusInfo = () => {
    switch (photo.animation_status) {
      case 'completed':
        return {
          label: 'AI 애니메이션 완료',
          status: 'good' as const,
          icon: <CheckCircle className="h-4 w-4 text-green-500" />,
          message: '애니메이션이 성공적으로 생성되었습니다.',
        };
      case 'processing':
        return {
          label: 'AI 처리 중',
          status: 'warning' as const,
          icon: <Clock className="h-4 w-4 text-amber-500 animate-spin" />,
          message: '애니메이션을 생성하고 있습니다...',
        };
      case 'failed':
        return {
          label: '처리 실패',
          status: 'error' as const,
          icon: <XCircle className="h-4 w-4 text-red-500" />,
          message: '애니메이션 생성에 실패했습니다. 다시 시도해주세요.',
        };
      default:
        return {
          label: '대기 중',
          status: 'pending' as const,
          icon: <Clock className="h-4 w-4 text-gray-400" />,
          message: '아직 AI 애니메이션 처리가 시작되지 않았습니다.',
        };
    }
  };

  const statusInfo = getStatusInfo();

  const getStatusBadge = () => {
    switch (photo.animation_status) {
      case 'completed':
        return (
          <Badge className="bg-green-500">
            <Sparkles className="mr-1 h-3 w-3" />
            애니메이션 완료
          </Badge>
        );
      case 'processing':
        return (
          <Badge className="bg-amber-500">
            <Clock className="mr-1 h-3 w-3 animate-spin" />
            처리 중
          </Badge>
        );
      case 'failed':
        return (
          <Badge className="bg-red-500">
            <AlertTriangle className="mr-1 h-3 w-3" />
            실패
          </Badge>
        );
      default:
        return null;
    }
  };

  return (
    <Dialog open={open} onOpenChange={() => onClose()}>
      <DialogContent className="max-w-4xl p-0 overflow-hidden">
        <DialogHeader className="px-6 pt-6">
          <DialogTitle className="flex items-center gap-2">
            <ImageIcon className="h-5 w-5 text-rose-500" />
            사진 상세 정보
          </DialogTitle>
        </DialogHeader>

        <div className="grid gap-6 p-6 md:grid-cols-2">
          {/* 이미지 미리보기 */}
          <div className="relative aspect-square overflow-hidden rounded-xl bg-gray-100 dark:bg-gray-800">
            <img
              src={photo.original_url}
              alt="사진 미리보기"
              className="h-full w-full object-contain"
            />
            {getStatusBadge() && (
              <div className="absolute right-3 top-3">
                {getStatusBadge()}
              </div>
            )}
          </div>

          {/* 정보 패널 */}
          <div className="space-y-6">
            {/* 상태 정보 */}
            <div className="space-y-3">
              <h4 className="font-medium text-gray-900 dark:text-gray-100">
                처리 상태
              </h4>
              <div
                className={cn(
                  'flex items-center justify-between rounded-lg border p-3',
                  statusInfo.status === 'good'
                    ? 'border-green-200 bg-green-50 dark:border-green-900 dark:bg-green-950/30'
                    : statusInfo.status === 'warning'
                    ? 'border-amber-200 bg-amber-50 dark:border-amber-900 dark:bg-amber-950/30'
                    : statusInfo.status === 'error'
                    ? 'border-red-200 bg-red-50 dark:border-red-900 dark:bg-red-950/30'
                    : 'border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-800'
                )}
              >
                <div className="flex items-center gap-2">
                  {statusInfo.icon}
                  <span className="font-medium text-gray-900 dark:text-gray-100">
                    {statusInfo.label}
                  </span>
                </div>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {statusInfo.message}
              </p>
            </div>

            {/* 애니메이션 미리보기 (완료된 경우) */}
            {photo.animation_status === 'completed' && photo.animated_url && (
              <div className="space-y-3">
                <h4 className="font-medium text-gray-900 dark:text-gray-100">
                  AI 애니메이션
                </h4>
                <div className="overflow-hidden rounded-lg border dark:border-gray-700">
                  <video
                    src={photo.animated_url}
                    className="w-full"
                    autoPlay
                    loop
                    muted
                    playsInline
                  />
                </div>
              </div>
            )}

            {/* 사진 정보 */}
            <div className="space-y-3">
              <h4 className="font-medium text-gray-900 dark:text-gray-100">
                사진 정보
              </h4>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="rounded-lg bg-gray-100 p-2 dark:bg-gray-800">
                  <span className="text-gray-500">순서:</span>{' '}
                  <span className="font-medium">{photo.order_index + 1}번째</span>
                </div>
                <div className="rounded-lg bg-gray-100 p-2 dark:bg-gray-800">
                  <span className="text-gray-500">생성일:</span>{' '}
                  <span className="font-medium">
                    {new Date(photo.created_at).toLocaleDateString('ko-KR')}
                  </span>
                </div>
              </div>
            </div>

            {/* 안내 */}
            <div className="flex items-start gap-2 rounded-lg bg-blue-50 p-3 text-sm dark:bg-blue-950/30">
              <Info className="h-5 w-5 shrink-0 text-blue-500" />
              <div className="text-blue-700 dark:text-blue-300">
                <p className="font-medium">AI 애니메이션 생성 시</p>
                <p className="mt-1 text-xs text-blue-600 dark:text-blue-400">
                  얼굴 영역을 기반으로 자연스러운 움직임과 표정이 생성됩니다.
                  정면 사진일수록 더 좋은 결과를 얻을 수 있습니다.
                </p>
              </div>
            </div>

            {/* 액션 버튼 */}
            <div className="flex gap-2">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => window.open(photo.original_url, '_blank')}
              >
                <Maximize2 className="mr-2 h-4 w-4" />
                원본 보기
              </Button>
              {onDelete && (
                <Button
                  variant="destructive"
                  onClick={() => {
                    onDelete(photo.id);
                    onClose();
                  }}
                >
                  삭제
                </Button>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
