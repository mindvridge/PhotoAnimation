/**
 * Transition Component
 * 장면 전환 효과
 */

import React from 'react';
import { AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig } from 'remotion';
import type { TransitionType } from '../types';

interface TransitionProps {
  type: TransitionType['type'];
  direction?: 'in' | 'out';
  children: React.ReactNode;
  backgroundColor?: string;
}

export const Transition: React.FC<TransitionProps> = ({
  type,
  direction = 'in',
  children,
  backgroundColor = '#000000',
}) => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();

  const progress = direction === 'in'
    ? frame / durationInFrames
    : 1 - frame / durationInFrames;

  const getTransitionStyles = (): {
    containerStyle: React.CSSProperties;
    contentStyle: React.CSSProperties;
    overlayStyle?: React.CSSProperties;
  } => {
    switch (type) {
      case 'fade': {
        const opacity = interpolate(progress, [0, 1], [0, 1], {
          extrapolateRight: 'clamp',
        });
        return {
          containerStyle: {},
          contentStyle: { opacity },
        };
      }

      case 'slide-left': {
        const translateX = interpolate(progress, [0, 1], [100, 0], {
          extrapolateRight: 'clamp',
        });
        const opacity = interpolate(progress, [0, 0.3, 1], [0, 1, 1], {
          extrapolateRight: 'clamp',
        });
        return {
          containerStyle: { overflow: 'hidden' },
          contentStyle: {
            transform: `translateX(${translateX}%)`,
            opacity,
          },
        };
      }

      case 'slide-right': {
        const translateX = interpolate(progress, [0, 1], [-100, 0], {
          extrapolateRight: 'clamp',
        });
        const opacity = interpolate(progress, [0, 0.3, 1], [0, 1, 1], {
          extrapolateRight: 'clamp',
        });
        return {
          containerStyle: { overflow: 'hidden' },
          contentStyle: {
            transform: `translateX(${translateX}%)`,
            opacity,
          },
        };
      }

      case 'slide-up': {
        const translateY = interpolate(progress, [0, 1], [100, 0], {
          extrapolateRight: 'clamp',
        });
        const opacity = interpolate(progress, [0, 0.3, 1], [0, 1, 1], {
          extrapolateRight: 'clamp',
        });
        return {
          containerStyle: { overflow: 'hidden' },
          contentStyle: {
            transform: `translateY(${translateY}%)`,
            opacity,
          },
        };
      }

      case 'slide-down': {
        const translateY = interpolate(progress, [0, 1], [-100, 0], {
          extrapolateRight: 'clamp',
        });
        const opacity = interpolate(progress, [0, 0.3, 1], [0, 1, 1], {
          extrapolateRight: 'clamp',
        });
        return {
          containerStyle: { overflow: 'hidden' },
          contentStyle: {
            transform: `translateY(${translateY}%)`,
            opacity,
          },
        };
      }

      case 'zoom': {
        const scale = interpolate(progress, [0, 1], [0.5, 1], {
          extrapolateRight: 'clamp',
        });
        const opacity = interpolate(progress, [0, 0.3, 1], [0, 1, 1], {
          extrapolateRight: 'clamp',
        });
        return {
          containerStyle: {},
          contentStyle: {
            transform: `scale(${scale})`,
            opacity,
          },
        };
      }

      case 'dissolve': {
        const opacity = interpolate(progress, [0, 1], [0, 1], {
          extrapolateRight: 'clamp',
        });
        const blur = interpolate(progress, [0, 0.5, 1], [20, 5, 0], {
          extrapolateRight: 'clamp',
        });
        return {
          containerStyle: {},
          contentStyle: {
            opacity,
            filter: `blur(${blur}px)`,
          },
        };
      }

      default:
        return {
          containerStyle: {},
          contentStyle: {},
        };
    }
  };

  const { containerStyle, contentStyle, overlayStyle } = getTransitionStyles();

  return (
    <AbsoluteFill style={containerStyle}>
      <AbsoluteFill style={contentStyle}>{children}</AbsoluteFill>
      {overlayStyle && (
        <AbsoluteFill style={{ ...overlayStyle, backgroundColor }} />
      )}
    </AbsoluteFill>
  );
};

// 전환 효과 시퀀스 헬퍼
interface TransitionSequenceProps {
  scenes: Array<{
    content: React.ReactNode;
    duration: number;
    transitionIn?: TransitionType['type'];
    transitionOut?: TransitionType['type'];
  }>;
}

export const TransitionSequence: React.FC<TransitionSequenceProps> = ({ scenes }) => {
  const frame = useCurrentFrame();

  let currentFrame = 0;
  for (const scene of scenes) {
    if (frame >= currentFrame && frame < currentFrame + scene.duration) {
      const sceneFrame = frame - currentFrame;
      const transitionDuration = 30; // 1 second

      // 시작 전환
      if (sceneFrame < transitionDuration && scene.transitionIn) {
        return (
          <Transition type={scene.transitionIn} direction="in">
            {scene.content}
          </Transition>
        );
      }

      // 종료 전환
      if (sceneFrame > scene.duration - transitionDuration && scene.transitionOut) {
        return (
          <Transition type={scene.transitionOut} direction="out">
            {scene.content}
          </Transition>
        );
      }

      return <AbsoluteFill>{scene.content}</AbsoluteFill>;
    }
    currentFrame += scene.duration;
  }

  return null;
};

export default Transition;
