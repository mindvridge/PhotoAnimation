'use client';

import { useState, useMemo } from 'react';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { Search, Clock, Image, Sparkles, Check } from 'lucide-react';

export type TemplateCategory = 'all' | 'wedding' | 'birthday' | 'anniversary' | 'baby' | 'memorial';

export interface TemplateData {
  id: string;
  name: string;
  description: string;
  thumbnail: string;
  previewUrl?: string;
  category: Exclude<TemplateCategory, 'all'>;
  isPremium: boolean;
  creditCost: number;
  duration: number;
  minPhotos: number;
  maxPhotos: number;
}

interface TemplateSelectorProps {
  templates: TemplateData[];
  selectedTemplate: TemplateData | null;
  onSelect: (template: TemplateData) => void;
  onPreview?: (template: TemplateData) => void;
}

const categoryLabels: Record<TemplateCategory, string> = {
  all: '전체',
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

export function TemplateSelector({
  templates,
  selectedTemplate,
  onSelect,
  onPreview,
}: TemplateSelectorProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<TemplateCategory>('all');

  const categories: TemplateCategory[] = ['all', 'wedding', 'birthday', 'anniversary', 'baby', 'memorial'];

  const filteredTemplates = useMemo(() => {
    return templates.filter((template) => {
      const matchesSearch = template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        template.description.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = selectedCategory === 'all' || template.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [templates, searchQuery, selectedCategory]);

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="space-y-6">
      {/* Search & Filter */}
      <div className="flex flex-col gap-4 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="템플릿 검색..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Category Tabs */}
      <div className="flex flex-wrap gap-2">
        {categories.map((category) => (
          <button
            key={category}
            onClick={() => setSelectedCategory(category)}
            className={cn(
              'rounded-full border px-4 py-2 text-sm font-medium transition-all',
              selectedCategory === category
                ? 'border-rose-500 bg-rose-50 text-rose-600 dark:bg-rose-950 dark:text-rose-400'
                : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300 hover:bg-gray-50 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-400 dark:hover:bg-gray-800'
            )}
          >
            {categoryLabels[category]}
          </button>
        ))}
      </div>

      {/* Templates Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {filteredTemplates.map((template) => {
          const isSelected = selectedTemplate?.id === template.id;

          return (
            <div
              key={template.id}
              onClick={() => onSelect(template)}
              className={cn(
                'group relative cursor-pointer overflow-hidden rounded-xl border-2 bg-white transition-all hover:shadow-lg dark:bg-gray-900',
                isSelected
                  ? 'border-rose-500 ring-2 ring-rose-500/20'
                  : 'border-gray-200 hover:border-gray-300 dark:border-gray-800 dark:hover:border-gray-700'
              )}
            >
              {/* Thumbnail */}
              <div className="relative aspect-video overflow-hidden bg-gray-100 dark:bg-gray-800">
                <img
                  src={template.thumbnail}
                  alt={template.name}
                  className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                />

                {/* Selection indicator */}
                {isSelected && (
                  <div className="absolute inset-0 flex items-center justify-center bg-rose-500/20">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-rose-500 text-white">
                      <Check className="h-6 w-6" />
                    </div>
                  </div>
                )}

                {/* Premium badge */}
                {template.isPremium && (
                  <div className="absolute right-2 top-2">
                    <Badge variant="premium" className="flex items-center gap-1">
                      <Sparkles className="h-3 w-3" />
                      프리미엄
                    </Badge>
                  </div>
                )}

                {/* Category badge */}
                <div className="absolute left-2 top-2">
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

                {/* Preview button */}
                {onPreview && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onPreview(template);
                    }}
                    className="absolute bottom-2 right-2 rounded-full bg-white/90 px-3 py-1.5 text-xs font-medium text-gray-700 opacity-0 shadow-md transition-all hover:bg-white group-hover:opacity-100"
                  >
                    미리보기
                  </button>
                )}
              </div>

              {/* Content */}
              <div className="p-4">
                <h3 className="font-semibold text-gray-900 dark:text-gray-100">
                  {template.name}
                </h3>
                <p className="mt-1 line-clamp-1 text-sm text-gray-500 dark:text-gray-400">
                  {template.description}
                </p>

                {/* Meta info */}
                <div className="mt-3 flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
                  <div className="flex items-center gap-1">
                    <Clock className="h-3.5 w-3.5" />
                    {formatDuration(template.duration)}
                  </div>
                  <div className="flex items-center gap-1">
                    <Image className="h-3.5 w-3.5" />
                    {template.minPhotos}-{template.maxPhotos}장
                  </div>
                  <div className="ml-auto font-medium text-amber-600 dark:text-amber-400">
                    {template.creditCost} 크레딧
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Empty state */}
      {filteredTemplates.length === 0 && (
        <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-gray-200 py-12 dark:border-gray-800">
          <p className="text-gray-500 dark:text-gray-400">
            검색 결과가 없습니다.
          </p>
        </div>
      )}
    </div>
  );
}
