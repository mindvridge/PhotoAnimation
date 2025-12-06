'use client';

import { useState, useCallback } from 'react';
import {
  detectFaces,
  validateImage,
  createImageElement,
  isValidImageFormat,
  isValidFileSize,
  type FaceDetectionResult,
  type ImageValidationResult,
} from '@/lib/face-detection';

export interface UploadingPhoto {
  id: string;
  file: File;
  preview: string;
  progress: number;
  status: 'pending' | 'uploading' | 'analyzing' | 'completed' | 'error';
  error?: string;
  warnings: string[];
  faceDetection?: FaceDetectionResult;
  imageValidation?: ImageValidationResult;
  uploadedPhotoId?: string;
}

interface UsePhotoUploadOptions {
  projectId: string;
  maxPhotos: number;
  currentPhotoCount: number;
  onUploadComplete?: (photoId: string) => void;
  onError?: (error: string) => void;
}

export function usePhotoUpload({
  projectId,
  maxPhotos,
  currentPhotoCount,
  onUploadComplete,
  onError,
}: UsePhotoUploadOptions) {
  const [uploadingPhotos, setUploadingPhotos] = useState<UploadingPhoto[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  // 파일 유효성 검사
  const validateFile = useCallback((file: File): { valid: boolean; error?: string } => {
    if (!isValidImageFormat(file)) {
      return { valid: false, error: 'JPG, PNG, WebP 형식만 지원됩니다.' };
    }
    if (!isValidFileSize(file, 10)) {
      return { valid: false, error: '파일 크기는 10MB 이하여야 합니다.' };
    }
    return { valid: true };
  }, []);

  // 단일 파일 업로드
  const uploadSingleFile = useCallback(
    async (uploadingPhoto: UploadingPhoto, order: number): Promise<void> => {
      const { id, file } = uploadingPhoto;

      try {
        // 상태: 분석 중
        setUploadingPhotos((prev) =>
          prev.map((p) => (p.id === id ? { ...p, status: 'analyzing' as const, progress: 10 } : p))
        );

        // 이미지 유효성 검사
        const imageValidation = await validateImage(file);
        setUploadingPhotos((prev) =>
          prev.map((p) =>
            p.id === id
              ? {
                  ...p,
                  imageValidation,
                  warnings: [...p.warnings, ...imageValidation.warnings],
                  progress: 20,
                }
              : p
          )
        );

        // 얼굴 감지
        const imageElement = await createImageElement(file);
        const faceDetection = await detectFaces(imageElement);
        setUploadingPhotos((prev) =>
          prev.map((p) =>
            p.id === id
              ? {
                  ...p,
                  faceDetection,
                  warnings: [...p.warnings, ...faceDetection.warnings],
                  progress: 40,
                }
              : p
          )
        );

        // 상태: 업로드 중
        setUploadingPhotos((prev) =>
          prev.map((p) => (p.id === id ? { ...p, status: 'uploading' as const, progress: 50 } : p))
        );

        // 서버에 업로드
        const formData = new FormData();
        formData.append('file', file);
        formData.append('projectId', projectId);
        formData.append('order', order.toString());

        const response = await fetch('/api/photos', {
          method: 'POST',
          body: formData,
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || '업로드에 실패했습니다.');
        }

        const result = await response.json();
        const uploadedPhotoId = result.data.id;

        // 상태: 완료
        setUploadingPhotos((prev) =>
          prev.map((p) =>
            p.id === id
              ? { ...p, status: 'completed' as const, progress: 100, uploadedPhotoId }
              : p
          )
        );

        onUploadComplete?.(uploadedPhotoId);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : '업로드에 실패했습니다.';
        setUploadingPhotos((prev) =>
          prev.map((p) =>
            p.id === id ? { ...p, status: 'error' as const, error: errorMessage } : p
          )
        );
        onError?.(errorMessage);
      }
    },
    [projectId, onUploadComplete, onError]
  );

  // 여러 파일 업로드
  const uploadFiles = useCallback(
    async (files: FileList | File[]) => {
      const fileArray = Array.from(files);
      const remainingSlots = maxPhotos - currentPhotoCount;

      if (fileArray.length > remainingSlots) {
        onError?.(`최대 ${maxPhotos}장까지 업로드할 수 있습니다. ${remainingSlots}장만 업로드됩니다.`);
        fileArray.splice(remainingSlots);
      }

      if (fileArray.length === 0) return;

      // 파일 유효성 검사 및 업로딩 상태 초기화
      const newUploadingPhotos: UploadingPhoto[] = [];

      for (const file of fileArray) {
        const validation = validateFile(file);

        const uploadingPhoto: UploadingPhoto = {
          id: `${Date.now()}_${Math.random().toString(36).substring(7)}`,
          file,
          preview: URL.createObjectURL(file),
          progress: 0,
          status: validation.valid ? 'pending' : 'error',
          error: validation.error,
          warnings: [],
        };

        newUploadingPhotos.push(uploadingPhoto);
      }

      setUploadingPhotos((prev) => [...prev, ...newUploadingPhotos]);
      setIsUploading(true);

      // 유효한 파일만 업로드
      const validPhotos = newUploadingPhotos.filter((p) => p.status === 'pending');

      for (let i = 0; i < validPhotos.length; i++) {
        const order = currentPhotoCount + i;
        await uploadSingleFile(validPhotos[i], order);
      }

      setIsUploading(false);
    },
    [maxPhotos, currentPhotoCount, validateFile, uploadSingleFile, onError]
  );

  // 업로드 재시도
  const retryUpload = useCallback(
    async (uploadingPhotoId: string) => {
      const photo = uploadingPhotos.find((p) => p.id === uploadingPhotoId);
      if (!photo || photo.status !== 'error') return;

      setUploadingPhotos((prev) =>
        prev.map((p) =>
          p.id === uploadingPhotoId
            ? { ...p, status: 'pending' as const, error: undefined, progress: 0, warnings: [] }
            : p
        )
      );

      setIsUploading(true);
      await uploadSingleFile(photo, currentPhotoCount);
      setIsUploading(false);
    },
    [uploadingPhotos, currentPhotoCount, uploadSingleFile]
  );

  // 업로드 중인 사진 제거
  const removeUploadingPhoto = useCallback((uploadingPhotoId: string) => {
    setUploadingPhotos((prev) => {
      const photo = prev.find((p) => p.id === uploadingPhotoId);
      if (photo) {
        URL.revokeObjectURL(photo.preview);
      }
      return prev.filter((p) => p.id !== uploadingPhotoId);
    });
  }, []);

  // 완료된 업로드 정리
  const clearCompleted = useCallback(() => {
    setUploadingPhotos((prev) => {
      prev.filter((p) => p.status === 'completed').forEach((p) => URL.revokeObjectURL(p.preview));
      return prev.filter((p) => p.status !== 'completed');
    });
  }, []);

  // 모든 업로드 정리
  const clearAll = useCallback(() => {
    setUploadingPhotos((prev) => {
      prev.forEach((p) => URL.revokeObjectURL(p.preview));
      return [];
    });
  }, []);

  return {
    uploadingPhotos,
    isUploading,
    uploadFiles,
    retryUpload,
    removeUploadingPhoto,
    clearCompleted,
    clearAll,
  };
}

export default usePhotoUpload;
