/**
 * Audio Utilities for Remotion
 * 배경음악 및 오디오 처리
 */

import { interpolate } from 'remotion';

// 오디오 페이드 인/아웃 계산
export function calculateAudioFade(
  frame: number,
  totalFrames: number,
  volume: number = 1,
  fadeInFrames: number = 30,
  fadeOutFrames: number = 60
): number {
  // 페이드 인
  if (frame < fadeInFrames) {
    return interpolate(frame, [0, fadeInFrames], [0, volume], {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
    });
  }

  // 페이드 아웃
  const fadeOutStart = totalFrames - fadeOutFrames;
  if (frame > fadeOutStart) {
    return interpolate(frame, [fadeOutStart, totalFrames], [volume, 0], {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
    });
  }

  return volume;
}

// 기본 배경음악 URL (예시)
export const defaultMusicTracks = {
  wedding: '/audio/wedding-bgm.mp3',
  birthday: '/audio/birthday-bgm.mp3',
  traditional: '/audio/traditional-bgm.mp3',
} as const;

export type MusicTrackType = keyof typeof defaultMusicTracks;
