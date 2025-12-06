'use client';

import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TemplateCard, TemplatePreviewModal } from '@/components/features/dashboard';
import type { Template, TemplateCategory } from '@/components/features/dashboard';
import { Sparkles } from 'lucide-react';

// Mock templates data
const allTemplates: Template[] = [
  // Wedding
  {
    id: 'wedding-1',
    name: '로맨틱 웨딩',
    description: '사랑스러운 분위기의 결혼식 영상',
    thumbnail: 'https://images.unsplash.com/photo-1519741497674-611481863552?w=400&h=300&fit=crop',
    category: 'wedding',
    isPremium: false,
    creditCost: 10,
    duration: 180,
  },
  {
    id: 'wedding-2',
    name: '프리미엄 웨딩',
    description: '고급스러운 시네마틱 웨딩 영상',
    thumbnail: 'https://images.unsplash.com/photo-1511285560929-80b456fea0bc?w=400&h=300&fit=crop',
    category: 'wedding',
    isPremium: true,
    creditCost: 25,
    duration: 240,
  },
  {
    id: 'wedding-3',
    name: '가든 웨딩',
    description: '자연 속 아름다운 결혼식',
    thumbnail: 'https://images.unsplash.com/photo-1465495976277-4387d4b0b4c6?w=400&h=300&fit=crop',
    category: 'wedding',
    isPremium: false,
    creditCost: 12,
    duration: 200,
  },
  // Birthday
  {
    id: 'birthday-1',
    name: '해피 버스데이',
    description: '밝고 즐거운 생일 축하 영상',
    thumbnail: 'https://images.unsplash.com/photo-1558636508-e0db3814bd1d?w=400&h=300&fit=crop',
    category: 'birthday',
    isPremium: false,
    creditCost: 8,
    duration: 120,
  },
  {
    id: 'birthday-2',
    name: '프리미엄 생일',
    description: '특별한 생일을 위한 프리미엄 영상',
    thumbnail: 'https://images.unsplash.com/photo-1464349153735-7db50ed83c84?w=400&h=300&fit=crop',
    category: 'birthday',
    isPremium: true,
    creditCost: 18,
    duration: 180,
  },
  // Anniversary
  {
    id: 'anniversary-1',
    name: '칠순 잔치',
    description: '전통적이고 격조있는 칠순 축하 영상',
    thumbnail: 'https://images.unsplash.com/photo-1464349095431-e9a21285b5f3?w=400&h=300&fit=crop',
    category: 'anniversary',
    isPremium: false,
    creditCost: 15,
    duration: 200,
  },
  {
    id: 'anniversary-2',
    name: '팔순 축하',
    description: '팔순을 축하하는 감동적인 영상',
    thumbnail: 'https://images.unsplash.com/photo-1529636798458-92182e662485?w=400&h=300&fit=crop',
    category: 'anniversary',
    isPremium: true,
    creditCost: 20,
    duration: 220,
  },
  // Baby
  {
    id: 'baby-1',
    name: '아기 돌잔치',
    description: '아이의 첫 생일을 축하해요',
    thumbnail: 'https://images.unsplash.com/photo-1504803900752-c2051699d0e8?w=400&h=300&fit=crop',
    category: 'baby',
    isPremium: false,
    creditCost: 10,
    duration: 150,
  },
  {
    id: 'baby-2',
    name: '프리미엄 돌잔치',
    description: '특별한 첫 생일을 위한 프리미엄',
    thumbnail: 'https://images.unsplash.com/photo-1519689680058-324335c77eba?w=400&h=300&fit=crop',
    category: 'baby',
    isPremium: true,
    creditCost: 22,
    duration: 200,
  },
  // Memorial
  {
    id: 'memorial-1',
    name: '추모 영상',
    description: '고인을 기리는 따뜻한 추모 영상',
    thumbnail: 'https://images.unsplash.com/photo-1490730141103-6cac27abb37f?w=400&h=300&fit=crop',
    category: 'memorial',
    isPremium: false,
    creditCost: 12,
    duration: 180,
  },
  {
    id: 'memorial-2',
    name: '프리미엄 추모',
    description: '감동적인 프리미엄 추모 영상',
    thumbnail: 'https://images.unsplash.com/photo-1501426026826-31c667bdf23d?w=400&h=300&fit=crop',
    category: 'memorial',
    isPremium: true,
    creditCost: 20,
    duration: 240,
  },
];

const categories: { value: TemplateCategory | 'all'; label: string; icon?: string }[] = [
  { value: 'all', label: '전체' },
  { value: 'wedding', label: '결혼식' },
  { value: 'birthday', label: '생일' },
  { value: 'anniversary', label: '칠순/팔순' },
  { value: 'baby', label: '돌잔치' },
  { value: 'memorial', label: '추모' },
];

export default function TemplatesPage() {
  const [selectedCategory, setSelectedCategory] = useState<TemplateCategory | 'all'>('all');
  const [previewTemplate, setPreviewTemplate] = useState<Template | null>(null);

  const filteredTemplates =
    selectedCategory === 'all'
      ? allTemplates
      : allTemplates.filter((t) => t.category === selectedCategory);

  const premiumTemplates = filteredTemplates.filter((t) => t.isPremium);
  const regularTemplates = filteredTemplates.filter((t) => !t.isPremium);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
          템플릿 갤러리
        </h1>
        <p className="mt-1 text-gray-600 dark:text-gray-400">
          다양한 템플릿으로 특별한 순간을 영상으로 만들어보세요
        </p>
      </div>

      {/* Category Tabs */}
      <Tabs
        value={selectedCategory}
        onValueChange={(value) => setSelectedCategory(value as TemplateCategory | 'all')}
      >
        <TabsList className="flex-wrap h-auto gap-2 bg-transparent p-0">
          {categories.map((category) => (
            <TabsTrigger
              key={category.value}
              value={category.value}
              className="rounded-full border border-gray-200 bg-white px-4 py-2 data-[state=active]:border-rose-500 data-[state=active]:bg-rose-50 data-[state=active]:text-rose-600 dark:border-gray-800 dark:bg-gray-900 dark:data-[state=active]:border-rose-500 dark:data-[state=active]:bg-rose-950 dark:data-[state=active]:text-rose-400"
            >
              {category.label}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value={selectedCategory} className="mt-6 space-y-8">
          {/* Premium Templates Section */}
          {premiumTemplates.length > 0 && (
            <section>
              <div className="mb-4 flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-amber-500" />
                <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                  프리미엄 템플릿
                </h2>
              </div>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {premiumTemplates.map((template) => (
                  <TemplateCard
                    key={template.id}
                    template={template}
                    onPreview={setPreviewTemplate}
                  />
                ))}
              </div>
            </section>
          )}

          {/* Regular Templates Section */}
          {regularTemplates.length > 0 && (
            <section>
              <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-gray-100">
                일반 템플릿
              </h2>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {regularTemplates.map((template) => (
                  <TemplateCard
                    key={template.id}
                    template={template}
                    onPreview={setPreviewTemplate}
                  />
                ))}
              </div>
            </section>
          )}

          {/* Empty State */}
          {filteredTemplates.length === 0 && (
            <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-gray-200 px-6 py-16 dark:border-gray-800">
              <p className="text-gray-500 dark:text-gray-400">
                해당 카테고리에 템플릿이 없습니다.
              </p>
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Preview Modal */}
      <TemplatePreviewModal
        template={previewTemplate}
        open={!!previewTemplate}
        onClose={() => setPreviewTemplate(null)}
      />
    </div>
  );
}
