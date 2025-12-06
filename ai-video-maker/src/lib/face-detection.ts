'use client';

import * as faceapi from 'face-api.js';

let modelsLoaded = false;
let modelsLoading = false;

export interface FaceDetectionResult {
  hasFace: boolean;
  faceCount: number;
  faceSizeRatio: number; // 얼굴이 이미지의 몇 %를 차지하는지
  isFrontal: boolean; // 정면 여부
  faceBox: {
    x: number;
    y: number;
    width: number;
    height: number;
  } | null;
  warnings: string[];
  isValid: boolean;
}

export interface ImageValidationResult {
  isValid: boolean;
  width: number;
  height: number;
  warnings: string[];
}

// face-api.js 모델 로드
export async function loadFaceDetectionModels(): Promise<void> {
  if (modelsLoaded) return;
  if (modelsLoading) {
    // 이미 로딩 중이면 완료될 때까지 대기
    while (modelsLoading) {
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
    return;
  }

  modelsLoading = true;

  try {
    // CDN에서 모델 로드
    const MODEL_URL = 'https://cdn.jsdelivr.net/npm/@vladmandic/face-api/model';

    await Promise.all([
      faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
      faceapi.nets.faceLandmark68TinyNet.loadFromUri(MODEL_URL),
    ]);

    modelsLoaded = true;
  } catch (error) {
    console.error('Face detection models load error:', error);
    throw new Error('얼굴 감지 모델을 로드하는데 실패했습니다.');
  } finally {
    modelsLoading = false;
  }
}

// 이미지에서 얼굴 감지
export async function detectFaces(
  imageElement: HTMLImageElement
): Promise<FaceDetectionResult> {
  const warnings: string[] = [];

  try {
    await loadFaceDetectionModels();

    const detections = await faceapi
      .detectAllFaces(imageElement, new faceapi.TinyFaceDetectorOptions())
      .withFaceLandmarks(true);

    if (detections.length === 0) {
      return {
        hasFace: false,
        faceCount: 0,
        faceSizeRatio: 0,
        isFrontal: false,
        faceBox: null,
        warnings: ['얼굴이 감지되지 않았습니다. 사진에 사람 얼굴이 포함되어 있는지 확인해주세요.'],
        isValid: false,
      };
    }

    // 가장 큰 얼굴 찾기
    const largestFace = detections.reduce((prev, current) =>
      prev.detection.box.area > current.detection.box.area ? prev : current
    );

    const box = largestFace.detection.box;
    const imageArea = imageElement.width * imageElement.height;
    const faceArea = box.width * box.height;
    const faceSizeRatio = (faceArea / imageArea) * 100;

    // 얼굴 크기 확인 (20% 이상 권장)
    if (faceSizeRatio < 20) {
      warnings.push(
        `얼굴이 너무 작습니다 (${faceSizeRatio.toFixed(1)}%). 얼굴이 사진의 20% 이상을 차지하는 것을 권장합니다.`
      );
    }

    // 정면 여부 확인 (랜드마크 기반)
    const landmarks = largestFace.landmarks;
    const isFrontal = checkIfFrontal(landmarks, box);

    if (!isFrontal) {
      warnings.push('얼굴이 정면을 향하고 있지 않습니다. 정면 사진을 권장합니다.');
    }

    // 여러 얼굴 감지 시 경고
    if (detections.length > 1) {
      warnings.push(
        `${detections.length}개의 얼굴이 감지되었습니다. 가장 큰 얼굴을 기준으로 처리됩니다.`
      );
    }

    return {
      hasFace: true,
      faceCount: detections.length,
      faceSizeRatio,
      isFrontal,
      faceBox: {
        x: box.x,
        y: box.y,
        width: box.width,
        height: box.height,
      },
      warnings,
      isValid: true,
    };
  } catch (error) {
    console.error('Face detection error:', error);
    return {
      hasFace: false,
      faceCount: 0,
      faceSizeRatio: 0,
      isFrontal: false,
      faceBox: null,
      warnings: ['얼굴 감지 중 오류가 발생했습니다.'],
      isValid: false,
    };
  }
}

// 정면 여부 확인 (±30° 이내)
function checkIfFrontal(
  landmarks: faceapi.FaceLandmarks68,
  faceBox: faceapi.Box
): boolean {
  try {
    // 눈 위치로 회전 각도 추정
    const leftEye = landmarks.getLeftEye();
    const rightEye = landmarks.getRightEye();

    const leftEyeCenter = {
      x: leftEye.reduce((sum, p) => sum + p.x, 0) / leftEye.length,
      y: leftEye.reduce((sum, p) => sum + p.y, 0) / leftEye.length,
    };

    const rightEyeCenter = {
      x: rightEye.reduce((sum, p) => sum + p.x, 0) / rightEye.length,
      y: rightEye.reduce((sum, p) => sum + p.y, 0) / rightEye.length,
    };

    // 눈 사이의 수평 각도 계산
    const deltaY = rightEyeCenter.y - leftEyeCenter.y;
    const deltaX = rightEyeCenter.x - leftEyeCenter.x;
    const angle = Math.atan2(deltaY, deltaX) * (180 / Math.PI);

    // 코 위치로 좌우 회전 추정
    const nose = landmarks.getNose();
    const noseCenter = nose[3]; // 코 중앙
    const faceCenterX = faceBox.x + faceBox.width / 2;
    const noseOffset = (noseCenter.x - faceCenterX) / faceBox.width;

    // 수평 회전 ±30° 이내, 좌우 회전 ±0.15 이내
    return Math.abs(angle) <= 30 && Math.abs(noseOffset) <= 0.15;
  } catch {
    // 랜드마크 분석 실패 시 정면으로 가정
    return true;
  }
}

// 이미지 유효성 검사 (해상도 등)
export function validateImage(file: File): Promise<ImageValidationResult> {
  return new Promise((resolve) => {
    const warnings: string[] = [];
    const img = new Image();
    const url = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(url);

      const width = img.width;
      const height = img.height;
      let isValid = true;

      // 최소 해상도 확인 (512x512)
      if (width < 512 || height < 512) {
        warnings.push(
          `해상도가 낮습니다 (${width}x${height}). 최소 512x512 이상을 권장합니다.`
        );
        if (width < 256 || height < 256) {
          isValid = false;
        }
      }

      // 최대 해상도 확인 (성능을 위해)
      if (width > 4096 || height > 4096) {
        warnings.push(
          `해상도가 매우 높습니다 (${width}x${height}). 업로드 시 자동으로 리사이징됩니다.`
        );
      }

      // 극단적인 비율 확인
      const aspectRatio = width / height;
      if (aspectRatio > 3 || aspectRatio < 0.33) {
        warnings.push('이미지 비율이 극단적입니다. 정사각형에 가까운 사진을 권장합니다.');
      }

      resolve({ isValid, width, height, warnings });
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      resolve({
        isValid: false,
        width: 0,
        height: 0,
        warnings: ['이미지를 읽을 수 없습니다.'],
      });
    };

    img.src = url;
  });
}

// 파일에서 이미지 엘리먼트 생성
export function createImageElement(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('이미지를 로드할 수 없습니다.'));
    };

    img.src = url;
  });
}

// 지원되는 이미지 형식 확인
export function isValidImageFormat(file: File): boolean {
  const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
  return validTypes.includes(file.type);
}

// 파일 크기 확인 (10MB)
export function isValidFileSize(file: File, maxSizeMB: number = 10): boolean {
  const maxBytes = maxSizeMB * 1024 * 1024;
  return file.size <= maxBytes;
}
