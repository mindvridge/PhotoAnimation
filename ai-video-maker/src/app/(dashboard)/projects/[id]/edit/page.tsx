'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';
import { usePhotoUpload } from '@/hooks/usePhotoUpload';
import { useAnimationGeneration } from '@/hooks/useAnimationGeneration';
import { PhotoUploader, PhotoGrid, PhotoPreview } from '@/components/features/upload';
import { PresetSelector, AnimationSettings, AnimationProgress } from '@/components/features/animate';
import type { AnimationPresetId } from '@/lib/kling-ai';
import {
  ArrowLeft,
  ArrowRight,
  Camera,
  Sparkles,
  Settings,
  Play,
  Check,
  Loader2,
  CheckCircle2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Database } from '@/types/database';

type Photo = Database['public']['Tables']['photos']['Row'];
type Project = Database['public']['Tables']['projects']['Row'];

interface ProjectWithTemplate extends Project {
  templates: {
    id: string;
    name: string;
    max_photos: number;
    thumbnail_url: string | null;
  } | null;
}

type EditStep = 'photos' | 'animation' | 'settings' | 'preview';

const steps: { id: EditStep; label: string; icon: React.ElementType }[] = [
  { id: 'photos', label: '사진 업로드', icon: Camera },
  { id: 'animation', label: 'AI 애니메이션', icon: Sparkles },
  { id: 'settings', label: '설정', icon: Settings },
  { id: 'preview', label: '미리보기', icon: Play },
];

export default function ProjectEditPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.id as string;

  const [project, setProject] = useState<ProjectWithTemplate | null>(null);
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentStep, setCurrentStep] = useState<EditStep>('photos');
  const [selectedPhoto, setSelectedPhoto] = useState<Photo | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [isSavingOrder, setIsSavingOrder] = useState(false);

  // 애니메이션 관련 상태
  const [selectedPhotoIds, setSelectedPhotoIds] = useState<string[]>([]);
  const [animationPreset, setAnimationPreset] = useState<AnimationPresetId | 'custom' | null>(null);
  const [customPrompt, setCustomPrompt] = useState('');
  const [animationDuration, setAnimationDuration] = useState<5 | 10>(5);
  const [animationMode, setAnimationMode] = useState<'standard' | 'pro'>('standard');
  const [isAnimationComplete, setIsAnimationComplete] = useState(false);

  const maxPhotos = project?.templates?.max_photos || 30;

  const {
    uploadingPhotos,
    isUploading,
    uploadFiles,
    retryUpload,
    removeUploadingPhoto,
    clearCompleted,
  } = usePhotoUpload({
    projectId,
    maxPhotos,
    currentPhotoCount: photos.length,
    onUploadComplete: () => {
      // 업로드 완료 후 사진 목록 새로고침
      fetchPhotos();
    },
    onError: (error) => {
      toast.error('업로드 오류', { description: error });
    },
  });

  // 애니메이션 생성 훅
  const {
    jobs: animationJobs,
    isGenerating,
    creditUsed,
    remainingCredits,
    generateAnimations,
    retryJob,
    cancelGeneration,
    loadExistingJobs,
  } = useAnimationGeneration({
    projectId,
    onComplete: () => {
      toast.success('완료!', { description: '모든 애니메이션이 생성되었습니다.' });
      setIsAnimationComplete(true);
      fetchPhotos(); // 사진 상태 업데이트
    },
    onError: (error) => {
      toast.error('애니메이션 오류', { description: error });
    },
  });

  // 프로젝트 정보 가져오기
  const fetchProject = useCallback(async () => {
    try {
      const response = await fetch(`/api/projects/${projectId}`);
      if (!response.ok) {
        throw new Error('프로젝트를 불러올 수 없습니다.');
      }
      const result = await response.json();
      setProject(result.data);
    } catch (error) {
      toast.error('오류', {
        description: error instanceof Error ? error.message : '프로젝트를 불러오는데 실패했습니다.',
      });
      router.push('/projects');
    }
  }, [projectId, router]);

  // 사진 목록 가져오기
  const fetchPhotos = useCallback(async () => {
    try {
      const response = await fetch(`/api/photos?projectId=${projectId}`);
      if (!response.ok) {
        throw new Error('사진을 불러올 수 없습니다.');
      }
      const result = await response.json();
      setPhotos(result.data || []);
    } catch (error) {
      console.error('Fetch photos error:', error);
    }
  }, [projectId]);

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      await Promise.all([fetchProject(), fetchPhotos()]);
      setIsLoading(false);
    };
    loadData();
  }, [fetchProject, fetchPhotos]);

  // 완료된 업로드 정리
  useEffect(() => {
    if (uploadingPhotos.every((p) => p.status === 'completed' || p.status === 'error')) {
      const timer = setTimeout(() => {
        clearCompleted();
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [uploadingPhotos, clearCompleted]);

  // 애니메이션 단계 진입 시 기존 작업 로드
  useEffect(() => {
    if (currentStep === 'animation') {
      loadExistingJobs();
    }
  }, [currentStep, loadExistingJobs]);

  // 애니메이션 단계 진입 시 전체 사진 선택
  useEffect(() => {
    if (currentStep === 'animation' && photos.length > 0 && selectedPhotoIds.length === 0) {
      setSelectedPhotoIds(photos.map((p) => p.id));
    }
  }, [currentStep, photos, selectedPhotoIds.length]);

  // 사진 순서 변경
  const handleReorder = useCallback(
    async (photoIds: string[]) => {
      setIsSavingOrder(true);
      try {
        const response = await fetch('/api/photos', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ projectId, photoIds }),
        });

        if (!response.ok) {
          throw new Error('순서 저장에 실패했습니다.');
        }

        // 로컬 상태 업데이트
        const reorderedPhotos = photoIds
          .map((id) => photos.find((p) => p.id === id))
          .filter((p): p is Photo => p !== undefined);
        setPhotos(reorderedPhotos);
      } catch (error) {
        toast.error('오류', {
          description: error instanceof Error ? error.message : '순서 저장에 실패했습니다.',
        });
        fetchPhotos(); // 실패 시 원래 순서로 복원
      } finally {
        setIsSavingOrder(false);
      }
    },
    [projectId, photos, fetchPhotos]
  );

  // 사진 삭제
  const handleDeletePhoto = useCallback(
    async (photoId: string) => {
      try {
        const response = await fetch(`/api/photos/${photoId}`, {
          method: 'DELETE',
        });

        if (!response.ok) {
          throw new Error('사진 삭제에 실패했습니다.');
        }

        setPhotos((prev) => prev.filter((p) => p.id !== photoId));
        toast.success('삭제 완료', { description: '사진이 삭제되었습니다.' });
      } catch (error) {
        toast.error('오류', {
          description: error instanceof Error ? error.message : '사진 삭제에 실패했습니다.',
        });
      }
    },
    []
  );

  // 사진 미리보기
  const handlePreviewPhoto = useCallback((photo: Photo) => {
    setSelectedPhoto(photo);
    setIsPreviewOpen(true);
  }, []);

  // 다음 단계 진행
  const handleNextStep = useCallback(() => {
    const currentIndex = steps.findIndex((s) => s.id === currentStep);
    if (currentIndex < steps.length - 1) {
      setCurrentStep(steps[currentIndex + 1].id);
    }
  }, [currentStep]);

  // 사진 선택 토글
  const handlePhotoSelect = useCallback((photoId: string) => {
    setSelectedPhotoIds((prev) =>
      prev.includes(photoId) ? prev.filter((id) => id !== photoId) : [...prev, photoId]
    );
  }, []);

  // 전체 선택/해제
  const handleSelectAll = useCallback(() => {
    if (selectedPhotoIds.length === photos.length) {
      setSelectedPhotoIds([]);
    } else {
      setSelectedPhotoIds(photos.map((p) => p.id));
    }
  }, [photos, selectedPhotoIds.length]);

  // 애니메이션 생성 시작
  const handleStartGeneration = useCallback(async () => {
    if (selectedPhotoIds.length === 0) {
      toast.error('오류', { description: '사진을 선택해주세요.' });
      return;
    }

    if (!animationPreset) {
      toast.error('오류', { description: '애니메이션 프리셋을 선택해주세요.' });
      return;
    }

    const success = await generateAnimations(selectedPhotoIds, {
      preset: animationPreset === 'custom' ? undefined : animationPreset ?? undefined,
      customPrompt: animationPreset === 'custom' ? customPrompt : undefined,
      duration: animationDuration,
      mode: animationMode,
    });

    if (success) {
      toast.info('생성 시작', {
        description: `${selectedPhotoIds.length}개의 애니메이션 생성을 시작합니다.`,
      });
    }
  }, [
    selectedPhotoIds,
    animationPreset,
    customPrompt,
    animationDuration,
    animationMode,
    generateAnimations,
  ]);

  const canProceed = photos.length >= 1;
  const canGenerate = selectedPhotoIds.length > 0 && animationPreset !== null;

  if (isLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-rose-500" />
      </div>
    );
  }

  if (!project) {
    return null;
  }

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <Link href="/projects">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">
              {project.name}
            </h1>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {project.templates?.name || '템플릿'}
            </p>
          </div>
        </div>

        {isSavingOrder && (
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <Loader2 className="h-4 w-4 animate-spin" />
            순서 저장 중...
          </div>
        )}
      </div>

      {/* 단계 표시 */}
      <div className="relative">
        <div className="overflow-hidden rounded-xl border bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
          <div className="flex items-center justify-between">
            {steps.map((step, index) => {
              const StepIcon = step.icon;
              const isActive = step.id === currentStep;
              const isCompleted = steps.findIndex((s) => s.id === currentStep) > index;
              const isDisabled = !canProceed && index > 0;

              return (
                <div key={step.id} className="flex flex-1 items-center">
                  <button
                    type="button"
                    onClick={() => !isDisabled && setCurrentStep(step.id)}
                    disabled={isDisabled}
                    className={cn(
                      'flex flex-col items-center gap-2 transition-all',
                      isActive
                        ? 'text-rose-600 dark:text-rose-400'
                        : isCompleted
                        ? 'text-green-600 dark:text-green-400'
                        : 'text-gray-400 dark:text-gray-500',
                      isDisabled && 'cursor-not-allowed opacity-50'
                    )}
                  >
                    <div
                      className={cn(
                        'flex h-10 w-10 items-center justify-center rounded-full transition-all',
                        isActive
                          ? 'bg-rose-100 dark:bg-rose-900/50'
                          : isCompleted
                          ? 'bg-green-100 dark:bg-green-900/50'
                          : 'bg-gray-100 dark:bg-gray-800'
                      )}
                    >
                      {isCompleted ? (
                        <Check className="h-5 w-5" />
                      ) : (
                        <StepIcon className="h-5 w-5" />
                      )}
                    </div>
                    <span className="text-xs font-medium sm:text-sm">{step.label}</span>
                  </button>

                  {index < steps.length - 1 && (
                    <div
                      className={cn(
                        'mx-2 h-0.5 flex-1 transition-colors',
                        isCompleted
                          ? 'bg-green-400 dark:bg-green-600'
                          : 'bg-gray-200 dark:bg-gray-700'
                      )}
                    />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* 현재 단계 내용 */}
      {currentStep === 'photos' && (
        <div className="space-y-6">
          {/* 템플릿 정보 */}
          <div className="flex items-center gap-4 rounded-xl border bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
            {project.templates?.thumbnail_url && (
              <img
                src={project.templates.thumbnail_url}
                alt={project.templates.name}
                className="h-16 w-16 rounded-lg object-cover"
              />
            )}
            <div className="flex-1">
              <h3 className="font-medium text-gray-900 dark:text-gray-100">
                {project.templates?.name}
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                최대 {maxPhotos}장 업로드 가능 • 현재 {photos.length}장
              </p>
            </div>
            <div className="text-right">
              <span className="text-2xl font-bold text-rose-500">{photos.length}</span>
              <span className="text-gray-400"> / {maxPhotos}</span>
            </div>
          </div>

          {/* 업로더 */}
          <div className="rounded-xl border bg-white p-6 dark:border-gray-800 dark:bg-gray-900">
            <PhotoUploader
              uploadingPhotos={uploadingPhotos}
              isUploading={isUploading}
              maxPhotos={maxPhotos}
              currentPhotoCount={photos.length}
              onFilesSelected={uploadFiles}
              onRetry={retryUpload}
              onRemove={removeUploadingPhoto}
            />
          </div>

          {/* 사진 그리드 */}
          <div className="rounded-xl border bg-white p-6 dark:border-gray-800 dark:bg-gray-900">
            <PhotoGrid
              photos={photos}
              onReorder={handleReorder}
              onDelete={handleDeletePhoto}
              onPreview={handlePreviewPhoto}
            />
          </div>

          {/* 다음 단계 버튼 */}
          <div className="flex justify-end">
            <Button
              size="lg"
              className="bg-gradient-to-r from-rose-500 to-pink-500 hover:from-rose-600 hover:to-pink-600"
              disabled={!canProceed}
              onClick={handleNextStep}
            >
              AI 애니메이션 생성
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </div>
        </div>
      )}

      {currentStep === 'animation' && (
        <div className="space-y-6">
          {/* 생성 중일 때 진행률 표시 */}
          {isGenerating && (
            <div className="rounded-xl border bg-white p-6 dark:border-gray-800 dark:bg-gray-900">
              <AnimationProgress
                jobs={animationJobs}
                photos={photos}
                isGenerating={isGenerating}
                onRetry={retryJob}
                onCancel={cancelGeneration}
              />
            </div>
          )}

          {/* 생성 완료 시 */}
          {isAnimationComplete && !isGenerating && (
            <div className="rounded-xl border border-green-200 bg-green-50 p-6 dark:border-green-900 dark:bg-green-950/30">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/50">
                  <CheckCircle2 className="h-6 w-6 text-green-600 dark:text-green-400" />
                </div>
                <div className="flex-1">
                  <h3 className="font-medium text-green-800 dark:text-green-200">
                    애니메이션 생성 완료!
                  </h3>
                  <p className="text-sm text-green-700 dark:text-green-300">
                    {creditUsed} 크레딧이 사용되었습니다. 다음 단계로 진행하세요.
                  </p>
                </div>
                <Button
                  onClick={handleNextStep}
                  className="bg-green-600 hover:bg-green-700"
                >
                  다음 단계
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </div>
          )}

          {/* 사진 선택 */}
          {!isGenerating && (
            <div className="rounded-xl border bg-white p-6 dark:border-gray-800 dark:bg-gray-900">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="font-medium text-gray-900 dark:text-gray-100">
                  애니메이션을 적용할 사진 선택
                </h3>
                <Button variant="ghost" size="sm" onClick={handleSelectAll}>
                  {selectedPhotoIds.length === photos.length ? '전체 해제' : '전체 선택'}
                </Button>
              </div>
              <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6">
                {photos.map((photo, index) => {
                  const isSelected = selectedPhotoIds.includes(photo.id);
                  const hasAnimation = photo.animation_status === 'completed';
                  return (
                    <button
                      key={photo.id}
                      type="button"
                      onClick={() => handlePhotoSelect(photo.id)}
                      className={cn(
                        'group relative aspect-square overflow-hidden rounded-lg border-2 transition-all',
                        isSelected
                          ? 'border-rose-400 ring-2 ring-rose-200 dark:border-rose-500 dark:ring-rose-900'
                          : 'border-gray-200 hover:border-gray-300 dark:border-gray-700 dark:hover:border-gray-600'
                      )}
                    >
                      <img
                        src={photo.original_url}
                        alt={`사진 ${index + 1}`}
                        className="h-full w-full object-cover"
                      />
                      {/* 체크박스 */}
                      <div className="absolute left-2 top-2">
                        <Checkbox
                          checked={isSelected}
                          className="h-5 w-5 border-white bg-white/80"
                        />
                      </div>
                      {/* 순서 */}
                      <div className="absolute bottom-2 right-2 flex h-5 w-5 items-center justify-center rounded-full bg-black/60 text-xs font-bold text-white">
                        {index + 1}
                      </div>
                      {/* 애니메이션 완료 표시 */}
                      {hasAnimation && (
                        <div className="absolute right-2 top-2 flex h-5 w-5 items-center justify-center rounded-full bg-green-500">
                          <Check className="h-3 w-3 text-white" />
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
              <p className="mt-3 text-sm text-gray-500 dark:text-gray-400">
                {selectedPhotoIds.length}장 선택됨
              </p>
            </div>
          )}

          {/* 프리셋 선택 */}
          {!isGenerating && (
            <div className="rounded-xl border bg-white p-6 dark:border-gray-800 dark:bg-gray-900">
              <h3 className="mb-4 font-medium text-gray-900 dark:text-gray-100">
                애니메이션 스타일 선택
              </h3>
              <PresetSelector
                selectedPreset={animationPreset}
                onPresetSelect={setAnimationPreset}
                customPrompt={customPrompt}
                onCustomPromptChange={setCustomPrompt}
                disabled={isGenerating}
              />
            </div>
          )}

          {/* 설정 */}
          {!isGenerating && (
            <div className="rounded-xl border bg-white p-6 dark:border-gray-800 dark:bg-gray-900">
              <h3 className="mb-4 font-medium text-gray-900 dark:text-gray-100">
                생성 설정
              </h3>
              <AnimationSettings
                duration={animationDuration}
                mode={animationMode}
                onDurationChange={setAnimationDuration}
                onModeChange={setAnimationMode}
                photoCount={selectedPhotoIds.length}
                disabled={isGenerating}
              />
            </div>
          )}

          {/* 생성 버튼 */}
          {!isGenerating && !isAnimationComplete && (
            <div className="flex justify-between">
              <Button
                variant="outline"
                onClick={() => setCurrentStep('photos')}
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                이전 단계
              </Button>
              <Button
                size="lg"
                className="bg-gradient-to-r from-rose-500 to-pink-500 hover:from-rose-600 hover:to-pink-600"
                disabled={!canGenerate}
                onClick={handleStartGeneration}
              >
                <Sparkles className="mr-2 h-5 w-5" />
                애니메이션 생성 시작
              </Button>
            </div>
          )}
        </div>
      )}

      {currentStep === 'settings' && (
        <div className="flex min-h-[40vh] flex-col items-center justify-center rounded-xl border bg-white p-12 dark:border-gray-800 dark:bg-gray-900">
          <Settings className="h-16 w-16 text-rose-300" />
          <h2 className="mt-4 text-xl font-bold text-gray-900 dark:text-gray-100">
            영상 설정
          </h2>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            다음 단계에서 구현 예정입니다
          </p>
        </div>
      )}

      {currentStep === 'preview' && (
        <div className="flex min-h-[40vh] flex-col items-center justify-center rounded-xl border bg-white p-12 dark:border-gray-800 dark:bg-gray-900">
          <Play className="h-16 w-16 text-rose-300" />
          <h2 className="mt-4 text-xl font-bold text-gray-900 dark:text-gray-100">
            미리보기
          </h2>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            다음 단계에서 구현 예정입니다
          </p>
        </div>
      )}

      {/* 사진 미리보기 모달 */}
      <PhotoPreview
        photo={selectedPhoto}
        open={isPreviewOpen}
        onClose={() => setIsPreviewOpen(false)}
        onDelete={handleDeletePhoto}
      />
    </div>
  );
}
