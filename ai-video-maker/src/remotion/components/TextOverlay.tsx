/**
 * TextOverlay Component
 * 텍스트 오버레이 (제목, 날짜, 메시지 등)
 */

import React from 'react';
import { AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig } from 'remotion';
import { notoSansKR } from '../utils/fonts';

type AnimationType = 'fade' | 'slide-up' | 'slide-down' | 'scale' | 'typewriter';

interface TextOverlayProps {
  text: string;
  fontSize?: number;
  fontFamily?: string;
  fontWeight?: number;
  color?: string;
  textAlign?: 'left' | 'center' | 'right';
  position?: 'top' | 'center' | 'bottom';
  animation?: AnimationType;
  animationDelay?: number; // in frames
  textShadow?: string;
  backgroundColor?: string;
  padding?: number;
}

export const TextOverlay: React.FC<TextOverlayProps> = ({
  text,
  fontSize = 48,
  fontFamily = notoSansKR,
  fontWeight = 700,
  color = '#FFFFFF',
  textAlign = 'center',
  position = 'center',
  animation = 'fade',
  animationDelay = 0,
  textShadow = '0 4px 20px rgba(0,0,0,0.5)',
  backgroundColor,
  padding = 20,
}) => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();

  const adjustedFrame = Math.max(0, frame - animationDelay);
  const animationDuration = 30; // 1 second at 30fps

  // 애니메이션 계산
  const getAnimationStyles = (): React.CSSProperties => {
    const progress = Math.min(adjustedFrame / animationDuration, 1);

    switch (animation) {
      case 'fade': {
        const opacity = interpolate(progress, [0, 1], [0, 1], {
          extrapolateRight: 'clamp',
        });
        return { opacity };
      }

      case 'slide-up': {
        const opacity = interpolate(progress, [0, 0.3, 1], [0, 1, 1], {
          extrapolateRight: 'clamp',
        });
        const translateY = interpolate(progress, [0, 1], [50, 0], {
          extrapolateRight: 'clamp',
        });
        return { opacity, transform: `translateY(${translateY}px)` };
      }

      case 'slide-down': {
        const opacity = interpolate(progress, [0, 0.3, 1], [0, 1, 1], {
          extrapolateRight: 'clamp',
        });
        const translateY = interpolate(progress, [0, 1], [-50, 0], {
          extrapolateRight: 'clamp',
        });
        return { opacity, transform: `translateY(${translateY}px)` };
      }

      case 'scale': {
        const opacity = interpolate(progress, [0, 0.3, 1], [0, 1, 1], {
          extrapolateRight: 'clamp',
        });
        const scale = interpolate(progress, [0, 1], [0.5, 1], {
          extrapolateRight: 'clamp',
        });
        return { opacity, transform: `scale(${scale})` };
      }

      case 'typewriter': {
        const visibleChars = Math.floor(progress * text.length);
        return { opacity: 1 };
      }

      default:
        return { opacity: 1 };
    }
  };

  // 위치 스타일
  const getPositionStyles = (): React.CSSProperties => {
    switch (position) {
      case 'top':
        return {
          justifyContent: 'flex-start',
          paddingTop: 120,
        };
      case 'bottom':
        return {
          justifyContent: 'flex-end',
          paddingBottom: 120,
        };
      default:
        return {
          justifyContent: 'center',
        };
    }
  };

  // 타이프라이터 효과를 위한 텍스트
  const displayText =
    animation === 'typewriter'
      ? text.slice(0, Math.floor((adjustedFrame / animationDuration) * text.length))
      : text;

  return (
    <AbsoluteFill
      style={{
        display: 'flex',
        alignItems: 'center',
        ...getPositionStyles(),
        padding: `0 ${padding}px`,
      }}
    >
      <div
        style={{
          fontFamily,
          fontSize,
          fontWeight,
          color,
          textAlign,
          textShadow,
          backgroundColor,
          padding: backgroundColor ? '20px 40px' : undefined,
          borderRadius: backgroundColor ? 12 : undefined,
          lineHeight: 1.4,
          maxWidth: '90%',
          ...getAnimationStyles(),
        }}
      >
        {displayText}
      </div>
    </AbsoluteFill>
  );
};

export default TextOverlay;
