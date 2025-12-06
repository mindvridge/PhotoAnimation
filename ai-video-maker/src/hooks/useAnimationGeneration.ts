'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import type { AnimationPresetId } from '@/lib/kling-ai';

export interface AnimationJobStatus {
  id: string;
  photoId: string;
  status: 'queued' | 'processing' | 'completed' | 'failed';
  progress: number;
  resultUrl?: string;
  error?: string;
}

interface AnimationSettings {
  preset?: AnimationPresetId;
  customPrompt?: string;
  duration: 5 | 10;
  mode: 'standard' | 'pro';
}

interface UseAnimationGenerationOptions {
  projectId: string;
  onComplete?: () => void;
  onError?: (error: string) => void;
}

export function useAnimationGeneration({
  projectId,
  onComplete,
  onError,
}: UseAnimationGenerationOptions) {
  const [jobs, setJobs] = useState<AnimationJobStatus[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [creditUsed, setCreditUsed] = useState(0);
  const [remainingCredits, setRemainingCredits] = useState<number | null>(null);

  const pollingRef = useRef<NodeJS.Timeout | null>(null);
  const isPollingRef = useRef(false);

  // 폴링 정리
  useEffect(() => {
    return () => {
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
      }
    };
  }, []);

  // 작업 상태 폴링
  const pollJobStatus = useCallback(async () => {
    if (!isPollingRef.current) return;

    try {
      const response = await fetch(`/api/animations?projectId=${projectId}`);
      if (!response.ok) return;

      const result = await response.json();
      const updatedJobs: AnimationJobStatus[] = result.jobs || [];

      setJobs(updatedJobs);

      // 모든 작업이 완료되었는지 확인
      const allCompleted = updatedJobs.every(
        (j) => j.status === 'completed' || j.status === 'failed'
      );

      if (allCompleted && updatedJobs.length > 0) {
        isPollingRef.current = false;
        if (pollingRef.current) {
          clearInterval(pollingRef.current);
          pollingRef.current = null;
        }
        setIsGenerating(false);

        // 완료 콜백
        const failedCount = updatedJobs.filter((j) => j.status === 'failed').length;
        if (failedCount > 0) {
          onError?.(`${failedCount}개의 애니메이션 생성에 실패했습니다.`);
        } else {
          onComplete?.();
        }
      }
    } catch (error) {
      console.error('Poll job status error:', error);
    }
  }, [projectId, onComplete, onError]);

  // 폴링 시작
  const startPolling = useCallback(() => {
    if (pollingRef.current) {
      clearInterval(pollingRef.current);
    }

    isPollingRef.current = true;
    pollingRef.current = setInterval(pollJobStatus, 3000);
    pollJobStatus(); // 즉시 한 번 실행
  }, [pollJobStatus]);

  // 애니메이션 일괄 생성
  const generateAnimations = useCallback(
    async (photoIds: string[], settings: AnimationSettings) => {
      if (photoIds.length === 0) {
        onError?.('사진을 선택해주세요.');
        return false;
      }

      setIsGenerating(true);
      setJobs([]);

      try {
        const response = await fetch('/api/animations', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            projectId,
            photoIds,
            settings,
          }),
        });

        const result = await response.json();

        if (!response.ok) {
          throw new Error(result.error || '애니메이션 생성 요청에 실패했습니다.');
        }

        // 초기 작업 상태 설정
        const initialJobs: AnimationJobStatus[] = result.jobs.map(
          (j: { id: string; photoId: string; status: string }) => ({
            id: j.id,
            photoId: j.photoId,
            status: j.status as AnimationJobStatus['status'],
            progress: 0,
          })
        );

        setJobs(initialJobs);
        setCreditUsed(result.creditUsed);
        setRemainingCredits(result.remainingCredits);

        // 폴링 시작
        startPolling();

        return true;
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.';
        onError?.(errorMessage);
        setIsGenerating(false);
        return false;
      }
    },
    [projectId, startPolling, onError]
  );

  // 작업 재시도
  const retryJob = useCallback(
    async (jobId: string) => {
      try {
        const response = await fetch(`/api/animations/${jobId}/status`, {
          method: 'POST',
        });

        if (!response.ok) {
          const result = await response.json();
          throw new Error(result.error || '재시도에 실패했습니다.');
        }

        // 작업 상태 업데이트
        setJobs((prev) =>
          prev.map((j) =>
            j.id === jobId
              ? { ...j, status: 'queued' as const, progress: 0, error: undefined }
              : j
          )
        );

        // 폴링이 멈춰있으면 다시 시작
        if (!isPollingRef.current) {
          setIsGenerating(true);
          startPolling();
        }
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : '재시도에 실패했습니다.';
        onError?.(errorMessage);
      }
    },
    [startPolling, onError]
  );

  // 생성 취소
  const cancelGeneration = useCallback(() => {
    isPollingRef.current = false;
    if (pollingRef.current) {
      clearInterval(pollingRef.current);
      pollingRef.current = null;
    }
    setIsGenerating(false);
  }, []);

  // 기존 작업 상태 로드
  const loadExistingJobs = useCallback(async () => {
    try {
      const response = await fetch(`/api/animations?projectId=${projectId}`);
      if (!response.ok) return;

      const result = await response.json();
      const existingJobs: AnimationJobStatus[] = result.jobs || [];

      setJobs(existingJobs);

      // 처리 중인 작업이 있으면 폴링 시작
      const hasProcessing = existingJobs.some(
        (j) => j.status === 'queued' || j.status === 'processing'
      );

      if (hasProcessing) {
        setIsGenerating(true);
        startPolling();
      }
    } catch (error) {
      console.error('Load existing jobs error:', error);
    }
  }, [projectId, startPolling]);

  return {
    jobs,
    isGenerating,
    creditUsed,
    remainingCredits,
    generateAnimations,
    retryJob,
    cancelGeneration,
    loadExistingJobs,
  };
}

export default useAnimationGeneration;
