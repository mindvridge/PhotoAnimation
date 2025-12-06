/**
 * Font Loading Utilities for Remotion
 * Google Fonts를 사용하여 한글 폰트 로드
 */

import { loadFont as loadGoogleFont } from '@remotion/google-fonts/NotoSansKR';
import { loadFont as loadNanumMyeongjo } from '@remotion/google-fonts/NanumMyeongjo';
import { loadFont as loadNanumGothic } from '@remotion/google-fonts/NanumGothic';

// 폰트 로드 및 fontFamily 반환
export const { fontFamily: notoSansKR } = loadGoogleFont();
export const { fontFamily: nanumMyeongjo } = loadNanumMyeongjo();
export const { fontFamily: nanumGothic } = loadNanumGothic();

// 폰트 스타일 프리셋
export const fontStyles = {
  // 모던한 스타일 (결혼식, 생일)
  modern: {
    title: {
      fontFamily: notoSansKR,
      fontWeight: 700,
    },
    subtitle: {
      fontFamily: notoSansKR,
      fontWeight: 400,
    },
    body: {
      fontFamily: notoSansKR,
      fontWeight: 300,
    },
  },
  // 전통적인 스타일 (칠순잔치)
  traditional: {
    title: {
      fontFamily: nanumMyeongjo,
      fontWeight: 700,
    },
    subtitle: {
      fontFamily: nanumMyeongjo,
      fontWeight: 400,
    },
    body: {
      fontFamily: nanumGothic,
      fontWeight: 400,
    },
  },
  // 캐주얼한 스타일 (생일 파티)
  casual: {
    title: {
      fontFamily: nanumGothic,
      fontWeight: 700,
    },
    subtitle: {
      fontFamily: nanumGothic,
      fontWeight: 400,
    },
    body: {
      fontFamily: notoSansKR,
      fontWeight: 300,
    },
  },
} as const;

export type FontStylePreset = keyof typeof fontStyles;
