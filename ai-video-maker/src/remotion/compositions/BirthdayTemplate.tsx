/**
 * Birthday Template
 * 생일 축하 영상 템플릿
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

// 파티 컬러 팔레트
const partyColors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD'];

export const BirthdayTemplate: React.FC<TemplateProps> = ({
  title,
  subtitle,
  date,
  message,
  photos,
  musicUrl,
  musicVolume = 0.5,
  backgroundColor = '#FFF5F0',
  primaryColor = '#DD6B20',
  secondaryColor = '#F6AD55',
}) => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();

  const fonts = fontStyles.casual;

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

      {/* 파티 배경 장식 */}
      <PartyBackground />

      {/* 인트로 섹션 */}
      <Sequence from={0} durationInFrames={INTRO_DURATION_FRAMES}>
        <BirthdayIntro
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
        const transitionTypes: Array<'zoom' | 'slide-up' | 'slide-left' | 'dissolve'> = [
          'zoom',
          'slide-up',
          'slide-left',
          'dissolve',
        ];
        const transition = transitionTypes[index % transitionTypes.length];

        return (
          <Sequence
            key={photo.id}
            from={photo.startFrame}
            durationInFrames={photo.duration}
          >
            <Transition type={transition} direction="in">
              <AbsoluteFill style={{ padding: 40 }}>
                <AnimatedPhoto
                  src={photo.animatedUrl}
                  effect={index % 2 === 0 ? 'zoom-in' : 'pan-right'}
                  frameStyle="polaroid"
                  borderColor="#FFFFFF"
                  shadowColor="rgba(221, 107, 32, 0.3)"
                />
              </AbsoluteFill>
              {/* 축하 텍스트 오버레이 */}
              <BirthdayOverlay index={index} primaryColor={primaryColor} />
            </Transition>
          </Sequence>
        );
      })}

      {/* 아웃트로 섹션 */}
      <Sequence from={outroStartFrame} durationInFrames={OUTRO_DURATION_FRAMES}>
        <BirthdayOutro
          message={message}
          primaryColor={primaryColor}
          secondaryColor={secondaryColor}
          fonts={fonts}
        />
      </Sequence>

      {/* 컨페티 효과 */}
      <Confetti />
    </AbsoluteFill>
  );
};

// 파티 배경
const PartyBackground: React.FC = () => {
  const frame = useCurrentFrame();

  // 배경 그라데이션 애니메이션
  const hue = interpolate(frame % 300, [0, 300], [0, 360]);

  return (
    <AbsoluteFill
      style={{
        background: `
          radial-gradient(circle at 20% 80%, hsla(${hue}, 70%, 85%, 0.3) 0%, transparent 50%),
          radial-gradient(circle at 80% 20%, hsla(${(hue + 120) % 360}, 70%, 85%, 0.3) 0%, transparent 50%),
          radial-gradient(circle at 50% 50%, hsla(${(hue + 240) % 360}, 70%, 95%, 0.2) 0%, transparent 70%)
        `,
      }}
    />
  );
};

// 인트로 컴포넌트
interface IntroProps {
  title: string;
  subtitle?: string;
  date?: string;
  primaryColor: string;
  secondaryColor: string;
  fonts: typeof fontStyles.casual;
}

const BirthdayIntro: React.FC<IntroProps> = ({
  title,
  subtitle,
  date,
  primaryColor,
  secondaryColor,
  fonts,
}) => {
  const frame = useCurrentFrame();

  // 케이크 바운스 애니메이션
  const bounce = Math.sin(frame * 0.2) * 10;
  const scale = interpolate(frame, [0, 20], [0, 1], { extrapolateRight: 'clamp' });

  return (
    <AbsoluteFill
      style={{
        justifyContent: 'center',
        alignItems: 'center',
      }}
    >
      {/* 케이크 이모지 */}
      <div
        style={{
          fontSize: 120,
          marginBottom: 40,
          transform: `translateY(${bounce}px) scale(${scale})`,
        }}
      >
        🎂
      </div>

      {/* 제목 */}
      <TextOverlay
        text={title}
        fontSize={64}
        fontFamily={fonts.title.fontFamily}
        fontWeight={fonts.title.fontWeight}
        color={primaryColor}
        animation="scale"
        animationDelay={10}
        textShadow="0 4px 30px rgba(221, 107, 32, 0.4)"
      />

      {/* 부제목 */}
      {subtitle && (
        <TextOverlay
          text={subtitle}
          fontSize={32}
          fontFamily={fonts.subtitle.fontFamily}
          fontWeight={fonts.subtitle.fontWeight}
          color={secondaryColor}
          animation="slide-up"
          animationDelay={25}
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
          🎈 {date} 🎈
        </div>
      )}

      {/* 파티 데코레이션 */}
      <div
        style={{
          position: 'absolute',
          top: 100,
          fontSize: 48,
          opacity: interpolate(frame, [20, 40], [0, 1], { extrapolateRight: 'clamp' }),
        }}
      >
        🎉 🎊 🎁 🎊 🎉
      </div>
    </AbsoluteFill>
  );
};

// 사진 위 축하 오버레이
interface OverlayProps {
  index: number;
  primaryColor: string;
}

const BirthdayOverlay: React.FC<OverlayProps> = ({ index, primaryColor }) => {
  const messages = ['🎈', '🎉', '🎊', '🎁', '✨', '🌟'];
  const message = messages[index % messages.length];

  return (
    <div
      style={{
        position: 'absolute',
        top: 80,
        right: 80,
        fontSize: 60,
        filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.3))',
      }}
    >
      {message}
    </div>
  );
};

// 아웃트로 컴포넌트
interface OutroProps {
  message?: string;
  primaryColor: string;
  secondaryColor: string;
  fonts: typeof fontStyles.casual;
}

const BirthdayOutro: React.FC<OutroProps> = ({
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
        opacity: interpolate(frame, [0, 30], [0, 1], { extrapolateRight: 'clamp' }),
      }}
    >
      {/* 메시지 */}
      <TextOverlay
        text={message || '행복한 하루 되세요!'}
        fontSize={44}
        fontFamily={fonts.title.fontFamily}
        fontWeight={fonts.title.fontWeight}
        color={primaryColor}
        animation="scale"
        textShadow="0 4px 30px rgba(221, 107, 32, 0.4)"
      />

      {/* 이모지 */}
      <div
        style={{
          position: 'absolute',
          bottom: 300,
          fontSize: 80,
          opacity: interpolate(frame, [30, 60], [0, 1], { extrapolateRight: 'clamp' }),
        }}
      >
        🥳
      </div>

      {/* Happy Birthday */}
      <div
        style={{
          position: 'absolute',
          bottom: 150,
          fontFamily: fonts.body.fontFamily,
          fontSize: 24,
          color: secondaryColor,
          opacity: interpolate(frame, [50, 80], [0, 1], { extrapolateRight: 'clamp' }),
          letterSpacing: 4,
        }}
      >
        ✨ HAPPY BIRTHDAY ✨
      </div>
    </AbsoluteFill>
  );
};

// 컨페티 효과
const Confetti: React.FC = () => {
  const frame = useCurrentFrame();

  const confettiPieces = Array.from({ length: 20 }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    delay: Math.random() * 100,
    color: partyColors[i % partyColors.length],
    size: 8 + Math.random() * 12,
    rotation: Math.random() * 360,
  }));

  return (
    <>
      {confettiPieces.map((piece) => {
        const y = interpolate(
          (frame + piece.delay) % 150,
          [0, 150],
          [-10, 110],
          { extrapolateRight: 'clamp' }
        );
        const rotation = piece.rotation + frame * 3;
        const opacity = interpolate(
          (frame + piece.delay) % 150,
          [0, 30, 120, 150],
          [0, 1, 1, 0],
          { extrapolateRight: 'clamp' }
        );

        return (
          <div
            key={piece.id}
            style={{
              position: 'absolute',
              left: `${piece.x}%`,
              top: `${y}%`,
              width: piece.size,
              height: piece.size,
              backgroundColor: piece.color,
              borderRadius: piece.id % 2 === 0 ? '50%' : '2px',
              transform: `rotate(${rotation}deg)`,
              opacity,
              pointerEvents: 'none',
            }}
          />
        );
      })}
    </>
  );
};

export default BirthdayTemplate;
