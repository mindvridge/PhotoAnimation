'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { signInWithGoogle, signInWithKakao } from '@/lib/supabase/auth';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

interface SocialLoginButtonsProps {
  disabled?: boolean;
}

export function SocialLoginButtons({ disabled }: SocialLoginButtonsProps) {
  const [loadingProvider, setLoadingProvider] = useState<string | null>(null);

  const handleGoogleLogin = async () => {
    try {
      setLoadingProvider('google');
      await signInWithGoogle();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Google 로그인에 실패했습니다.'
      );
      setLoadingProvider(null);
    }
  };

  const handleKakaoLogin = async () => {
    try {
      setLoadingProvider('kakao');
      await signInWithKakao();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : '카카오 로그인에 실패했습니다.'
      );
      setLoadingProvider(null);
    }
  };

  const isLoading = loadingProvider !== null || disabled;

  return (
    <div className="grid gap-3">
      <Button
        variant="outline"
        type="button"
        disabled={isLoading}
        onClick={handleGoogleLogin}
        className="h-11"
      >
        {loadingProvider === 'google' ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        ) : (
          <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
            <path
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              fill="#4285F4"
            />
            <path
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              fill="#34A853"
            />
            <path
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              fill="#FBBC05"
            />
            <path
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              fill="#EA4335"
            />
          </svg>
        )}
        Google로 계속하기
      </Button>

      <Button
        variant="outline"
        type="button"
        disabled={isLoading}
        onClick={handleKakaoLogin}
        className="h-11 bg-[#FEE500] text-[#191919] hover:bg-[#FDD835] hover:text-[#191919] border-transparent"
      >
        {loadingProvider === 'kakao' ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        ) : (
          <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 3c-5.52 0-10 3.59-10 8.03 0 2.85 1.87 5.35 4.68 6.77l-.95 3.53c-.08.3.26.54.52.37l4.2-2.78c.5.05 1.02.08 1.55.08 5.52 0 10-3.59 10-8.03S17.52 3 12 3z" />
          </svg>
        )}
        카카오로 계속하기
      </Button>
    </div>
  );
}
