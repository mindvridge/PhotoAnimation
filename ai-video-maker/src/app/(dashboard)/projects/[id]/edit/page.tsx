'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { usePhotoUpload } from '@/hooks/usePhotoUpload';
import { PhotoUploader, PhotoGrid, PhotoPreview } from '@/components/features/upload';
import {
  ArrowLeft,
  ArrowRight,
  Camera,
  Sparkles,
  Settings,
  Play,
  Check,
  Loader2,
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

  const canProceed = photos.length >= 1;

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
        <div className="flex min-h-[40vh] flex-col items-center justify-center rounded-xl border bg-white p-12 dark:border-gray-800 dark:bg-gray-900">
          <Sparkles className="h-16 w-16 text-rose-300" />
          <h2 className="mt-4 text-xl font-bold text-gray-900 dark:text-gray-100">
            AI 애니메이션
          </h2>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            다음 단계에서 구현 예정입니다
          </p>
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
