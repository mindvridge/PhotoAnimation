'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Music, Monitor, Volume2 } from 'lucide-react';
import { MUSIC_TRACKS } from '@/lib/remotion/music-tracks';

export interface VideoSettings {
  title: string;
  subtitle: string;
  date: string;
  message: string;
  musicTrack: string;
  musicVolume: number;
  resolution: 'hd' | 'full-hd';
}

interface VideoSettingsFormProps {
  settings: VideoSettings;
  onChange: (settings: VideoSettings) => void;
  disabled?: boolean;
  templateType?: 'wedding' | 'birthday' | 'seventy';
}

export function VideoSettingsForm({
  settings,
  onChange,
  disabled,
  templateType = 'wedding',
}: VideoSettingsFormProps) {
  const handleChange = <K extends keyof VideoSettings>(
    key: K,
    value: VideoSettings[K]
  ) => {
    onChange({ ...settings, [key]: value });
  };

  // 템플릿 타입에 따른 라벨
  const labels = getLabelsForTemplate(templateType);

  // 템플릿에 맞는 음악 필터링
  const filteredMusicTracks = MUSIC_TRACKS.filter(
    (track) =>
      track.category === 'general' ||
      (templateType === 'wedding' && track.category === 'wedding') ||
      (templateType === 'birthday' && track.category === 'birthday') ||
      (templateType === 'seventy' && track.category === 'traditional')
  );

  return (
    <div className="space-y-6">
      {/* 텍스트 설정 */}
      <div className="space-y-4">
        <h3 className="flex items-center gap-2 font-medium text-gray-900 dark:text-gray-100">
          <span className="text-lg">✏️</span>
          텍스트 설정
        </h3>

        {/* 제목 */}
        <div className="space-y-2">
          <Label htmlFor="title">{labels.title}</Label>
          <Input
            id="title"
            value={settings.title}
            onChange={(e) => handleChange('title', e.target.value)}
            placeholder={labels.titlePlaceholder}
            disabled={disabled}
            maxLength={50}
          />
        </div>

        {/* 부제목 */}
        <div className="space-y-2">
          <Label htmlFor="subtitle">{labels.subtitle}</Label>
          <Input
            id="subtitle"
            value={settings.subtitle}
            onChange={(e) => handleChange('subtitle', e.target.value)}
            placeholder={labels.subtitlePlaceholder}
            disabled={disabled}
            maxLength={30}
          />
        </div>

        {/* 날짜 */}
        <div className="space-y-2">
          <Label htmlFor="date">{labels.date}</Label>
          <Input
            id="date"
            value={settings.date}
            onChange={(e) => handleChange('date', e.target.value)}
            placeholder="2024년 12월 25일"
            disabled={disabled}
          />
        </div>

        {/* 메시지 */}
        <div className="space-y-2">
          <Label htmlFor="message">{labels.message}</Label>
          <Textarea
            id="message"
            value={settings.message}
            onChange={(e) => handleChange('message', e.target.value)}
            placeholder={labels.messagePlaceholder}
            disabled={disabled}
            maxLength={100}
            rows={2}
          />
        </div>
      </div>

      {/* 배경음악 설정 */}
      <div className="space-y-4">
        <h3 className="flex items-center gap-2 font-medium text-gray-900 dark:text-gray-100">
          <Music className="h-5 w-5" />
          배경음악
        </h3>

        <div className="space-y-2">
          <Label htmlFor="music">음악 선택</Label>
          <Select
            value={settings.musicTrack}
            onValueChange={(value) => handleChange('musicTrack', value)}
            disabled={disabled}
          >
            <SelectTrigger>
              <SelectValue placeholder="배경음악을 선택하세요" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">음악 없음</SelectItem>
              {filteredMusicTracks.map((track) => (
                <SelectItem key={track.id} value={track.id}>
                  <div className="flex flex-col">
                    <span>{track.name}</span>
                    <span className="text-xs text-gray-500">
                      {track.description}
                    </span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* 음량 조절 */}
        {settings.musicTrack && settings.musicTrack !== 'none' && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="flex items-center gap-2">
                <Volume2 className="h-4 w-4" />
                음량
              </Label>
              <span className="text-sm text-gray-500">
                {Math.round(settings.musicVolume * 100)}%
              </span>
            </div>
            <Slider
              value={[settings.musicVolume]}
              onValueChange={([value]) => handleChange('musicVolume', value)}
              min={0}
              max={1}
              step={0.1}
              disabled={disabled}
              className="w-full"
            />
          </div>
        )}
      </div>

      {/* 해상도 설정 */}
      <div className="space-y-4">
        <h3 className="flex items-center gap-2 font-medium text-gray-900 dark:text-gray-100">
          <Monitor className="h-5 w-5" />
          화질 설정
        </h3>

        <RadioGroup
          value={settings.resolution}
          onValueChange={(value: 'hd' | 'full-hd') =>
            handleChange('resolution', value)
          }
          disabled={disabled}
          className="grid grid-cols-2 gap-4"
        >
          <label
            className={cn(
              'relative flex cursor-pointer flex-col items-center rounded-lg border-2 p-4 transition-all',
              settings.resolution === 'hd'
                ? 'border-rose-400 bg-rose-50 dark:border-rose-600 dark:bg-rose-950/30'
                : 'border-gray-200 bg-white hover:border-gray-300 dark:border-gray-700 dark:bg-gray-900'
            )}
          >
            <RadioGroupItem value="hd" className="sr-only" />
            <span className="text-lg font-bold text-gray-900 dark:text-gray-100">
              HD
            </span>
            <span className="text-sm text-gray-500">1280 × 720</span>
            <span className="mt-1 text-xs text-gray-400">빠른 렌더링</span>
          </label>

          <label
            className={cn(
              'relative flex cursor-pointer flex-col items-center rounded-lg border-2 p-4 transition-all',
              settings.resolution === 'full-hd'
                ? 'border-rose-400 bg-rose-50 dark:border-rose-600 dark:bg-rose-950/30'
                : 'border-gray-200 bg-white hover:border-gray-300 dark:border-gray-700 dark:bg-gray-900'
            )}
          >
            <RadioGroupItem value="full-hd" className="sr-only" />
            <span className="text-lg font-bold text-gray-900 dark:text-gray-100">
              Full HD
            </span>
            <span className="text-sm text-gray-500">1920 × 1080</span>
            <span className="mt-1 text-xs text-gray-400">고화질</span>
          </label>
        </RadioGroup>
      </div>
    </div>
  );
}

/**
 * 템플릿 타입에 따른 라벨
 */
function getLabelsForTemplate(templateType: string) {
  switch (templateType) {
    case 'wedding':
      return {
        title: '제목',
        titlePlaceholder: '우리의 아름다운 순간',
        subtitle: '부제목',
        subtitlePlaceholder: '영원히 함께',
        date: '날짜',
        message: '마무리 메시지',
        messagePlaceholder: '사랑과 감사의 마음을 담아',
      };
    case 'birthday':
      return {
        title: '축하 메시지',
        titlePlaceholder: '생일 축하합니다!',
        subtitle: '부제목',
        subtitlePlaceholder: '특별한 하루',
        date: '생일',
        message: '마무리 메시지',
        messagePlaceholder: '행복한 생일이 되세요',
      };
    case 'seventy':
      return {
        title: '축하 메시지',
        titlePlaceholder: '칠순을 축하드립니다',
        subtitle: '기원 문구',
        subtitlePlaceholder: '건강과 장수를 기원합니다',
        date: '날짜',
        message: '마무리 메시지',
        messagePlaceholder: '늘 건강하시고 행복하세요',
      };
    default:
      return {
        title: '제목',
        titlePlaceholder: '제목을 입력하세요',
        subtitle: '부제목',
        subtitlePlaceholder: '부제목을 입력하세요',
        date: '날짜',
        message: '메시지',
        messagePlaceholder: '메시지를 입력하세요',
      };
  }
}

export default VideoSettingsForm;
