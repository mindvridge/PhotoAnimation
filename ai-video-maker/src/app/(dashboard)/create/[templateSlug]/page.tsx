'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ProjectNameInput } from '@/components/features/create';
import type { TemplateData } from '@/components/features/create';
import { toast } from 'sonner';
import { ArrowLeft, Clock, Image, Sparkles, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

// Mock templates - 실제로는 API에서 가져옴
const mockTemplates: Record<string, TemplateData> = {
  'romantic-wedding': {
    id: 'wedding-1',
    name: '로맨틱 웨딩',
    description: '사랑스러운 분위기의 결혼식 영상. 부드러운 전환 효과와 로맨틱한 배경 음악으로 특별한 순간을 담아보세요.',
    thumbnail: 'https://images.unsplash.com/photo-1519741497674-611481863552?w=800&h=600&fit=crop',
    category: 'wedding',
    isPremium: false,
    creditCost: 10,
    duration: 180,
    minPhotos: 10,
    maxPhotos: 30,
  },
  'premium-wedding': {
    id: 'wedding-2',
    name: '프리미엄 웨딩',
    description: '고급스러운 시네마틱 웨딩 영상. 영화 같은 연출과 세련된 효과로 잊지 못할 추억을 만들어 드립니다.',
    thumbnail: 'https://images.unsplash.com/photo-1511285560929-80b456fea0bc?w=800&h=600&fit=crop',
    category: 'wedding',
    isPremium: true,
    creditCost: 25,
    duration: 240,
    minPhotos: 15,
    maxPhotos: 50,
  },
  'happy-birthday': {
    id: 'birthday-1',
    name: '해피 버스데이',
    description: '밝고 즐거운 생일 축하 영상. 다채로운 효과와 신나는 음악으로 생일의 기쁨을 전해보세요.',
    thumbnail: 'https://images.unsplash.com/photo-1558636508-e0db3814bd1d?w=800&h=600&fit=crop',
    category: 'birthday',
    isPremium: false,
    creditCost: 8,
    duration: 120,
    minPhotos: 8,
    maxPhotos: 20,
  },
  'baby-first-birthday': {
    id: 'baby-1',
    name: '아기 돌잔치',
    description: '아이의 첫 생일을 축하해요. 귀여운 효과와 따뜻한 분위기로 소중한 순간을 기록하세요.',
    thumbnail: 'https://images.unsplash.com/photo-1504803900752-c2051699d0e8?w=800&h=600&fit=crop',
    category: 'baby',
    isPremium: false,
    creditCost: 10,
    duration: 150,
    minPhotos: 10,
    maxPhotos: 25,
  },
};

const categoryLabels: Record<string, string> = {
  wedding: '결혼식',
  birthday: '생일',
  anniversary: '칠순/팔순',
  baby: '돌잔치',
  memorial: '추모',
};

const categoryColors: Record<string, string> = {
  wedding: 'from-rose-400 to-pink-400',
  birthday: 'from-violet-400 to-purple-400',
  anniversary: 'from-amber-400 to-orange-400',
  baby: 'from-sky-400 to-blue-400',
  memorial: 'from-slate-400 to-gray-400',
};

interface PageProps {
  params: Promise<{ templateSlug: string }>;
}

export default function TemplateStartPage({ params }: PageProps) {
  const { templateSlug } = use(params);
  const router = useRouter();
  const [template, setTemplate] = useState<TemplateData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [step, setStep] = useState<'preview' | 'name'>('preview');

  useEffect(() => {
    // Simulate API fetch
    const foundTemplate = mockTemplates[templateSlug];
    if (foundTemplate) {
      setTemplate(foundTemplate);
    }
    setIsLoading(false);
  }, [templateSlug]);

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}분 ${secs}초`;
  };

  const handleCreateProject = async (name: string) => {
    if (!template) return;

    setIsCreating(true);

    try {
      const response = await fetch('/api/projects', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          templateId: template.id,
          name,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || '프로젝트 생성에 실패했습니다.');
      }

      toast.success('프로젝트가 생성되었습니다!');
      router.push(`/projects/${result.data.id}/edit`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : '프로젝트 생성에 실패했습니다.');
    } finally {
      setIsCreating(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-rose-500" />
      </div>
    );
  }

  if (!template) {
    return (
      <div className="flex min-h-[400px] flex-col items-center justify-center gap-4">
        <p className="text-gray-500 dark:text-gray-400">
          템플릿을 찾을 수 없습니다.
        </p>
        <Button variant="outline" onClick={() => router.push('/create')}>
          템플릿 목록으로 이동
        </Button>
      </div>
    );
  }

  if (step === 'name') {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setStep('preview')}
            className="shrink-0"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              프로젝트 정보
            </h1>
            <p className="mt-0.5 text-gray-600 dark:text-gray-400">
              프로젝트 이름을 입력하세요
            </p>
          </div>
        </div>

        <ProjectNameInput
          template={template}
          onSubmit={handleCreateProject}
          onBack={() => setStep('preview')}
          isLoading={isCreating}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.push('/templates')}
          className="shrink-0"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            {template.name}
          </h1>
          <p className="mt-0.5 text-gray-600 dark:text-gray-400">
            템플릿 미리보기 및 시작
          </p>
        </div>
      </div>

      {/* Template Preview */}
      <Card className="overflow-hidden">
        <div className="grid lg:grid-cols-2">
          {/* Image/Video Preview */}
          <div className="relative aspect-video bg-gray-100 lg:aspect-auto lg:min-h-[400px] dark:bg-gray-800">
            <img
              src={template.thumbnail}
              alt={template.name}
              className="h-full w-full object-cover"
            />
            {template.isPremium && (
              <div className="absolute right-4 top-4">
                <Badge variant="premium" className="flex items-center gap-1">
                  <Sparkles className="h-3 w-3" />
                  프리미엄
                </Badge>
              </div>
            )}
          </div>

          {/* Info */}
          <CardContent className="flex flex-col p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <Badge
                  variant="outline"
                  className={cn(
                    'mb-3 border-0 bg-gradient-to-r text-white',
                    categoryColors[template.category]
                  )}
                >
                  {categoryLabels[template.category]}
                </Badge>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  {template.name}
                </h2>
                <p className="mt-2 text-gray-600 dark:text-gray-400">
                  {template.description}
                </p>
              </div>
            </div>

            {/* Details */}
            <div className="mt-6 grid grid-cols-2 gap-4">
              <div className="rounded-lg bg-gray-50 p-4 dark:bg-gray-800">
                <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400">
                  <Clock className="h-4 w-4" />
                  <span className="text-sm">영상 길이</span>
                </div>
                <p className="mt-1 text-lg font-semibold text-gray-900 dark:text-gray-100">
                  {formatDuration(template.duration)}
                </p>
              </div>

              <div className="rounded-lg bg-gray-50 p-4 dark:bg-gray-800">
                <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400">
                  <Image className="h-4 w-4" />
                  <span className="text-sm">필요 사진 수</span>
                </div>
                <p className="mt-1 text-lg font-semibold text-gray-900 dark:text-gray-100">
                  {template.minPhotos} ~ {template.maxPhotos}장
                </p>
              </div>
            </div>

            {/* Features */}
            <div className="mt-6">
              <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100">
                포함 기능
              </h3>
              <ul className="mt-3 grid grid-cols-2 gap-2">
                {[
                  '고화질 영상 (1080p)',
                  '배경 음악 포함',
                  '자막 편집',
                  '무제한 다운로드',
                  '다양한 전환 효과',
                  'SNS 공유 최적화',
                ].map((feature) => (
                  <li
                    key={feature}
                    className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400"
                  >
                    <svg
                      className="h-4 w-4 shrink-0 text-green-500"
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

            {/* Price & Action */}
            <div className="mt-auto flex items-center justify-between pt-6">
              <div>
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  필요 크레딧
                </span>
                <p className="text-2xl font-bold text-amber-600 dark:text-amber-400">
                  {template.creditCost} 크레딧
                </p>
              </div>
              <Button
                size="lg"
                onClick={() => setStep('name')}
                className="bg-gradient-to-r from-rose-500 to-pink-500 hover:from-rose-600 hover:to-pink-600"
              >
                이 템플릿으로 시작
              </Button>
            </div>
          </CardContent>
        </div>
      </Card>
    </div>
  );
}
