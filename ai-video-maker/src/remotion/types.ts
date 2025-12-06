/**
 * Remotion Template Types
 */

export interface PhotoItem {
  id: string;
  animatedUrl: string;
  originalUrl?: string;
  duration: number; // in frames (30fps = 150 frames for 5 seconds)
}

export interface TemplateProps {
  title: string;
  subtitle?: string;
  date?: string;
  message?: string;
  photos: PhotoItem[];
  musicUrl?: string;
  musicVolume?: number;
  backgroundColor?: string;
  primaryColor?: string;
  secondaryColor?: string;
}

export interface TransitionType {
  type: 'fade' | 'slide-left' | 'slide-right' | 'slide-up' | 'slide-down' | 'zoom' | 'dissolve';
  duration: number; // in frames
}

export interface TextStyle {
  fontFamily?: string;
  fontSize?: number;
  fontWeight?: number;
  color?: string;
  textAlign?: 'left' | 'center' | 'right';
  textShadow?: string;
}

// Composition IDs
export const COMPOSITION_IDS = {
  WEDDING: 'WeddingTemplate',
  BIRTHDAY: 'BirthdayTemplate',
  SEVENTY: 'SeventyTemplate',
} as const;

// Default settings
export const DEFAULT_FPS = 30;
export const DEFAULT_WIDTH = 1080;
export const DEFAULT_HEIGHT = 1920; // 9:16 vertical video

export const INTRO_DURATION_FRAMES = 90; // 3 seconds
export const OUTRO_DURATION_FRAMES = 90; // 3 seconds
export const PHOTO_DURATION_FRAMES = 150; // 5 seconds
export const TRANSITION_DURATION_FRAMES = 30; // 1 second
