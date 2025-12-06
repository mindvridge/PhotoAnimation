'use client';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { X, Play, Clock, Image, Sparkles, Coins } from 'lucide-react';
import type { TemplateData, TemplateCategory } from './template-selector';

interface TemplatePreviewModalProps {
  template: TemplateData | null;
  open: boolean;
  onClose: () => void;
  onSelect: (template: TemplateData) => void;
}

const categoryLabels: Record<Exclude<TemplateCategory, 'all'>, string> = {
  wedding: '결혼식',
  birthday: '생일',
  anniversary: '칠순/팔순',
  baby: '돌잔치',
  memorial: '추모',
};

const categoryColors: Record<Exclude<TemplateCategory, 'all'>, string> = {
  wedding: 'from-rose-400 to-pink-400',
  birthday: 'from-violet-400 to-purple-400',
  anniversary: 'from-amber-400 to-orange-400',
  baby: 'from-sky-400 to-blue-400',
  memorial: 'from-slate-400 to-gray-400',
};

export function TemplatePreviewModal({
  template,
  open,
  onClose,
  onSelect,
}: TemplatePreviewModalProps) {
  if (!open || !template) return null;

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}분 ${secs}초`;
  };

  const handleSelect = () => {
    onSelect(template);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-4xl overflow-hidden rounded-2xl bg-white shadow-2xl dark:bg-gray-900">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-black/50 text-white transition-colors hover:bg-black/70"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="grid md:grid-cols-[1fr,380px]">
          {/* Video Preview */}
          <div className="aspect-video bg-black md:aspect-auto md:min-h-[400px]">
            {template.previewUrl ? (
              <video
                src={template.previewUrl}
                controls
                autoPlay
                muted
                className="h-full w-full object-contain"
              />
            ) : (
              <div className="flex h-full w-full flex-col items-center justify-center gap-4">
                <div className="relative">
                  <img
                    src={template.thumbnail}
                    alt={template.name}
                    className="h-auto max-h-[300px] w-auto max-w-full rounded-lg object-contain opacity-50"
                  />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white/20 text-white backdrop-blur-sm">
                      <Play className="h-8 w-8" />
                    </div>
                  </div>
                </div>
                <p className="text-sm text-white/70">미리보기 영상이 준비 중입니다</p>
              </div>
            )}
          </div>

          {/* Info Panel */}
          <div className="flex flex-col border-l border-gray-200 dark:border-gray-800">
            {/* Header */}
            <div className="border-b border-gray-200 p-6 dark:border-gray-800">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">
                    {template.name}
                  </h2>
                  <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                    {template.description}
                  </p>
                </div>
                {template.isPremium && (
                  <Badge variant="premium" className="flex shrink-0 items-center gap-1">
                    <Sparkles className="h-3 w-3" />
                    프리미엄
                  </Badge>
                )}
              </div>

              <div className="mt-4">
                <Badge
                  variant="outline"
                  className={cn(
                    'border-0 bg-gradient-to-r text-white',
                    categoryColors[template.category]
                  )}
                >
                  {categoryLabels[template.category]}
                </Badge>
              </div>
            </div>

            {/* Details */}
            <div className="flex-1 p-6">
              <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100">
                템플릿 정보
              </h3>

              <dl className="mt-4 space-y-4">
                <div className="flex items-center justify-between">
                  <dt className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                    <Clock className="h-4 w-4" />
                    영상 길이
                  </dt>
                  <dd className="text-sm font-medium text-gray-900 dark:text-gray-100">
                    {formatDuration(template.duration)}
                  </dd>
                </div>

                <div className="flex items-center justify-between">
                  <dt className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                    <Image className="h-4 w-4" />
                    필요 사진 수
                  </dt>
                  <dd className="text-sm font-medium text-gray-900 dark:text-gray-100">
                    {template.minPhotos} ~ {template.maxPhotos}장
                  </dd>
                </div>

                <div className="flex items-center justify-between">
                  <dt className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                    <Coins className="h-4 w-4" />
                    필요 크레딧
                  </dt>
                  <dd className="text-sm font-semibold text-amber-600 dark:text-amber-400">
                    {template.creditCost} 크레딧
                  </dd>
                </div>
              </dl>

              {/* Features */}
              <div className="mt-6">
                <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100">
                  포함 기능
                </h3>
                <ul className="mt-3 space-y-2">
                  {[
                    '고화질 영상 출력 (1080p)',
                    '배경 음악 포함',
                    '자막 및 텍스트 편집',
                    '다운로드 무제한',
                  ].map((feature) => (
                    <li
                      key={feature}
                      className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400"
                    >
                      <svg
                        className="h-4 w-4 text-green-500"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Action */}
            <div className="border-t border-gray-200 p-6 dark:border-gray-800">
              <Button
                onClick={handleSelect}
                className="w-full bg-gradient-to-r from-rose-500 to-pink-500 hover:from-rose-600 hover:to-pink-600"
                size="lg"
              >
                이 템플릿으로 시작하기
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
