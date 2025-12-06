/**
 * Remotion Root Component
 * 모든 템플릿 Composition 등록
 */

import React from 'react';
import { Composition } from 'remotion';
import { WeddingTemplate } from './compositions/WeddingTemplate';
import { BirthdayTemplate } from './compositions/BirthdayTemplate';
import { SeventyTemplate } from './compositions/SeventyTemplate';
import {
  COMPOSITION_IDS,
  DEFAULT_FPS,
  DEFAULT_WIDTH,
  DEFAULT_HEIGHT,
  INTRO_DURATION_FRAMES,
  OUTRO_DURATION_FRAMES,
  PHOTO_DURATION_FRAMES,
  type TemplateProps,
} from './types';

// 샘플 데이터 (개발/미리보기용)
const sampleProps: TemplateProps = {
  title: '우리의 아름다운 순간',
  subtitle: '영원히 함께',
  date: '2024년 12월 25일',
  message: '사랑과 감사의 마음을 담아',
  photos: [
    {
      id: '1',
      animatedUrl: 'https://via.placeholder.com/1080x1920/FF6B6B/FFFFFF?text=Photo+1',
      duration: PHOTO_DURATION_FRAMES,
    },
    {
      id: '2',
      animatedUrl: 'https://via.placeholder.com/1080x1920/4ECDC4/FFFFFF?text=Photo+2',
      duration: PHOTO_DURATION_FRAMES,
    },
    {
      id: '3',
      animatedUrl: 'https://via.placeholder.com/1080x1920/45B7D1/FFFFFF?text=Photo+3',
      duration: PHOTO_DURATION_FRAMES,
    },
  ],
  musicVolume: 0.5,
  backgroundColor: '#FFF5F5',
  primaryColor: '#E53E3E',
  secondaryColor: '#FC8181',
};

// 총 영상 길이 계산 함수
function calculateDuration(photos: TemplateProps['photos']): number {
  const photoDuration = photos.reduce((total, photo) => total + photo.duration, 0);
  return INTRO_DURATION_FRAMES + photoDuration + OUTRO_DURATION_FRAMES;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyComponent = React.ComponentType<any>;

export const RemotionRoot: React.FC = () => {
  return (
    <>
      {/* 결혼식 템플릿 */}
      <Composition
        id={COMPOSITION_IDS.WEDDING}
        component={WeddingTemplate as AnyComponent}
        durationInFrames={calculateDuration(sampleProps.photos)}
        fps={DEFAULT_FPS}
        width={DEFAULT_WIDTH}
        height={DEFAULT_HEIGHT}
        defaultProps={sampleProps}
      />

      {/* 생일 템플릿 */}
      <Composition
        id={COMPOSITION_IDS.BIRTHDAY}
        component={BirthdayTemplate as AnyComponent}
        durationInFrames={calculateDuration(sampleProps.photos)}
        fps={DEFAULT_FPS}
        width={DEFAULT_WIDTH}
        height={DEFAULT_HEIGHT}
        defaultProps={{
          ...sampleProps,
          title: '생일 축하합니다!',
          subtitle: '특별한 하루',
          message: '행복한 생일이 되세요',
          backgroundColor: '#FFF5F0',
          primaryColor: '#DD6B20',
          secondaryColor: '#F6AD55',
        }}
      />

      {/* 칠순잔치 템플릿 */}
      <Composition
        id={COMPOSITION_IDS.SEVENTY}
        component={SeventyTemplate as AnyComponent}
        durationInFrames={calculateDuration(sampleProps.photos)}
        fps={DEFAULT_FPS}
        width={DEFAULT_WIDTH}
        height={DEFAULT_HEIGHT}
        defaultProps={{
          ...sampleProps,
          title: '칠순을 축하드립니다',
          subtitle: '건강과 장수를 기원합니다',
          message: '늘 건강하시고 행복하세요',
          backgroundColor: '#FFFBEB',
          primaryColor: '#B45309',
          secondaryColor: '#D97706',
        }}
      />
    </>
  );
};
