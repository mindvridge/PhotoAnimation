'use client';

import React, { useState } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Download,
  Share2,
  Check,
  Copy,
  MessageCircle,
  Instagram,
  Loader2,
} from 'lucide-react';
import { toast } from 'sonner';

interface DownloadButtonProps {
  videoUrl: string;
  fileSize?: number;
  fileName?: string;
  projectName?: string;
  className?: string;
}

export function DownloadButton({
  videoUrl,
  fileSize,
  fileName = 'video.mp4',
  projectName,
  className,
}: DownloadButtonProps) {
  const [isDownloading, setIsDownloading] = useState(false);
  const [showShareMenu, setShowShareMenu] = useState(false);

  // 파일 크기 포맷
  const formatFileSize = (bytes: number) => {
    if (bytes < 1024 * 1024) {
      return `${(bytes / 1024).toFixed(1)} KB`;
    }
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  // 다운로드 처리
  const handleDownload = async () => {
    setIsDownloading(true);
    try {
      const response = await fetch(videoUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      toast.success('다운로드 완료', {
        description: '영상이 저장되었습니다.',
      });
    } catch (error) {
      toast.error('다운로드 실패', {
        description: '영상 다운로드 중 오류가 발생했습니다.',
      });
    } finally {
      setIsDownloading(false);
    }
  };

  // 링크 복사
  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      toast.success('링크 복사됨', {
        description: '클립보드에 링크가 복사되었습니다.',
      });
    } catch (error) {
      toast.error('복사 실패', {
        description: '링크 복사에 실패했습니다.',
      });
    }
  };

  // 카카오톡 공유
  const shareToKakao = () => {
    // 카카오톡 공유 API (실제 구현 시 Kakao SDK 필요)
    const shareUrl = `https://story.kakao.com/share?url=${encodeURIComponent(window.location.href)}`;
    window.open(shareUrl, '_blank', 'width=600,height=600');
  };

  return (
    <div className={cn('space-y-4', className)}>
      {/* 메인 다운로드 버튼 */}
      <Button
        size="lg"
        className="w-full bg-gradient-to-r from-rose-500 to-pink-500 hover:from-rose-600 hover:to-pink-600"
        onClick={handleDownload}
        disabled={isDownloading}
      >
        {isDownloading ? (
          <>
            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
            다운로드 중...
          </>
        ) : (
          <>
            <Download className="mr-2 h-5 w-5" />
            영상 다운로드
          </>
        )}
      </Button>

      {/* 파일 정보 */}
      {fileSize && (
        <p className="text-center text-sm text-gray-500 dark:text-gray-400">
          파일 크기: {formatFileSize(fileSize)}
        </p>
      )}

      {/* 공유 버튼 */}
      <div className="relative">
        <Button
          variant="outline"
          className="w-full"
          onClick={() => setShowShareMenu(!showShareMenu)}
        >
          <Share2 className="mr-2 h-4 w-4" />
          공유하기
        </Button>

        {/* 공유 메뉴 */}
        {showShareMenu && (
          <div className="absolute left-0 right-0 top-full z-10 mt-2 rounded-lg border bg-white p-2 shadow-lg dark:border-gray-700 dark:bg-gray-800">
            <button
              onClick={handleCopyLink}
              className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm transition-colors hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              <Copy className="h-4 w-4 text-gray-500" />
              <span>링크 복사</span>
            </button>
            <button
              onClick={shareToKakao}
              className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm transition-colors hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              <MessageCircle className="h-4 w-4 text-yellow-500" />
              <span>카카오톡 공유</span>
            </button>
            <button
              onClick={() => {
                // 인스타그램은 직접 공유 불가, 안내 메시지 표시
                toast.info('인스타그램 공유', {
                  description:
                    '영상을 다운로드한 후 인스타그램 앱에서 업로드해주세요.',
                });
              }}
              className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm transition-colors hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              <Instagram className="h-4 w-4 text-pink-500" />
              <span>인스타그램 공유</span>
            </button>
          </div>
        )}
      </div>

      {/* 완료 메시지 */}
      <div className="flex items-center justify-center gap-2 text-sm text-green-600 dark:text-green-400">
        <Check className="h-4 w-4" />
        <span>영상이 성공적으로 생성되었습니다!</span>
      </div>
    </div>
  );
}

export default DownloadButton;
