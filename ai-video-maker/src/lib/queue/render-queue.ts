/**
 * Render Queue Management
 * 영상 렌더링 작업 큐 관리
 */

export type RenderStatus = 'queued' | 'preparing' | 'rendering' | 'encoding' | 'uploading' | 'completed' | 'failed';

export interface RenderJob {
  id: string;
  projectId: string;
  status: RenderStatus;
  progress: number;
  currentStep: string;
  startedAt?: Date;
  completedAt?: Date;
  outputUrl?: string;
  fileSize?: number;
  duration?: number;
  error?: string;
  options: RenderJobOptions;
}

export interface RenderJobOptions {
  compositionId: string;
  resolution: 'hd' | 'full-hd';
  title: string;
  subtitle?: string;
  date?: string;
  message?: string;
  musicTrack?: string;
  musicVolume: number;
  projectId?: string;
  projectName?: string;
  userId?: string;
}

// 인메모리 렌더링 큐 (프로덕션에서는 Redis/Bull Queue 사용 권장)
const renderQueue = new Map<string, RenderJob>();
const projectJobs = new Map<string, string>(); // projectId -> jobId

// 최대 동시 렌더링 작업 수
const MAX_CONCURRENT_RENDERS = 1;
let activeRenders = 0;

// 작업 큐
const pendingJobs: string[] = [];

/**
 * 렌더링 작업 추가
 */
export function addRenderJob(
  projectId: string,
  options: RenderJobOptions
): RenderJob {
  const jobId = `render_${projectId}_${Date.now()}`;

  // 기존 작업이 있으면 제거
  const existingJobId = projectJobs.get(projectId);
  if (existingJobId) {
    const existingJob = renderQueue.get(existingJobId);
    if (existingJob && existingJob.status !== 'completed' && existingJob.status !== 'failed') {
      // 진행 중인 작업이 있으면 새 작업 생성하지 않음
      return existingJob;
    }
  }

  const job: RenderJob = {
    id: jobId,
    projectId,
    status: 'queued',
    progress: 0,
    currentStep: '대기 중...',
    options,
  };

  renderQueue.set(jobId, job);
  projectJobs.set(projectId, jobId);
  pendingJobs.push(jobId);

  return job;
}

/**
 * 작업 가져오기
 */
export function getRenderJob(jobId: string): RenderJob | undefined {
  return renderQueue.get(jobId);
}

/**
 * 프로젝트의 렌더링 작업 가져오기
 */
export function getProjectRenderJob(projectId: string): RenderJob | undefined {
  const jobId = projectJobs.get(projectId);
  if (!jobId) return undefined;
  return renderQueue.get(jobId);
}

/**
 * 작업 상태 업데이트
 */
export function updateRenderJob(
  jobId: string,
  updates: Partial<RenderJob>
): RenderJob | undefined {
  const job = renderQueue.get(jobId);
  if (!job) return undefined;

  const updatedJob = { ...job, ...updates };
  renderQueue.set(jobId, updatedJob);
  return updatedJob;
}

/**
 * 작업 시작
 */
export function startRenderJob(jobId: string): boolean {
  if (activeRenders >= MAX_CONCURRENT_RENDERS) {
    return false;
  }

  const job = renderQueue.get(jobId);
  if (!job || job.status !== 'queued') {
    return false;
  }

  activeRenders++;
  updateRenderJob(jobId, {
    status: 'preparing',
    startedAt: new Date(),
    currentStep: '렌더링 준비 중...',
    progress: 5,
  });

  return true;
}

/**
 * 작업 완료
 */
export function completeRenderJob(
  jobId: string,
  outputUrl: string,
  fileSize: number,
  duration: number
): void {
  activeRenders = Math.max(0, activeRenders - 1);
  updateRenderJob(jobId, {
    status: 'completed',
    completedAt: new Date(),
    outputUrl,
    fileSize,
    duration,
    progress: 100,
    currentStep: '완료!',
  });

  // 다음 대기 작업 처리
  processNextJob();
}

/**
 * 작업 실패
 */
export function failRenderJob(jobId: string, error: string): void {
  activeRenders = Math.max(0, activeRenders - 1);
  updateRenderJob(jobId, {
    status: 'failed',
    completedAt: new Date(),
    error,
    currentStep: '오류 발생',
  });

  // 다음 대기 작업 처리
  processNextJob();
}

/**
 * 다음 대기 작업 처리
 */
function processNextJob(): void {
  if (pendingJobs.length === 0 || activeRenders >= MAX_CONCURRENT_RENDERS) {
    return;
  }

  const nextJobId = pendingJobs.shift();
  if (nextJobId) {
    startRenderJob(nextJobId);
  }
}

/**
 * 진행률 업데이트
 */
export function updateProgress(
  jobId: string,
  progress: number,
  status?: RenderStatus,
  currentStep?: string
): void {
  const updates: Partial<RenderJob> = { progress };
  if (status) updates.status = status;
  if (currentStep) updates.currentStep = currentStep;
  updateRenderJob(jobId, updates);
}

/**
 * 대기 중인 작업 수
 */
export function getQueueLength(): number {
  return pendingJobs.length;
}

/**
 * 활성 렌더링 수
 */
export function getActiveRenderCount(): number {
  return activeRenders;
}

/**
 * 렌더링 단계별 메시지
 */
export const RENDER_STEP_MESSAGES: Record<RenderStatus, string> = {
  queued: '대기 중...',
  preparing: '렌더링 준비 중...',
  rendering: '영상 렌더링 중...',
  encoding: '인코딩 중...',
  uploading: '업로드 중...',
  completed: '완료!',
  failed: '오류 발생',
};

/**
 * 예상 렌더링 시간 계산 (초)
 */
export function estimateRenderTime(
  photoCount: number,
  resolution: 'hd' | 'full-hd'
): number {
  const baseTimePerPhoto = 20; // 사진당 기본 시간 (초)
  const resolutionMultiplier = resolution === 'full-hd' ? 1.5 : 1;
  return Math.ceil(photoCount * baseTimePerPhoto * resolutionMultiplier);
}

/**
 * 활성 작업 목록 (관리자용)
 */
export function getActiveJobs(): RenderJob[] {
  return Array.from(renderQueue.values()).filter(
    (job) => job.status !== 'completed' && job.status !== 'failed'
  );
}

/**
 * 작업 통계 (관리자용)
 */
export function getJobsStats(): {
  pending: number;
  processing: number;
  completed: number;
  failed: number;
} {
  const jobs = Array.from(renderQueue.values());
  return {
    pending: jobs.filter((j) => j.status === 'queued').length,
    processing: jobs.filter(
      (j) => j.status === 'preparing' || j.status === 'rendering' || j.status === 'encoding' || j.status === 'uploading'
    ).length,
    completed: jobs.filter((j) => j.status === 'completed').length,
    failed: jobs.filter((j) => j.status === 'failed').length,
  };
}
