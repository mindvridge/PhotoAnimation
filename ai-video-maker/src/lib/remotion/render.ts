/**
 * Remotion Server-Side Rendering Utilities
 * 서버에서 영상 렌더링을 위한 유틸리티
 */

import type { TemplateProps } from '@/remotion/types';
import {
  COMPOSITION_IDS,
  DEFAULT_FPS,
  DEFAULT_WIDTH,
  DEFAULT_HEIGHT,
  INTRO_DURATION_FRAMES,
  OUTRO_DURATION_FRAMES,
} from '@/remotion/types';

export interface RenderOptions {
  compositionId: keyof typeof COMPOSITION_IDS;
  outputPath: string;
  props: TemplateProps;
  quality?: 'low' | 'medium' | 'high';
  format?: 'mp4' | 'webm';
}

export interface RenderResult {
  success: boolean;
  outputPath?: string;
  duration?: number;
  error?: string;
}

// 품질별 설정
const qualityPresets = {
  low: {
    crf: 28,
    scale: 0.5,
  },
  medium: {
    crf: 23,
    scale: 0.75,
  },
  high: {
    crf: 18,
    scale: 1,
  },
};

// 총 프레임 수 계산
export function calculateTotalFrames(photos: TemplateProps['photos']): number {
  const photoDuration = photos.reduce((total, photo) => total + photo.duration, 0);
  return INTRO_DURATION_FRAMES + photoDuration + OUTRO_DURATION_FRAMES;
}

// 영상 길이 계산 (초)
export function calculateDuration(photos: TemplateProps['photos']): number {
  const totalFrames = calculateTotalFrames(photos);
  return totalFrames / DEFAULT_FPS;
}

// 렌더링 설정 생성
export function createRenderConfig(options: RenderOptions) {
  const qualityPreset = qualityPresets[options.quality || 'medium'];
  const totalFrames = calculateTotalFrames(options.props.photos);

  return {
    composition: COMPOSITION_IDS[options.compositionId],
    serveUrl: process.env.REMOTION_SERVE_URL || 'http://localhost:3000',
    outputLocation: options.outputPath,
    inputProps: options.props,
    codec: options.format === 'webm' ? 'vp8' : 'h264',
    crf: qualityPreset.crf,
    imageFormat: 'jpeg' as const,
    chromiumOptions: {
      disableWebSecurity: true,
    },
    fps: DEFAULT_FPS,
    width: Math.round(DEFAULT_WIDTH * qualityPreset.scale),
    height: Math.round(DEFAULT_HEIGHT * qualityPreset.scale),
    durationInFrames: totalFrames,
  };
}

// 예상 파일 크기 계산 (MB)
export function estimateFileSize(
  photos: TemplateProps['photos'],
  quality: 'low' | 'medium' | 'high' = 'medium'
): number {
  const duration = calculateDuration(photos);
  // 대략적인 비트레이트 추정 (Mbps)
  const bitrateEstimates = {
    low: 2,
    medium: 5,
    high: 10,
  };
  const bitrate = bitrateEstimates[quality];
  return Math.round((duration * bitrate) / 8 * 10) / 10; // MB
}

// 예상 렌더링 시간 계산 (분)
export function estimateRenderTime(
  photos: TemplateProps['photos'],
  quality: 'low' | 'medium' | 'high' = 'medium'
): number {
  const duration = calculateDuration(photos);
  // 렌더링 시간 배수 (품질에 따라)
  const multipliers = {
    low: 2,
    medium: 4,
    high: 8,
  };
  return Math.round(duration * multipliers[quality] / 60 * 10) / 10; // 분
}

// 템플릿 ID를 Composition ID로 변환
export function getCompositionId(templateSlug: string): keyof typeof COMPOSITION_IDS {
  const mapping: Record<string, keyof typeof COMPOSITION_IDS> = {
    'wedding': 'WEDDING',
    'wedding-invitation': 'WEDDING',
    'birthday': 'BIRTHDAY',
    'birthday-celebration': 'BIRTHDAY',
    'seventy': 'SEVENTY',
    'seventy-celebration': 'SEVENTY',
    '70th-birthday': 'SEVENTY',
  };
  return mapping[templateSlug] || 'WEDDING';
}

// 기본 템플릿 Props 생성
export function createDefaultProps(
  templateSlug: string,
  photos: TemplateProps['photos']
): TemplateProps {
  const compositionType = getCompositionId(templateSlug);

  const baseProps: TemplateProps = {
    title: '',
    photos,
    musicVolume: 0.5,
  };

  switch (compositionType) {
    case 'WEDDING':
      return {
        ...baseProps,
        title: '우리의 아름다운 순간',
        subtitle: '영원히 함께',
        backgroundColor: '#FFF5F5',
        primaryColor: '#E53E3E',
        secondaryColor: '#FC8181',
      };
    case 'BIRTHDAY':
      return {
        ...baseProps,
        title: '생일 축하합니다!',
        subtitle: '특별한 하루',
        backgroundColor: '#FFF5F0',
        primaryColor: '#DD6B20',
        secondaryColor: '#F6AD55',
      };
    case 'SEVENTY':
      return {
        ...baseProps,
        title: '칠순을 축하드립니다',
        subtitle: '건강과 장수를 기원합니다',
        backgroundColor: '#FFFBEB',
        primaryColor: '#B45309',
        secondaryColor: '#D97706',
      };
    default:
      return baseProps;
  }
}
