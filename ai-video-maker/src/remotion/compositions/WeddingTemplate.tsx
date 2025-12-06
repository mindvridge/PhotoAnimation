/**
 * Wedding Template
 * 결혼식 영상 템플릿
 */

import React from 'react';
import {
  AbsoluteFill,
  Audio,
  Sequence,
  interpolate,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';
import { AnimatedPhoto } from '../components/AnimatedPhoto';
import { TextOverlay } from '../components/TextOverlay';
import { Transition } from '../components/Transition';
import { fontStyles } from '../utils/fonts';
import { calculateAudioFade } from '../utils/audio';
import {
  type TemplateProps,
  INTRO_DURATION_FRAMES,
  OUTRO_DURATION_FRAMES,
  TRANSITION_DURATION_FRAMES,
} from '../types';

export const WeddingTemplate: React.FC<TemplateProps> = ({
  title,
  subtitle,
  date,
  message,
  photos,
  musicUrl,
  musicVolume = 0.5,
  backgroundColor = '#FFF5F5',
  primaryColor = '#E53E3E',
  secondaryColor = '#FC8181',
}) => {
  const frame = useCurrentFrame();
  const { durationInFrames, fps } = useVideoConfig();

  const fonts = fontStyles.modern;

  // 오디오 볼륨 계산
  const audioVolume = calculateAudioFade(frame, durationInFrames, musicVolume);

  // 사진 시퀀스 시작 프레임 계산
  let photoStartFrame = INTRO_DURATION_FRAMES;
  const photoSequences = photos.map((photo, index) => {
    const startFrame = photoStartFrame;
    photoStartFrame += photo.duration;
    return { ...photo, startFrame, index };
  });

  // 아웃트로 시작 프레임
  const outroStartFrame = durationInFrames - OUTRO_DURATION_FRAMES;

  return (
    <AbsoluteFill style={{ backgroundColor }}>
      {/* 배경 음악 */}
      {musicUrl && (
        <Audio src={musicUrl} volume={audioVolume} />
      )}

      {/* 인트로 섹션 */}
      <Sequence from={0} durationInFrames={INTRO_DURATION_FRAMES}>
        <WeddingIntro
          title={title}
          subtitle={subtitle}
          date={date}
          primaryColor={primaryColor}
          secondaryColor={secondaryColor}
          fonts={fonts}
        />
      </Sequence>

      {/* 사진 시퀀스 */}
      {photoSequences.map((photo, index) => (
        <Sequence
          key={photo.id}
          from={photo.startFrame}
          durationInFrames={photo.duration}
        >
          <Transition
            type={index % 2 === 0 ? 'fade' : 'slide-left'}
            direction="in"
          >
            <AbsoluteFill style={{ padding: 40 }}>
              <AnimatedPhoto
                src={photo.animatedUrl}
                effect={index % 3 === 0 ? 'zoom-in' : index % 3 === 1 ? 'zoom-out' : 'pan-left'}
                frameStyle="rounded"
                borderColor="#FFFFFF"
                shadowColor="rgba(229, 62, 62, 0.2)"
              />
            </AbsoluteFill>
            {/* 사진 번호 표시 */}
            <TextOverlay
              text={`${index + 1} / ${photos.length}`}
              fontSize={24}
              fontFamily={fonts.body.fontFamily}
              fontWeight={400}
              color="rgba(255,255,255,0.8)"
              position="bottom"
              animation="fade"
            />
          </Transition>
        </Sequence>
      ))}

      {/* 아웃트로 섹션 */}
      <Sequence from={outroStartFrame} durationInFrames={OUTRO_DURATION_FRAMES}>
        <WeddingOutro
          message={message}
          primaryColor={primaryColor}
          secondaryColor={secondaryColor}
          fonts={fonts}
        />
      </Sequence>

      {/* 장식 요소 (항상 표시) */}
      <WeddingDecorations primaryColor={primaryColor} secondaryColor={secondaryColor} />
    </AbsoluteFill>
  );
};

// 인트로 컴포넌트
interface IntroProps {
  title: string;
  subtitle?: string;
  date?: string;
  primaryColor: string;
  secondaryColor: string;
  fonts: typeof fontStyles.modern;
}

const WeddingIntro: React.FC<IntroProps> = ({
  title,
  subtitle,
  date,
  primaryColor,
  secondaryColor,
  fonts,
}) => {
  const frame = useCurrentFrame();
  const opacity = interpolate(frame, [0, 30], [0, 1], { extrapolateRight: 'clamp' });

  return (
    <AbsoluteFill
      style={{
        background: `linear-gradient(180deg, ${secondaryColor}20, ${primaryColor}10)`,
        justifyContent: 'center',
        alignItems: 'center',
        opacity,
      }}
    >
      {/* 하트 아이콘 */}
      <div
        style={{
          fontSize: 80,
          marginBottom: 40,
          animation: 'pulse 1s ease-in-out infinite',
        }}
      >
        💕
      </div>

      {/* 제목 */}
      <TextOverlay
        text={title}
        fontSize={72}
        fontFamily={fonts.title.fontFamily}
        fontWeight={fonts.title.fontWeight}
        color={primaryColor}
        animation="scale"
        textShadow="0 4px 30px rgba(229, 62, 62, 0.3)"
      />

      {/* 부제목 */}
      {subtitle && (
        <TextOverlay
          text={subtitle}
          fontSize={36}
          fontFamily={fonts.subtitle.fontFamily}
          fontWeight={fonts.subtitle.fontWeight}
          color={secondaryColor}
          animation="fade"
          animationDelay={20}
        />
      )}

      {/* 날짜 */}
      {date && (
        <div
          style={{
            position: 'absolute',
            bottom: 200,
            fontFamily: fonts.body.fontFamily,
            fontSize: 28,
            color: primaryColor,
            opacity: interpolate(frame, [40, 70], [0, 1], { extrapolateRight: 'clamp' }),
          }}
        >
          {date}
        </div>
      )}
    </AbsoluteFill>
  );
};

// 아웃트로 컴포넌트
interface OutroProps {
  message?: string;
  primaryColor: string;
  secondaryColor: string;
  fonts: typeof fontStyles.modern;
}

const WeddingOutro: React.FC<OutroProps> = ({
  message,
  primaryColor,
  secondaryColor,
  fonts,
}) => {
  const frame = useCurrentFrame();
  const opacity = interpolate(frame, [0, 30], [0, 1], { extrapolateRight: 'clamp' });

  return (
    <AbsoluteFill
      style={{
        background: `linear-gradient(180deg, ${primaryColor}10, ${secondaryColor}20)`,
        justifyContent: 'center',
        alignItems: 'center',
        opacity,
      }}
    >
      {/* 메시지 */}
      <TextOverlay
        text={message || '감사합니다'}
        fontSize={48}
        fontFamily={fonts.title.fontFamily}
        fontWeight={fonts.title.fontWeight}
        color={primaryColor}
        animation="slide-up"
        textShadow="0 4px 30px rgba(229, 62, 62, 0.3)"
      />

      {/* 하트 */}
      <div
        style={{
          position: 'absolute',
          bottom: 300,
          fontSize: 60,
          opacity: interpolate(frame, [30, 60], [0, 1], { extrapolateRight: 'clamp' }),
        }}
      >
        ❤️
      </div>

      {/* The End */}
      <div
        style={{
          position: 'absolute',
          bottom: 150,
          fontFamily: fonts.body.fontFamily,
          fontSize: 24,
          color: secondaryColor,
          opacity: interpolate(frame, [50, 80], [0, 1], { extrapolateRight: 'clamp' }),
          letterSpacing: 8,
        }}
      >
        THE END
      </div>
    </AbsoluteFill>
  );
};

// 장식 요소
interface DecorationsProps {
  primaryColor: string;
  secondaryColor: string;
}

const WeddingDecorations: React.FC<DecorationsProps> = ({ primaryColor, secondaryColor }) => {
  const frame = useCurrentFrame();

  // 플로팅 하트 애니메이션
  const hearts = Array.from({ length: 6 }, (_, i) => ({
    id: i,
    x: 10 + i * 15,
    delay: i * 20,
    size: 20 + (i % 3) * 10,
  }));

  return (
    <>
      {hearts.map((heart) => {
        const y = interpolate(
          (frame + heart.delay) % 200,
          [0, 200],
          [110, -10],
          { extrapolateRight: 'clamp' }
        );
        const opacity = interpolate(
          (frame + heart.delay) % 200,
          [0, 50, 150, 200],
          [0, 0.6, 0.6, 0],
          { extrapolateRight: 'clamp' }
        );

        return (
          <div
            key={heart.id}
            style={{
              position: 'absolute',
              left: `${heart.x}%`,
              top: `${y}%`,
              fontSize: heart.size,
              opacity,
              pointerEvents: 'none',
            }}
          >
            💗
          </div>
        );
      })}
    </>
  );
};

export default WeddingTemplate;
