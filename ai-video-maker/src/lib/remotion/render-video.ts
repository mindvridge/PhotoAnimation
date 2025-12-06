/**
 * Server-Side Video Rendering
 * Remotion을 사용한 서버사이드 영상 렌더링
 *
 * 참고: 실제 프로덕션에서는 Remotion Lambda 또는 별도 렌더링 서버 사용 권장
 * @remotion/bundler, @remotion/renderer는 네이티브 바이너리를 포함하므로
 * Next.js 빌드에 포함되지 않습니다. 별도 렌더링 서비스 구현이 필요합니다.
 */

import {
  updateProgress,
  completeRenderJob,
  failRenderJob,
  type RenderJobOptions,
} from '@/lib/queue/render-queue';
import {
  DEFAULT_FPS,
  INTRO_DURATION_FRAMES,
  OUTRO_DURATION_FRAMES,
  type TemplateProps,
  type PhotoItem,
} from '@/remotion/types';

// 해상도 설정
const RESOLUTION_CONFIG = {
  hd: { width: 1280, height: 720 },
  'full-hd': { width: 1920, height: 1080 },
} as const;

export interface RenderVideoParams {
  jobId: string;
  projectId: string;
  options: RenderJobOptions;
  photos: PhotoItem[];
}

/**
 * 영상 렌더링 실행
 *
 * 참고: 실제 프로덕션에서는 Remotion Lambda 또는 별도 렌더링 서버 사용 권장
 * 이 구현은 데모/개발용 로컬 렌더링 시뮬레이션입니다.
 */
export async function renderVideo(params: RenderVideoParams): Promise<string> {
  const { jobId, projectId, options, photos } = params;

  try {
    // 1. 준비 단계
    updateProgress(jobId, 10, 'preparing', '프로젝트 데이터 로드 중...');
    await sleep(1000);

    // 템플릿 Props 생성
    const templateProps = createTemplateProps(options, photos);
    const totalFrames = calculateTotalFrames(photos);
    const resolution = RESOLUTION_CONFIG[options.resolution];

    updateProgress(jobId, 15, 'preparing', '렌더링 설정 구성 중...');
    await sleep(500);

    // 2. 렌더링 단계 (시뮬레이션)
    // 실제 구현에서는 여기서 Remotion 번들 및 렌더링 수행
    updateProgress(jobId, 20, 'rendering', '영상 렌더링 시작...');

    // 렌더링 진행 시뮬레이션
    const renderSteps = 60;
    for (let i = 0; i < renderSteps; i++) {
      const progress = 20 + Math.floor((i / renderSteps) * 50);
      const frameProgress = Math.floor((i / renderSteps) * totalFrames);
      updateProgress(
        jobId,
        progress,
        'rendering',
        `프레임 렌더링 중... (${frameProgress}/${totalFrames})`
      );
      await sleep(100);
    }

    // 3. 인코딩 단계
    updateProgress(jobId, 75, 'encoding', 'H.264 인코딩 중...');
    await sleep(2000);
    updateProgress(jobId, 85, 'encoding', '오디오 믹싱 중...');
    await sleep(1000);

    // 4. 업로드 단계
    updateProgress(jobId, 90, 'uploading', '영상 저장 중...');
    await sleep(1500);
    updateProgress(jobId, 95, 'uploading', '메타데이터 저장 중...');
    await sleep(500);

    // 5. 완료
    // 실제 구현에서는 S3 URL 반환
    const outputUrl = `/api/render/${jobId}/download`;
    const fileSize = estimateFileSize(photos.length, options.resolution);
    const duration = totalFrames / DEFAULT_FPS;

    completeRenderJob(jobId, outputUrl, fileSize, duration);

    return outputUrl;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.';
    failRenderJob(jobId, errorMessage);
    throw error;
  }
}

/**
 * 실제 Remotion 렌더링 (프로덕션용)
 *
 * 참고: 이 함수는 별도의 렌더링 서버에서 실행되어야 합니다.
 * Next.js 앱에서는 @remotion/bundler, @remotion/renderer가
 * 네이티브 바이너리 의존성 문제로 빌드되지 않습니다.
 *
 * 프로덕션 옵션:
 * 1. Remotion Lambda 사용 (권장)
 * 2. 별도 Node.js 렌더링 서버 구축
 * 3. Docker 컨테이너 기반 렌더링 서비스
 *
 * @see https://www.remotion.dev/docs/lambda
 */
export async function renderVideoWithRemotion(_params: RenderVideoParams): Promise<string> {
  throw new Error(
    '실제 Remotion 렌더링은 별도의 렌더링 서버가 필요합니다. ' +
    'Remotion Lambda 또는 별도 서버 구성을 참조하세요.'
  );
}

/**
 * 템플릿 Props 생성
 */
function createTemplateProps(
  options: RenderJobOptions,
  photos: PhotoItem[]
): TemplateProps {
  return {
    title: options.title,
    subtitle: options.subtitle,
    date: options.date,
    message: options.message,
    photos,
    musicUrl: options.musicTrack ? `/music/${options.musicTrack}` : undefined,
    musicVolume: options.musicVolume,
  };
}

/**
 * 총 프레임 수 계산
 */
function calculateTotalFrames(photos: PhotoItem[]): number {
  const photoDuration = photos.reduce((total, photo) => total + photo.duration, 0);
  return INTRO_DURATION_FRAMES + photoDuration + OUTRO_DURATION_FRAMES;
}

/**
 * 예상 파일 크기 (bytes)
 */
function estimateFileSize(photoCount: number, resolution: 'hd' | 'full-hd'): number {
  // 대략적인 추정: 사진당 2MB (HD) 또는 4MB (Full HD)
  const sizePerPhoto = resolution === 'full-hd' ? 4 * 1024 * 1024 : 2 * 1024 * 1024;
  return photoCount * sizePerPhoto + 5 * 1024 * 1024; // 기본 오버헤드 5MB
}

/**
 * 대기 함수
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// 배경음악 목록은 @/lib/remotion/music-tracks.ts에서 import하세요
export { MUSIC_TRACKS, type MusicTrackId } from './music-tracks';
