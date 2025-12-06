'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import {
  VideoSettingsForm,
  RenderProgress,
  VideoPlayer,
  DownloadButton,
  type VideoSettings,
} from '@/components/features/preview';
import {
  ArrowLeft,
  Sparkles,
  Loader2,
  Film,
  Image as ImageIcon,
} from 'lucide-react';
import type { Database } from '@/types/database';
import type { RenderStatus } from '@/lib/queue/render-queue';

type Photo = Database['public']['Tables']['photos']['Row'];
type Project = Database['public']['Tables']['projects']['Row'];

interface ProjectWithTemplate extends Project {
  templates: {
    id: string;
    name: string;
    slug: string;
  } | null;
}

interface RenderJobStatus {
  jobId: string;
  projectId: string;
  status: RenderStatus;
  progress: number;
  currentStep: string;
  outputUrl?: string;
  fileSize?: number;
  duration?: number;
  error?: string;
}

export default function PreviewPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.id as string;

  const [project, setProject] = useState<ProjectWithTemplate | null>(null);
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRendering, setIsRendering] = useState(false);
  const [renderStatus, setRenderStatus] = useState<RenderJobStatus | null>(null);

  // 비디오 설정
  const [videoSettings, setVideoSettings] = useState<VideoSettings>({
    title: '',
    subtitle: '',
    date: '',
    message: '',
    musicTrack: '',
    musicVolume: 0.5,
    resolution: 'hd',
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

      // 템플릿에 맞는 기본 설정
      const templateSlug = result.data?.templates?.slug || 'wedding';
      const defaults = getDefaultSettings(templateSlug);
      setVideoSettings((prev) => ({
        ...prev,
        ...defaults,
      }));
    } catch (error) {
      toast.error('오류', {
        description:
          error instanceof Error
            ? error.message
            : '프로젝트를 불러오는데 실패했습니다.',
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

  // 렌더링 상태 확인
  const checkRenderStatus = useCallback(async () => {
    try {
      const response = await fetch(`/api/render/${projectId}/status`);
      if (response.ok) {
        const result = await response.json();
        const status = result.data as RenderJobStatus;
        setRenderStatus(status);

        if (status.status === 'completed' || status.status === 'failed') {
          setIsRendering(false);
        }

        return status;
      }
    } catch (error) {
      console.error('Check render status error:', error);
    }
    return null;
  }, [projectId]);

  // 초기 로드
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      await Promise.all([fetchProject(), fetchPhotos()]);
      // 기존 렌더링 작업 확인
      const status = await checkRenderStatus();
      if (
        status &&
        status.status !== 'completed' &&
        status.status !== 'failed'
      ) {
        setIsRendering(true);
      }
      setIsLoading(false);
    };
    loadData();
  }, [fetchProject, fetchPhotos, checkRenderStatus]);

  // 렌더링 중 상태 폴링
  useEffect(() => {
    if (!isRendering) return;

    const interval = setInterval(async () => {
      const status = await checkRenderStatus();
      if (status?.status === 'completed' || status?.status === 'failed') {
        setIsRendering(false);
        if (status.status === 'completed') {
          toast.success('완료!', {
            description: '영상이 성공적으로 생성되었습니다.',
          });
        }
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [isRendering, checkRenderStatus]);

  // 렌더링 시작
  const handleStartRender = async () => {
    if (!videoSettings.title.trim()) {
      toast.error('오류', { description: '제목을 입력해주세요.' });
      return;
    }

    setIsRendering(true);

    try {
      const response = await fetch('/api/render', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId,
          title: videoSettings.title,
          subtitle: videoSettings.subtitle,
          date: videoSettings.date,
          message: videoSettings.message,
          musicTrack:
            videoSettings.musicTrack === 'none'
              ? undefined
              : videoSettings.musicTrack,
          musicVolume: videoSettings.musicVolume,
          resolution: videoSettings.resolution,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || '렌더링 요청에 실패했습니다.');
      }

      setRenderStatus({
        jobId: result.data.jobId,
        projectId,
        status: result.data.status,
        progress: result.data.progress,
        currentStep: result.data.currentStep,
      });

      toast.info('렌더링 시작', {
        description: '영상 생성을 시작합니다.',
      });
    } catch (error) {
      setIsRendering(false);
      toast.error('오류', {
        description:
          error instanceof Error
            ? error.message
            : '렌더링 요청에 실패했습니다.',
      });
    }
  };

  // 재시도
  const handleRetry = () => {
    setRenderStatus(null);
    handleStartRender();
  };

  const templateType = getTemplateType(project?.templates?.slug || 'wedding');
  const estimatedTime =
    photos.length * (videoSettings.resolution === 'full-hd' ? 30 : 20);

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
      <div className="flex items-center gap-3">
        <Link href={`/projects/${projectId}/edit`}>
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">
            {project.name} - 미리보기
          </h1>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {project.templates?.name || '템플릿'}
          </p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* 좌측: 설정 또는 진행률 */}
        <div className="space-y-6">
          {/* 렌더링 완료 상태 */}
          {renderStatus?.status === 'completed' && renderStatus.outputUrl ? (
            <div className="space-y-6">
              {/* 비디오 플레이어 */}
              <div className="rounded-xl border bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
                <h3 className="mb-4 flex items-center gap-2 font-medium text-gray-900 dark:text-gray-100">
                  <Film className="h-5 w-5" />
                  완성된 영상
                </h3>
                <VideoPlayer
                  src={renderStatus.outputUrl}
                  className="aspect-[9/16] max-h-[500px]"
                />
              </div>

              {/* 다운로드 버튼 */}
              <div className="rounded-xl border bg-white p-6 dark:border-gray-800 dark:bg-gray-900">
                <DownloadButton
                  videoUrl={renderStatus.outputUrl}
                  fileSize={renderStatus.fileSize}
                  fileName={`${project.name}.mp4`}
                  projectName={project.name}
                />
              </div>
            </div>
          ) : isRendering && renderStatus ? (
            /* 렌더링 진행 중 */
            <div className="rounded-xl border bg-white p-6 dark:border-gray-800 dark:bg-gray-900">
              <RenderProgress
                status={renderStatus.status}
                progress={renderStatus.progress}
                currentStep={renderStatus.currentStep}
                estimatedTime={estimatedTime}
                error={renderStatus.error}
                onRetry={handleRetry}
              />
            </div>
          ) : (
            /* 설정 폼 */
            <div className="rounded-xl border bg-white p-6 dark:border-gray-800 dark:bg-gray-900">
              <h3 className="mb-4 flex items-center gap-2 font-medium text-gray-900 dark:text-gray-100">
                <Sparkles className="h-5 w-5" />
                영상 설정
              </h3>
              <VideoSettingsForm
                settings={videoSettings}
                onChange={setVideoSettings}
                disabled={isRendering}
                templateType={templateType}
              />
            </div>
          )}
        </div>

        {/* 우측: 사진 목록 및 요약 */}
        <div className="space-y-6">
          {/* 요약 정보 */}
          <div className="rounded-xl border bg-white p-6 dark:border-gray-800 dark:bg-gray-900">
            <h3 className="mb-4 flex items-center gap-2 font-medium text-gray-900 dark:text-gray-100">
              <ImageIcon className="h-5 w-5" />
              프로젝트 요약
            </h3>

            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400">템플릿</span>
                <span className="font-medium text-gray-900 dark:text-gray-100">
                  {project.templates?.name}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400">
                  사진 수
                </span>
                <span className="font-medium text-gray-900 dark:text-gray-100">
                  {photos.length}장
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400">
                  예상 영상 길이
                </span>
                <span className="font-medium text-gray-900 dark:text-gray-100">
                  약 {Math.ceil((photos.length * 5 + 6) / 60)}분{' '}
                  {(photos.length * 5 + 6) % 60}초
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400">해상도</span>
                <span className="font-medium text-gray-900 dark:text-gray-100">
                  {videoSettings.resolution === 'full-hd'
                    ? '1920×1080 (Full HD)'
                    : '1280×720 (HD)'}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400">
                  예상 렌더링 시간
                </span>
                <span className="font-medium text-gray-900 dark:text-gray-100">
                  약 {Math.ceil(estimatedTime / 60)}분
                </span>
              </div>
            </div>
          </div>

          {/* 사진 미리보기 */}
          <div className="rounded-xl border bg-white p-6 dark:border-gray-800 dark:bg-gray-900">
            <h3 className="mb-4 font-medium text-gray-900 dark:text-gray-100">
              포함된 사진 ({photos.length}장)
            </h3>
            <div className="grid grid-cols-4 gap-2">
              {photos.slice(0, 8).map((photo, index) => (
                <div
                  key={photo.id}
                  className="relative aspect-square overflow-hidden rounded-lg"
                >
                  <img
                    src={photo.original_url}
                    alt={`사진 ${index + 1}`}
                    className="h-full w-full object-cover"
                  />
                  {photo.animated_url && (
                    <div className="absolute inset-0 flex items-center justify-center bg-green-500/20">
                      <span className="text-xs font-bold text-white drop-shadow">
                        AI
                      </span>
                    </div>
                  )}
                </div>
              ))}
              {photos.length > 8 && (
                <div className="flex aspect-square items-center justify-center rounded-lg bg-gray-100 dark:bg-gray-800">
                  <span className="text-sm text-gray-500">
                    +{photos.length - 8}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* 생성 버튼 */}
          {!isRendering && renderStatus?.status !== 'completed' && (
            <Button
              size="lg"
              className="w-full bg-gradient-to-r from-rose-500 to-pink-500 hover:from-rose-600 hover:to-pink-600"
              onClick={handleStartRender}
              disabled={photos.length === 0}
            >
              <Sparkles className="mr-2 h-5 w-5" />
              영상 생성 시작
            </Button>
          )}

          {/* 새 영상 생성 버튼 */}
          {renderStatus?.status === 'completed' && (
            <Button
              variant="outline"
              size="lg"
              className="w-full"
              onClick={() => {
                setRenderStatus(null);
              }}
            >
              새 설정으로 다시 생성
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

// 템플릿 슬러그로 타입 결정
function getTemplateType(
  slug: string
): 'wedding' | 'birthday' | 'seventy' {
  if (slug.includes('birthday')) return 'birthday';
  if (slug.includes('seventy') || slug.includes('70')) return 'seventy';
  return 'wedding';
}

// 템플릿별 기본 설정
function getDefaultSettings(slug: string): Partial<VideoSettings> {
  const type = getTemplateType(slug);
  switch (type) {
    case 'wedding':
      return {
        title: '우리의 아름다운 순간',
        subtitle: '영원히 함께',
        message: '사랑과 감사의 마음을 담아',
        musicTrack: 'romantic-piano',
      };
    case 'birthday':
      return {
        title: '생일 축하합니다!',
        subtitle: '특별한 하루',
        message: '행복한 생일이 되세요',
        musicTrack: 'happy-celebration',
      };
    case 'seventy':
      return {
        title: '칠순을 축하드립니다',
        subtitle: '건강과 장수를 기원합니다',
        message: '늘 건강하시고 행복하세요',
        musicTrack: 'traditional-korean',
      };
    default:
      return {};
  }
}
