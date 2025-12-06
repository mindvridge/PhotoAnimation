'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { calculateRequiredCredits } from '@/lib/tosspayments';

interface UseCreditsResult {
  credits: number;
  isLoading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  useCredits: (amount: number, description?: string) => Promise<boolean>;
  hasEnoughCredits: (amount: number) => boolean;
  calculateCost: (photoCount: number, resolution: 'hd' | 'full-hd') => number;
}

interface CreditTransaction {
  amount: number;
  description: string;
  createdAt: Date;
}

export function useCredits(): UseCreditsResult {
  const [credits, setCredits] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const supabase = createClient();

  // 크레딧 조회
  const fetchCredits = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setCredits(0);
        return;
      }

      const { data, error: fetchError } = await supabase
        .from('users')
        .select('credits')
        .eq('id', user.id)
        .single();

      if (fetchError) {
        throw fetchError;
      }

      setCredits(data?.credits || 0);
    } catch (err) {
      console.error('Error fetching credits:', err);
      setError('크레딧 정보를 불러올 수 없습니다.');
    } finally {
      setIsLoading(false);
    }
  }, [supabase]);

  // 초기 로드
  useEffect(() => {
    fetchCredits();
  }, [fetchCredits]);

  // 실시간 구독 (선택적)
  useEffect(() => {
    const channel = supabase
      .channel('credits-changes')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'users',
        },
        (payload) => {
          if (payload.new && 'credits' in payload.new) {
            setCredits(payload.new.credits as number);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase]);

  // 크레딧 사용
  const useCreditsAmount = useCallback(
    async (amount: number, _description?: string): Promise<boolean> => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
          throw new Error('인증이 필요합니다.');
        }

        // 현재 크레딧 확인
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('credits')
          .eq('id', user.id)
          .single();

        if (userError || !userData) {
          throw new Error('사용자 정보를 찾을 수 없습니다.');
        }

        if (userData.credits < amount) {
          throw new Error('크레딧이 부족합니다.');
        }

        // 크레딧 차감
        const newCredits = userData.credits - amount;
        const { error: updateError } = await supabase
          .from('users')
          .update({ credits: newCredits })
          .eq('id', user.id);

        if (updateError) {
          throw updateError;
        }

        setCredits(newCredits);
        return true;
      } catch (err) {
        console.error('Error using credits:', err);
        setError(err instanceof Error ? err.message : '크레딧 사용에 실패했습니다.');
        return false;
      }
    },
    [supabase]
  );

  // 크레딧 충분 여부 확인
  const hasEnoughCredits = useCallback(
    (amount: number): boolean => {
      return credits >= amount;
    },
    [credits]
  );

  // 필요 크레딧 계산
  const calculateCost = useCallback(
    (photoCount: number, resolution: 'hd' | 'full-hd'): number => {
      return calculateRequiredCredits(photoCount, resolution);
    },
    []
  );

  return {
    credits,
    isLoading,
    error,
    refresh: fetchCredits,
    useCredits: useCreditsAmount,
    hasEnoughCredits,
    calculateCost,
  };
}

// 크레딧 표시 포맷
export function formatCredits(credits: number): string {
  return credits.toLocaleString('ko-KR');
}

// 크레딧 부족 경고 컴포넌트용 타입
export interface CreditWarningProps {
  required: number;
  available: number;
  onPurchase?: () => void;
}

export default useCredits;
