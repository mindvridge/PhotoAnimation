/**
 * AnimatedPhoto Component
 * AI 생성 영상/이미지 삽입 컴포넌트
 */

import React from 'react';
import {
  AbsoluteFill,
  Img,
  Video,
  interpolate,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';

interface AnimatedPhotoProps {
  src: string;
  isVideo?: boolean;
  effect?: 'none' | 'zoom-in' | 'zoom-out' | 'pan-left' | 'pan-right';
  frameStyle?: 'none' | 'rounded' | 'circle' | 'polaroid';
  borderColor?: string;
  shadowColor?: string;
}

export const AnimatedPhoto: React.FC<AnimatedPhotoProps> = ({
  src,
  isVideo = true,
  effect = 'zoom-in',
  frameStyle = 'none',
  borderColor = '#FFFFFF',
  shadowColor = 'rgba(0,0,0,0.3)',
}) => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();

  // 효과에 따른 transform 계산
  const getTransform = () => {
    const progress = frame / durationInFrames;

    switch (effect) {
      case 'zoom-in':
        const scaleIn = interpolate(progress, [0, 1], [1, 1.15], {
          extrapolateRight: 'clamp',
        });
        return `scale(${scaleIn})`;

      case 'zoom-out':
        const scaleOut = interpolate(progress, [0, 1], [1.15, 1], {
          extrapolateRight: 'clamp',
        });
        return `scale(${scaleOut})`;

      case 'pan-left':
        const translateLeft = interpolate(progress, [0, 1], [5, -5], {
          extrapolateRight: 'clamp',
        });
        return `translateX(${translateLeft}%) scale(1.1)`;

      case 'pan-right':
        const translateRight = interpolate(progress, [0, 1], [-5, 5], {
          extrapolateRight: 'clamp',
        });
        return `translateX(${translateRight}%) scale(1.1)`;

      default:
        return 'none';
    }
  };

  // 프레임 스타일에 따른 CSS
  const getFrameStyles = (): React.CSSProperties => {
    const baseStyles: React.CSSProperties = {
      overflow: 'hidden',
    };

    switch (frameStyle) {
      case 'rounded':
        return {
          ...baseStyles,
          borderRadius: 24,
          border: `8px solid ${borderColor}`,
          boxShadow: `0 20px 40px ${shadowColor}`,
          margin: 40,
        };

      case 'circle':
        return {
          ...baseStyles,
          borderRadius: '50%',
          border: `12px solid ${borderColor}`,
          boxShadow: `0 20px 40px ${shadowColor}`,
          aspectRatio: '1',
          margin: 'auto',
          width: '80%',
        };

      case 'polaroid':
        return {
          ...baseStyles,
          borderRadius: 8,
          backgroundColor: borderColor,
          padding: '20px 20px 60px 20px',
          boxShadow: `0 20px 40px ${shadowColor}`,
          margin: 40,
        };

      default:
        return baseStyles;
    }
  };

  const mediaStyle: React.CSSProperties = {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
    transform: getTransform(),
    transition: 'transform 0.1s ease-out',
  };

  return (
    <AbsoluteFill style={getFrameStyles()}>
      {isVideo ? (
        <Video src={src} style={mediaStyle} />
      ) : (
        <Img src={src} style={mediaStyle} />
      )}
    </AbsoluteFill>
  );
};

export default AnimatedPhoto;
