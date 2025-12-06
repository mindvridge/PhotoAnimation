/**
 * Seventy Template (칠순잔치)
 * 전통적인 칠순잔치 영상 템플릿
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
} from '../types';

export const SeventyTemplate: React.FC<TemplateProps> = ({
  title,
  subtitle,
  date,
  message,
  photos,
  musicUrl,
  musicVolume = 0.5,
  backgroundColor = '#FFFBEB',
  primaryColor = '#B45309',
  secondaryColor = '#D97706',
}) => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();

  const fonts = fontStyles.traditional;

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
      {musicUrl && <Audio src={musicUrl} volume={audioVolume} />}

      {/* 한지 텍스처 배경 */}
      <HanjiBackground />

      {/* 전통 무늬 테두리 */}
      <TraditionalBorder primaryColor={primaryColor} />

      {/* 인트로 섹션 */}
      <Sequence from={0} durationInFrames={INTRO_DURATION_FRAMES}>
        <SeventyIntro
          title={title}
          subtitle={subtitle}
          date={date}
          primaryColor={primaryColor}
          secondaryColor={secondaryColor}
          fonts={fonts}
        />
      </Sequence>

      {/* 사진 시퀀스 */}
      {photoSequences.map((photo, index) => {
        const transitionTypes: Array<'fade' | 'dissolve' | 'slide-right'> = [
          'fade',
          'dissolve',
          'slide-right',
        ];
        const transition = transitionTypes[index % transitionTypes.length];

        return (
          <Sequence
            key={photo.id}
            from={photo.startFrame}
            durationInFrames={photo.duration}
          >
            <Transition type={transition} direction="in">
              <AbsoluteFill style={{ padding: 60 }}>
                <AnimatedPhoto
                  src={photo.animatedUrl}
                  effect={index % 2 === 0 ? 'zoom-in' : 'zoom-out'}
                  frameStyle="rounded"
                  borderColor="#D4A574"
                  shadowColor="rgba(180, 83, 9, 0.2)"
                />
              </AbsoluteFill>
              {/* 전통 장식 오버레이 */}
              <TraditionalOverlay index={index} primaryColor={primaryColor} />
            </Transition>
          </Sequence>
        );
      })}

      {/* 아웃트로 섹션 */}
      <Sequence from={outroStartFrame} durationInFrames={OUTRO_DURATION_FRAMES}>
        <SeventyOutro
          message={message}
          primaryColor={primaryColor}
          secondaryColor={secondaryColor}
          fonts={fonts}
        />
      </Sequence>

      {/* 꽃 장식 */}
      <FloatingFlowers />
    </AbsoluteFill>
  );
};

// 한지 텍스처 배경
const HanjiBackground: React.FC = () => {
  return (
    <AbsoluteFill
      style={{
        background: `
          repeating-linear-gradient(
            90deg,
            rgba(212, 165, 116, 0.03) 0px,
            rgba(212, 165, 116, 0.03) 1px,
            transparent 1px,
            transparent 20px
          ),
          repeating-linear-gradient(
            0deg,
            rgba(212, 165, 116, 0.03) 0px,
            rgba(212, 165, 116, 0.03) 1px,
            transparent 1px,
            transparent 20px
          ),
          linear-gradient(
            180deg,
            rgba(255, 251, 235, 1) 0%,
            rgba(254, 243, 199, 0.5) 50%,
            rgba(255, 251, 235, 1) 100%
          )
        `,
      }}
    />
  );
};

// 전통 무늬 테두리
interface BorderProps {
  primaryColor: string;
}

const TraditionalBorder: React.FC<BorderProps> = ({ primaryColor }) => {
  return (
    <>
      {/* 상단 테두리 */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: 40,
          background: `linear-gradient(90deg,
            ${primaryColor}20,
            ${primaryColor}40 20%,
            ${primaryColor}40 80%,
            ${primaryColor}20
          )`,
          borderBottom: `2px solid ${primaryColor}40`,
        }}
      />
      {/* 하단 테두리 */}
      <div
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          height: 40,
          background: `linear-gradient(90deg,
            ${primaryColor}20,
            ${primaryColor}40 20%,
            ${primaryColor}40 80%,
            ${primaryColor}20
          )`,
          borderTop: `2px solid ${primaryColor}40`,
        }}
      />
      {/* 좌측 테두리 */}
      <div
        style={{
          position: 'absolute',
          top: 40,
          bottom: 40,
          left: 0,
          width: 40,
          background: `linear-gradient(180deg,
            ${primaryColor}20,
            ${primaryColor}40 20%,
            ${primaryColor}40 80%,
            ${primaryColor}20
          )`,
          borderRight: `2px solid ${primaryColor}40`,
        }}
      />
      {/* 우측 테두리 */}
      <div
        style={{
          position: 'absolute',
          top: 40,
          bottom: 40,
          right: 0,
          width: 40,
          background: `linear-gradient(180deg,
            ${primaryColor}20,
            ${primaryColor}40 20%,
            ${primaryColor}40 80%,
            ${primaryColor}20
          )`,
          borderLeft: `2px solid ${primaryColor}40`,
        }}
      />
    </>
  );
};

// 인트로 컴포넌트
interface IntroProps {
  title: string;
  subtitle?: string;
  date?: string;
  primaryColor: string;
  secondaryColor: string;
  fonts: typeof fontStyles.traditional;
}

const SeventyIntro: React.FC<IntroProps> = ({
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
        justifyContent: 'center',
        alignItems: 'center',
        opacity,
        padding: 60,
      }}
    >
      {/* 장수 기원 문양 */}
      <div
        style={{
          fontSize: 80,
          marginBottom: 30,
          opacity: interpolate(frame, [10, 40], [0, 1], { extrapolateRight: 'clamp' }),
        }}
      >
        🎎
      </div>

      {/* 칠순(七旬) 한자 */}
      <div
        style={{
          fontFamily: fonts.title.fontFamily,
          fontSize: 48,
          color: primaryColor,
          marginBottom: 20,
          opacity: interpolate(frame, [20, 50], [0, 1], { extrapolateRight: 'clamp' }),
          letterSpacing: 20,
        }}
      >
        七 旬
      </div>

      {/* 제목 */}
      <TextOverlay
        text={title}
        fontSize={56}
        fontFamily={fonts.title.fontFamily}
        fontWeight={fonts.title.fontWeight}
        color={primaryColor}
        animation="fade"
        animationDelay={30}
        textShadow="0 4px 20px rgba(180, 83, 9, 0.3)"
      />

      {/* 부제목 */}
      {subtitle && (
        <TextOverlay
          text={subtitle}
          fontSize={28}
          fontFamily={fonts.subtitle.fontFamily}
          fontWeight={fonts.subtitle.fontWeight}
          color={secondaryColor}
          animation="fade"
          animationDelay={45}
        />
      )}

      {/* 날짜 */}
      {date && (
        <div
          style={{
            position: 'absolute',
            bottom: 200,
            fontFamily: fonts.body.fontFamily,
            fontSize: 24,
            color: primaryColor,
            opacity: interpolate(frame, [50, 80], [0, 1], { extrapolateRight: 'clamp' }),
          }}
        >
          {date}
        </div>
      )}

      {/* 전통 무늬 장식 */}
      <div
        style={{
          position: 'absolute',
          top: 150,
          fontSize: 32,
          opacity: interpolate(frame, [60, 90], [0, 0.6], { extrapolateRight: 'clamp' }),
          letterSpacing: 30,
          color: primaryColor,
        }}
      >
        ✿ ❀ ✿
      </div>
    </AbsoluteFill>
  );
};

// 사진 위 전통 장식 오버레이
interface OverlayProps {
  index: number;
  primaryColor: string;
}

const TraditionalOverlay: React.FC<OverlayProps> = ({ index, primaryColor }) => {
  const decorations = ['🏵️', '🎎', '🍃', '🌸', '✿'];
  const decoration = decorations[index % decorations.length];

  return (
    <>
      <div
        style={{
          position: 'absolute',
          top: 100,
          left: 100,
          fontSize: 40,
          opacity: 0.8,
        }}
      >
        {decoration}
      </div>
      <div
        style={{
          position: 'absolute',
          bottom: 100,
          right: 100,
          fontSize: 40,
          opacity: 0.8,
        }}
      >
        {decoration}
      </div>
    </>
  );
};

// 아웃트로 컴포넌트
interface OutroProps {
  message?: string;
  primaryColor: string;
  secondaryColor: string;
  fonts: typeof fontStyles.traditional;
}

const SeventyOutro: React.FC<OutroProps> = ({
  message,
  primaryColor,
  secondaryColor,
  fonts,
}) => {
  const frame = useCurrentFrame();

  return (
    <AbsoluteFill
      style={{
        justifyContent: 'center',
        alignItems: 'center',
        padding: 60,
        opacity: interpolate(frame, [0, 30], [0, 1], { extrapolateRight: 'clamp' }),
      }}
    >
      {/* 축하 메시지 */}
      <TextOverlay
        text={message || '늘 건강하시고 행복하세요'}
        fontSize={40}
        fontFamily={fonts.title.fontFamily}
        fontWeight={fonts.title.fontWeight}
        color={primaryColor}
        animation="fade"
        textShadow="0 4px 20px rgba(180, 83, 9, 0.3)"
      />

      {/* 만수무강 */}
      <div
        style={{
          position: 'absolute',
          bottom: 350,
          fontFamily: fonts.title.fontFamily,
          fontSize: 36,
          color: secondaryColor,
          opacity: interpolate(frame, [30, 60], [0, 1], { extrapolateRight: 'clamp' }),
          letterSpacing: 10,
        }}
      >
        萬壽無疆
      </div>

      {/* 장수 이모지 */}
      <div
        style={{
          position: 'absolute',
          bottom: 250,
          fontSize: 60,
          opacity: interpolate(frame, [40, 70], [0, 1], { extrapolateRight: 'clamp' }),
        }}
      >
        🎊
      </div>

      {/* 감사 인사 */}
      <div
        style={{
          position: 'absolute',
          bottom: 150,
          fontFamily: fonts.body.fontFamily,
          fontSize: 22,
          color: primaryColor,
          opacity: interpolate(frame, [50, 80], [0, 1], { extrapolateRight: 'clamp' }),
        }}
      >
        감사합니다
      </div>
    </AbsoluteFill>
  );
};

// 떨어지는 꽃잎 효과
const FloatingFlowers: React.FC = () => {
  const frame = useCurrentFrame();

  const flowers = Array.from({ length: 10 }, (_, i) => ({
    id: i,
    x: 5 + i * 10,
    delay: i * 30,
    emoji: i % 2 === 0 ? '🌸' : '🍃',
    size: 20 + (i % 3) * 8,
  }));

  return (
    <>
      {flowers.map((flower) => {
        const y = interpolate(
          (frame + flower.delay) % 250,
          [0, 250],
          [-10, 110],
          { extrapolateRight: 'clamp' }
        );
        const x = flower.x + Math.sin((frame + flower.delay) * 0.05) * 3;
        const opacity = interpolate(
          (frame + flower.delay) % 250,
          [0, 50, 200, 250],
          [0, 0.7, 0.7, 0],
          { extrapolateRight: 'clamp' }
        );
        const rotation = (frame + flower.delay) * 2;

        return (
          <div
            key={flower.id}
            style={{
              position: 'absolute',
              left: `${x}%`,
              top: `${y}%`,
              fontSize: flower.size,
              transform: `rotate(${rotation}deg)`,
              opacity,
              pointerEvents: 'none',
            }}
          >
            {flower.emoji}
          </div>
        );
      })}
    </>
  );
};

export default SeventyTemplate;
