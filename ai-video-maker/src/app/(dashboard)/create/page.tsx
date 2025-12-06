'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import {
  TemplateSelector,
  TemplatePreviewModal,
  ProjectNameInput,
} from '@/components/features/create';
import type { TemplateData } from '@/components/features/create';
import { toast } from 'sonner';
import { ArrowLeft, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

// Mock templates - 실제로는 API에서 가져옴
const mockTemplates: TemplateData[] = [
  {
    id: 'wedding-1',
    name: '로맨틱 웨딩',
    description: '사랑스러운 분위기의 결혼식 영상',
    thumbnail: 'https://images.unsplash.com/photo-1519741497674-611481863552?w=400&h=300&fit=crop',
    category: 'wedding',
    isPremium: false,
    creditCost: 10,
    duration: 180,
    minPhotos: 10,
    maxPhotos: 30,
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
    minPhotos: 15,
    maxPhotos: 50,
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
    minPhotos: 12,
    maxPhotos: 35,
  },
  {
    id: 'birthday-1',
    name: '해피 버스데이',
    description: '밝고 즐거운 생일 축하 영상',
    thumbnail: 'https://images.unsplash.com/photo-1558636508-e0db3814bd1d?w=400&h=300&fit=crop',
    category: 'birthday',
    isPremium: false,
    creditCost: 8,
    duration: 120,
    minPhotos: 8,
    maxPhotos: 20,
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
    minPhotos: 10,
    maxPhotos: 30,
  },
  {
    id: 'anniversary-1',
    name: '칠순 잔치',
    description: '전통적이고 격조있는 칠순 축하 영상',
    thumbnail: 'https://images.unsplash.com/photo-1464349095431-e9a21285b5f3?w=400&h=300&fit=crop',
    category: 'anniversary',
    isPremium: false,
    creditCost: 15,
    duration: 200,
    minPhotos: 15,
    maxPhotos: 40,
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
    minPhotos: 15,
    maxPhotos: 45,
  },
  {
    id: 'baby-1',
    name: '아기 돌잔치',
    description: '아이의 첫 생일을 축하해요',
    thumbnail: 'https://images.unsplash.com/photo-1504803900752-c2051699d0e8?w=400&h=300&fit=crop',
    category: 'baby',
    isPremium: false,
    creditCost: 10,
    duration: 150,
    minPhotos: 10,
    maxPhotos: 25,
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
    minPhotos: 12,
    maxPhotos: 35,
  },
  {
    id: 'memorial-1',
    name: '추모 영상',
    description: '고인을 기리는 따뜻한 추모 영상',
    thumbnail: 'https://images.unsplash.com/photo-1490730141103-6cac27abb37f?w=400&h=300&fit=crop',
    category: 'memorial',
    isPremium: false,
    creditCost: 12,
    duration: 180,
    minPhotos: 10,
    maxPhotos: 30,
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
    minPhotos: 15,
    maxPhotos: 40,
  },
];

type Step = 'template' | 'name';

const steps: { key: Step; label: string }[] = [
  { key: 'template', label: '템플릿 선택' },
  { key: 'name', label: '프로젝트 정보' },
];

export default function CreatePage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState<Step>('template');
  const [selectedTemplate, setSelectedTemplate] = useState<TemplateData | null>(null);
  const [previewTemplate, setPreviewTemplate] = useState<TemplateData | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  const currentStepIndex = steps.findIndex((s) => s.key === currentStep);

  const handleTemplateSelect = (template: TemplateData) => {
    setSelectedTemplate(template);
  };

  const handleTemplateConfirm = (template: TemplateData) => {
    setSelectedTemplate(template);
    setCurrentStep('name');
  };

  const handleNextStep = () => {
    if (currentStep === 'template' && selectedTemplate) {
      setCurrentStep('name');
    }
  };

  const handlePrevStep = () => {
    if (currentStep === 'name') {
      setCurrentStep('template');
    }
  };

  const handleCreateProject = async (name: string) => {
    if (!selectedTemplate) return;

    setIsCreating(true);

    try {
      const response = await fetch('/api/projects', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          templateId: selectedTemplate.id,
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.back()}
          className="shrink-0"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            새 영상 만들기
          </h1>
          <p className="mt-0.5 text-gray-600 dark:text-gray-400">
            템플릿을 선택하고 프로젝트를 시작하세요
          </p>
        </div>
      </div>

      {/* Progress Steps */}
      <div className="flex items-center justify-center gap-4">
        {steps.map((step, index) => (
          <div key={step.key} className="flex items-center gap-2">
            <div
              className={cn(
                'flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium transition-all',
                index < currentStepIndex
                  ? 'bg-green-500 text-white'
                  : index === currentStepIndex
                    ? 'bg-gradient-to-r from-rose-500 to-pink-500 text-white'
                    : 'bg-gray-100 text-gray-400 dark:bg-gray-800'
              )}
            >
              {index < currentStepIndex ? (
                <Check className="h-4 w-4" />
              ) : (
                index + 1
              )}
            </div>
            <span
              className={cn(
                'text-sm font-medium',
                index <= currentStepIndex
                  ? 'text-gray-900 dark:text-gray-100'
                  : 'text-gray-400'
              )}
            >
              {step.label}
            </span>
            {index < steps.length - 1 && (
              <div
                className={cn(
                  'mx-4 h-0.5 w-12 rounded-full',
                  index < currentStepIndex
                    ? 'bg-green-500'
                    : 'bg-gray-200 dark:bg-gray-800'
                )}
              />
            )}
          </div>
        ))}
      </div>

      {/* Step Content */}
      {currentStep === 'template' && (
        <div className="space-y-6">
          <TemplateSelector
            templates={mockTemplates}
            selectedTemplate={selectedTemplate}
            onSelect={handleTemplateSelect}
            onPreview={setPreviewTemplate}
          />

          {/* Next Button */}
          {selectedTemplate && (
            <div className="flex justify-center">
              <Button
                onClick={handleNextStep}
                size="lg"
                className="bg-gradient-to-r from-rose-500 to-pink-500 hover:from-rose-600 hover:to-pink-600"
              >
                다음: 프로젝트 정보 입력
              </Button>
            </div>
          )}
        </div>
      )}

      {currentStep === 'name' && selectedTemplate && (
        <ProjectNameInput
          template={selectedTemplate}
          onSubmit={handleCreateProject}
          onBack={handlePrevStep}
          isLoading={isCreating}
        />
      )}

      {/* Preview Modal */}
      <TemplatePreviewModal
        template={previewTemplate}
        open={!!previewTemplate}
        onClose={() => setPreviewTemplate(null)}
        onSelect={handleTemplateConfirm}
      />
    </div>
  );
}
