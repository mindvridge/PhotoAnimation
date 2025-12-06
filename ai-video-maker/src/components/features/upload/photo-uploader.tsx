'use client';

import { useCallback, useRef, useState } from 'react';
import { cn } from '@/lib/utils';
import { Upload, Image as ImageIcon, AlertCircle, X, RefreshCw, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import type { UploadingPhoto } from '@/hooks/usePhotoUpload';

interface PhotoUploaderProps {
  uploadingPhotos: UploadingPhoto[];
  isUploading: boolean;
  maxPhotos: number;
  currentPhotoCount: number;
  onFilesSelected: (files: FileList | File[]) => void;
  onRetry: (id: string) => void;
  onRemove: (id: string) => void;
}

export function PhotoUploader({
  uploadingPhotos,
  isUploading,
  maxPhotos,
  currentPhotoCount,
  onFilesSelected,
  onRetry,
  onRemove,
}: PhotoUploaderProps) {
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const remainingSlots = maxPhotos - currentPhotoCount;

  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);

      const files = e.dataTransfer.files;
      if (files.length > 0) {
        onFilesSelected(files);
      }
    },
    [onFilesSelected]
  );

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;
      if (files && files.length > 0) {
        onFilesSelected(files);
      }
      // Reset input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    },
    [onFilesSelected]
  );

  const handleButtonClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const getStatusText = (status: UploadingPhoto['status']) => {
    switch (status) {
      case 'pending':
        return '대기 중...';
      case 'analyzing':
        return '분석 중...';
      case 'uploading':
        return '업로드 중...';
      case 'completed':
        return '완료';
      case 'error':
        return '오류';
      default:
        return '';
    }
  };

  const getStatusColor = (status: UploadingPhoto['status']) => {
    switch (status) {
      case 'completed':
        return 'text-green-600';
      case 'error':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  return (
    <div className="space-y-4">
      {/* 드래그 앤 드롭 영역 */}
      <div
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        className={cn(
          'relative rounded-xl border-2 border-dashed p-8 text-center transition-all',
          isDragging
            ? 'border-rose-400 bg-rose-50 dark:border-rose-600 dark:bg-rose-950/30'
            : 'border-gray-300 bg-gray-50/50 hover:border-gray-400 dark:border-gray-700 dark:bg-gray-900/50 dark:hover:border-gray-600',
          remainingSlots <= 0 && 'cursor-not-allowed opacity-60'
        )}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          multiple
          onChange={handleFileSelect}
          className="hidden"
          disabled={remainingSlots <= 0}
        />

        <div className="flex flex-col items-center gap-4">
          <div
            className={cn(
              'rounded-full p-4 transition-colors',
              isDragging
                ? 'bg-rose-100 dark:bg-rose-900/50'
                : 'bg-gray-100 dark:bg-gray-800'
            )}
          >
            <Upload
              className={cn(
                'h-8 w-8 transition-colors',
                isDragging ? 'text-rose-500' : 'text-gray-400'
              )}
            />
          </div>

          <div>
            <p className="text-lg font-medium text-gray-700 dark:text-gray-300">
              {isDragging ? '여기에 놓으세요!' : '사진을 드래그하거나'}
            </p>
            {!isDragging && (
              <Button
                type="button"
                variant="link"
                className="text-rose-500 hover:text-rose-600"
                onClick={handleButtonClick}
                disabled={remainingSlots <= 0}
              >
                파일 선택하기
              </Button>
            )}
          </div>

          <div className="text-sm text-gray-500 dark:text-gray-400">
            <p>JPG, PNG, WebP • 최대 10MB</p>
            <p>최소 해상도 512x512px</p>
            <p className="mt-1 font-medium">
              {remainingSlots > 0
                ? `${remainingSlots}장 더 업로드 가능`
                : '최대 개수에 도달했습니다'}
            </p>
          </div>
        </div>
      </div>

      {/* 업로드 중인 사진 목록 */}
      {uploadingPhotos.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">
            업로드 진행 상황
          </h3>
          <div className="space-y-2">
            {uploadingPhotos.map((photo) => (
              <div
                key={photo.id}
                className={cn(
                  'flex items-center gap-3 rounded-lg border p-3 transition-colors',
                  photo.status === 'error'
                    ? 'border-red-200 bg-red-50 dark:border-red-900 dark:bg-red-950/30'
                    : photo.status === 'completed'
                    ? 'border-green-200 bg-green-50 dark:border-green-900 dark:bg-green-950/30'
                    : 'border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900'
                )}
              >
                {/* 썸네일 */}
                <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-lg">
                  <img
                    src={photo.preview}
                    alt="미리보기"
                    className="h-full w-full object-cover"
                  />
                  {photo.status === 'completed' && (
                    <div className="absolute inset-0 flex items-center justify-center bg-green-500/80">
                      <Check className="h-6 w-6 text-white" />
                    </div>
                  )}
                  {photo.status === 'error' && (
                    <div className="absolute inset-0 flex items-center justify-center bg-red-500/80">
                      <AlertCircle className="h-6 w-6 text-white" />
                    </div>
                  )}
                </div>

                {/* 정보 */}
                <div className="flex-1 min-w-0">
                  <p className="truncate text-sm font-medium text-gray-900 dark:text-gray-100">
                    {photo.file.name}
                  </p>
                  <div className="mt-1 flex items-center gap-2">
                    <span className={cn('text-xs', getStatusColor(photo.status))}>
                      {getStatusText(photo.status)}
                    </span>
                    {photo.error && (
                      <span className="text-xs text-red-600">{photo.error}</span>
                    )}
                  </div>
                  {(photo.status === 'analyzing' || photo.status === 'uploading') && (
                    <Progress value={photo.progress} className="mt-2 h-1" />
                  )}
                  {photo.warnings.length > 0 && photo.status === 'completed' && (
                    <div className="mt-1 flex items-start gap-1">
                      <AlertCircle className="h-3 w-3 shrink-0 text-amber-500 mt-0.5" />
                      <span className="text-xs text-amber-600 dark:text-amber-400">
                        {photo.warnings[0]}
                        {photo.warnings.length > 1 && ` 외 ${photo.warnings.length - 1}개`}
                      </span>
                    </div>
                  )}
                </div>

                {/* 액션 버튼 */}
                <div className="flex items-center gap-1">
                  {photo.status === 'error' && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => onRetry(photo.id)}
                    >
                      <RefreshCw className="h-4 w-4" />
                    </Button>
                  )}
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-gray-400 hover:text-gray-600"
                    onClick={() => onRemove(photo.id)}
                    disabled={photo.status === 'uploading' || photo.status === 'analyzing'}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 지원 형식 안내 */}
      <div className="flex items-start gap-2 rounded-lg bg-blue-50 p-3 text-sm dark:bg-blue-950/30">
        <ImageIcon className="h-5 w-5 shrink-0 text-blue-500" />
        <div className="text-blue-700 dark:text-blue-300">
          <p className="font-medium">최고의 결과를 위한 팁</p>
          <ul className="mt-1 list-inside list-disc text-xs text-blue-600 dark:text-blue-400">
            <li>얼굴이 사진의 20% 이상을 차지하는 것이 좋습니다</li>
            <li>정면을 바라보는 사진이 더 좋은 결과를 만듭니다</li>
            <li>밝고 선명한 사진을 사용해주세요</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
