/**
 * 배경음악 목록
 * 클라이언트와 서버 모두에서 사용 가능
 */

export const MUSIC_TRACKS = [
  {
    id: 'romantic-piano',
    name: '로맨틱 피아노',
    description: '부드러운 피아노 멜로디',
    category: 'wedding',
    duration: 180,
  },
  {
    id: 'happy-celebration',
    name: '즐거운 축하',
    description: '밝고 경쾌한 축하 음악',
    category: 'birthday',
    duration: 150,
  },
  {
    id: 'traditional-korean',
    name: '전통 가야금',
    description: '우아한 전통 가야금 연주',
    category: 'traditional',
    duration: 200,
  },
  {
    id: 'emotional-strings',
    name: '감동 스트링',
    description: '감동적인 현악 오케스트라',
    category: 'general',
    duration: 180,
  },
  {
    id: 'upbeat-acoustic',
    name: '밝은 어쿠스틱',
    description: '따뜻한 어쿠스틱 기타',
    category: 'general',
    duration: 160,
  },
] as const;

export type MusicTrackId = typeof MUSIC_TRACKS[number]['id'];
export type MusicTrack = typeof MUSIC_TRACKS[number];
