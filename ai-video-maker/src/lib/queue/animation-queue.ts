/**
 * 애니메이션 생성 큐 관리
 * 인메모리 큐 - 프로덕션에서는 Redis/Bull 사용 권장
 */

import { generateAnimation, checkStatus, type KlingAnimationSettings } from '@/lib/kling-ai';

export interface AnimationJob {
  id: string;
  photoId: string;
  projectId: string;
  imageUrl: string;
  settings: KlingAnimationSettings;
  status: 'queued' | 'processing' | 'completed' | 'failed';
  taskId?: string;
  resultUrl?: string;
  error?: string;
  progress: number;
  createdAt: Date;
  updatedAt: Date;
  retryCount: number;
}

export interface QueueStatus {
  total: number;
  queued: number;
  processing: number;
  completed: number;
  failed: number;
}

// 인메모리 큐 저장소
const jobQueue: Map<string, AnimationJob> = new Map();
const processingQueue: Set<string> = new Set();

// 동시 처리 제한
const MAX_CONCURRENT = 3;
const MAX_RETRIES = 3;
const POLL_INTERVAL = 5000; // 5초

// 처리 루프 실행 중 여부
let isProcessing = false;

/**
 * 큐에 작업 추가
 */
export function addToQueue(
  photoId: string,
  projectId: string,
  imageUrl: string,
  settings: KlingAnimationSettings
): AnimationJob {
  const jobId = `job_${Date.now()}_${Math.random().toString(36).substring(7)}`;

  const job: AnimationJob = {
    id: jobId,
    photoId,
    projectId,
    imageUrl,
    settings,
    status: 'queued',
    progress: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
    retryCount: 0,
  };

  jobQueue.set(jobId, job);

  // 처리 루프 시작
  if (!isProcessing) {
    startProcessing();
  }

  return job;
}

/**
 * 작업 상태 조회
 */
export function getJob(jobId: string): AnimationJob | undefined {
  return jobQueue.get(jobId);
}

/**
 * 프로젝트의 모든 작업 조회
 */
export function getProjectJobs(projectId: string): AnimationJob[] {
  return Array.from(jobQueue.values()).filter((job) => job.projectId === projectId);
}

/**
 * 사진의 작업 조회
 */
export function getPhotoJob(photoId: string): AnimationJob | undefined {
  return Array.from(jobQueue.values()).find((job) => job.photoId === photoId);
}

/**
 * 큐 상태 조회
 */
export function getQueueStatus(): QueueStatus {
  const jobs = Array.from(jobQueue.values());
  return {
    total: jobs.length,
    queued: jobs.filter((j) => j.status === 'queued').length,
    processing: jobs.filter((j) => j.status === 'processing').length,
    completed: jobs.filter((j) => j.status === 'completed').length,
    failed: jobs.filter((j) => j.status === 'failed').length,
  };
}

/**
 * 작업 재시도
 */
export function retryJob(jobId: string): boolean {
  const job = jobQueue.get(jobId);
  if (!job || job.status !== 'failed') {
    return false;
  }

  job.status = 'queued';
  job.error = undefined;
  job.progress = 0;
  job.retryCount += 1;
  job.updatedAt = new Date();
  jobQueue.set(jobId, job);

  // 처리 루프 시작
  if (!isProcessing) {
    startProcessing();
  }

  return true;
}

/**
 * 작업 취소
 */
export function cancelJob(jobId: string): boolean {
  const job = jobQueue.get(jobId);
  if (!job || job.status === 'completed') {
    return false;
  }

  processingQueue.delete(jobId);
  jobQueue.delete(jobId);
  return true;
}

/**
 * 처리 루프 시작
 */
async function startProcessing() {
  if (isProcessing) return;
  isProcessing = true;

  while (true) {
    // 처리할 작업 찾기
    const queuedJobs = Array.from(jobQueue.values())
      .filter((job) => job.status === 'queued')
      .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());

    // 동시 처리 제한 확인
    const currentProcessing = processingQueue.size;
    const availableSlots = MAX_CONCURRENT - currentProcessing;

    if (availableSlots > 0 && queuedJobs.length > 0) {
      // 처리할 작업 선택
      const jobsToProcess = queuedJobs.slice(0, availableSlots);

      // 병렬로 처리 시작
      await Promise.all(jobsToProcess.map(processJob));
    }

    // 처리 중인 작업 상태 확인
    await checkProcessingJobs();

    // 더 이상 처리할 작업이 없으면 종료
    const remainingJobs = Array.from(jobQueue.values()).filter(
      (job) => job.status === 'queued' || job.status === 'processing'
    );

    if (remainingJobs.length === 0) {
      isProcessing = false;
      break;
    }

    // 대기
    await new Promise((resolve) => setTimeout(resolve, POLL_INTERVAL));
  }
}

/**
 * 단일 작업 처리
 */
async function processJob(job: AnimationJob) {
  processingQueue.add(job.id);

  try {
    // 상태 업데이트
    job.status = 'processing';
    job.progress = 10;
    job.updatedAt = new Date();
    jobQueue.set(job.id, job);

    // Kling AI에 생성 요청
    const result = await generateAnimation(job.imageUrl, job.settings);

    if (result.status === 'failed' || !result.taskId) {
      throw new Error(result.error || '애니메이션 생성 요청에 실패했습니다.');
    }

    // taskId 저장
    job.taskId = result.taskId;
    job.progress = 20;
    job.updatedAt = new Date();
    jobQueue.set(job.id, job);
  } catch (error) {
    handleJobError(job, error);
  }
}

/**
 * 처리 중인 작업들의 상태 확인
 */
async function checkProcessingJobs() {
  const processingJobs = Array.from(jobQueue.values()).filter(
    (job) => job.status === 'processing' && job.taskId
  );

  await Promise.all(
    processingJobs.map(async (job) => {
      try {
        const status = await checkStatus(job.taskId!);

        job.updatedAt = new Date();

        switch (status.status) {
          case 'completed':
            job.status = 'completed';
            job.progress = 100;
            job.resultUrl = status.resultUrl;
            processingQueue.delete(job.id);
            break;

          case 'failed':
            throw new Error(status.error || '애니메이션 생성에 실패했습니다.');

          case 'processing':
            job.progress = Math.min(90, (status.progress || 50));
            break;

          case 'pending':
            job.progress = 30;
            break;
        }

        jobQueue.set(job.id, job);
      } catch (error) {
        handleJobError(job, error);
      }
    })
  );
}

/**
 * 작업 에러 처리
 */
function handleJobError(job: AnimationJob, error: unknown) {
  const errorMessage = error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.';

  if (job.retryCount < MAX_RETRIES) {
    // 재시도
    job.status = 'queued';
    job.retryCount += 1;
    job.progress = 0;
    job.taskId = undefined;
  } else {
    // 최대 재시도 횟수 초과
    job.status = 'failed';
    job.error = errorMessage;
  }

  job.updatedAt = new Date();
  jobQueue.set(job.id, job);
  processingQueue.delete(job.id);
}

/**
 * 오래된 완료/실패 작업 정리
 */
export function cleanupOldJobs(maxAgeMs: number = 24 * 60 * 60 * 1000) {
  const now = Date.now();

  for (const [jobId, job] of jobQueue.entries()) {
    if (
      (job.status === 'completed' || job.status === 'failed') &&
      now - job.updatedAt.getTime() > maxAgeMs
    ) {
      jobQueue.delete(jobId);
    }
  }
}
