'use client';

import Link from 'next/link';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Play, Eye, Sparkles, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';

export type TemplateCategory = 'wedding' | 'birthday' | 'anniversary' | 'baby' | 'memorial' | 'general';

export interface Template {
  id: string;
  name: string;
  description: string;
  thumbnail: string;
  previewUrl?: string;
  category: TemplateCategory;
  isPremium: boolean;
  creditCost: number;
  duration: number; // in seconds
  usageCount?: number;
}

interface TemplateCardProps {
  template: Template;
  onPreview?: (template: Template) => void;
}

const categoryLabels: Record<TemplateCategory, string> = {
  wedding: '결혼식',
  birthday: '생일',
  anniversary: '칠순/팔순',
  baby: '돌잔치',
  memorial: '추모',
  general: '일반',
};

const categoryColors: Record<TemplateCategory, string> = {
  wedding: 'from-rose-400 to-pink-400',
  birthday: 'from-violet-400 to-purple-400',
  anniversary: 'from-amber-400 to-orange-400',
  baby: 'from-sky-400 to-blue-400',
  memorial: 'from-slate-400 to-gray-400',
  general: 'from-emerald-400 to-teal-400',
};

export function TemplateCard({ template, onPreview }: TemplateCardProps) {
  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <Card className="group overflow-hidden transition-all hover:shadow-xl hover:-translate-y-1">
      {/* Thumbnail */}
      <div className="relative aspect-video overflow-hidden bg-gray-100 dark:bg-gray-800">
        <img
          src={template.thumbnail}
          alt={template.name}
          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
        />

        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

        {/* Premium Badge */}
        {template.isPremium && (
          <div className="absolute right-3 top-3">
            <Badge variant="premium" className="flex items-center gap-1">
              <Sparkles className="h-3 w-3" />
              프리미엄
            </Badge>
          </div>
        )}

        {/* Duration */}
        <div className="absolute bottom-3 left-3 flex items-center gap-1 text-xs text-white">
          <Clock className="h-3.5 w-3.5" />
          {formatDuration(template.duration)}
        </div>

        {/* Preview Button */}
        <button
          onClick={() => onPreview?.(template)}
          className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition-opacity group-hover:opacity-100"
        >
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-white/90 text-rose-500 transition-transform hover:scale-110">
            <Play className="h-6 w-6 fill-current" />
          </div>
        </button>
      </div>

      {/* Content */}
      <div className="p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-gray-900 dark:text-gray-100 truncate">
              {template.name}
            </h3>
            <p className="mt-0.5 text-sm text-gray-500 dark:text-gray-400 line-clamp-1">
              {template.description}
            </p>
          </div>
          <Badge
            variant="outline"
            className={cn(
              'shrink-0 bg-gradient-to-r text-white border-0',
              categoryColors[template.category]
            )}
          >
            {categoryLabels[template.category]}
          </Badge>
        </div>

        <div className="mt-4 flex items-center justify-between">
          <div className="flex items-center gap-1 text-sm text-amber-600 dark:text-amber-400">
            <span className="font-semibold">{template.creditCost}</span>
            <span>크레딧</span>
          </div>
          <Link href={`/projects/new?template=${template.id}`}>
            <Button size="sm" className="bg-gradient-to-r from-rose-500 to-pink-500 hover:from-rose-600 hover:to-pink-600">
              사용하기
            </Button>
          </Link>
        </div>
      </div>
    </Card>
  );
}

interface TemplatePreviewModalProps {
  template: Template | null;
  open: boolean;
  onClose: () => void;
}

export function TemplatePreviewModal({
  template,
  open,
  onClose,
}: TemplatePreviewModalProps) {
  if (!open || !template) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-3xl overflow-hidden rounded-2xl bg-white shadow-2xl dark:bg-gray-900">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-black/50 text-white transition-colors hover:bg-black/70"
        >
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* Video Preview */}
        <div className="aspect-video bg-black">
          {template.previewUrl ? (
            <video
              src={template.previewUrl}
              controls
              autoPlay
              className="h-full w-full"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center">
              <div className="text-center text-white">
                <Eye className="mx-auto h-12 w-12 opacity-50" />
                <p className="mt-2 text-sm opacity-70">미리보기 영상이 없습니다</p>
              </div>
            </div>
          )}
        </div>

        {/* Info */}
        <div className="p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">
                {template.name}
              </h2>
              <p className="mt-1 text-gray-600 dark:text-gray-400">
                {template.description}
              </p>
            </div>
            {template.isPremium && (
              <Badge variant="premium" className="flex items-center gap-1 shrink-0">
                <Sparkles className="h-3 w-3" />
                프리미엄
              </Badge>
            )}
          </div>

          <div className="mt-6 flex items-center justify-between">
            <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
              <div className="flex items-center gap-1">
                <Clock className="h-4 w-4" />
                <span>{Math.floor(template.duration / 60)}분 {template.duration % 60}초</span>
              </div>
              <Badge
                variant="outline"
                className={cn(
                  'bg-gradient-to-r text-white border-0',
                  categoryColors[template.category]
                )}
              >
                {categoryLabels[template.category]}
              </Badge>
            </div>

            <div className="flex items-center gap-3">
              <div className="text-right">
                <span className="text-sm text-gray-500 dark:text-gray-400">필요 크레딧</span>
                <p className="font-semibold text-amber-600 dark:text-amber-400">
                  {template.creditCost} 크레딧
                </p>
              </div>
              <Link href={`/projects/new?template=${template.id}`}>
                <Button className="bg-gradient-to-r from-rose-500 to-pink-500 hover:from-rose-600 hover:to-pink-600">
                  이 템플릿으로 시작
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
