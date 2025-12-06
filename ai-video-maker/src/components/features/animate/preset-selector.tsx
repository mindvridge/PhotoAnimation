'use client';

import { cn } from '@/lib/utils';
import { ANIMATION_PRESETS, type AnimationPresetId } from '@/lib/kling-ai';
import { Sparkles, MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';

interface PresetSelectorProps {
  selectedPreset: AnimationPresetId | 'custom' | null;
  customPrompt: string;
  onPresetSelect: (preset: AnimationPresetId | 'custom') => void;
  onCustomPromptChange: (prompt: string) => void;
  disabled?: boolean;
}

const presetList = Object.values(ANIMATION_PRESETS);

export function PresetSelector({
  selectedPreset,
  customPrompt,
  onPresetSelect,
  onCustomPromptChange,
  disabled,
}: PresetSelectorProps) {
  return (
    <div className="space-y-4">
      <div>
        <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">
          애니메이션 스타일 선택
        </Label>
        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
          사진에 적용할 움직임을 선택하세요
        </p>
      </div>

      {/* 프리셋 버튼 그리드 */}
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        {presetList.map((preset) => (
          <button
            key={preset.id}
            type="button"
            onClick={() => onPresetSelect(preset.id as AnimationPresetId)}
            disabled={disabled}
            className={cn(
              'flex flex-col items-center gap-2 rounded-xl border-2 p-4 transition-all',
              selectedPreset === preset.id
                ? 'border-rose-400 bg-rose-50 dark:border-rose-600 dark:bg-rose-950/30'
                : 'border-gray-200 bg-white hover:border-gray-300 dark:border-gray-700 dark:bg-gray-900 dark:hover:border-gray-600',
              disabled && 'cursor-not-allowed opacity-50'
            )}
          >
            <span className="text-2xl">{preset.icon}</span>
            <span
              className={cn(
                'text-sm font-medium',
                selectedPreset === preset.id
                  ? 'text-rose-600 dark:text-rose-400'
                  : 'text-gray-700 dark:text-gray-300'
              )}
            >
              {preset.name}
            </span>
          </button>
        ))}

        {/* 커스텀 프롬프트 */}
        <button
          type="button"
          onClick={() => onPresetSelect('custom')}
          disabled={disabled}
          className={cn(
            'flex flex-col items-center gap-2 rounded-xl border-2 p-4 transition-all',
            selectedPreset === 'custom'
              ? 'border-purple-400 bg-purple-50 dark:border-purple-600 dark:bg-purple-950/30'
              : 'border-gray-200 bg-white hover:border-gray-300 dark:border-gray-700 dark:bg-gray-900 dark:hover:border-gray-600',
            disabled && 'cursor-not-allowed opacity-50'
          )}
        >
          <MessageSquare
            className={cn(
              'h-6 w-6',
              selectedPreset === 'custom'
                ? 'text-purple-500'
                : 'text-gray-400'
            )}
          />
          <span
            className={cn(
              'text-sm font-medium',
              selectedPreset === 'custom'
                ? 'text-purple-600 dark:text-purple-400'
                : 'text-gray-700 dark:text-gray-300'
            )}
          >
            직접 입력
          </span>
        </button>
      </div>

      {/* 커스텀 프롬프트 입력 */}
      {selectedPreset === 'custom' && (
        <div className="space-y-2">
          <Label htmlFor="custom-prompt" className="text-sm font-medium">
            커스텀 프롬프트 (영어)
          </Label>
          <Textarea
            id="custom-prompt"
            value={customPrompt}
            onChange={(e) => onCustomPromptChange(e.target.value)}
            placeholder="예: gentle smile with slight head turn, natural eye movement"
            className="min-h-[100px]"
            disabled={disabled}
          />
          <p className="text-xs text-gray-500 dark:text-gray-400">
            영어로 원하는 움직임을 상세하게 설명해주세요
          </p>
        </div>
      )}

      {/* 선택된 프롬프트 미리보기 */}
      {selectedPreset && selectedPreset !== 'custom' && (
        <div className="rounded-lg bg-gray-50 p-3 dark:bg-gray-800">
          <p className="text-xs text-gray-500 dark:text-gray-400">적용될 프롬프트:</p>
          <p className="mt-1 text-sm text-gray-700 dark:text-gray-300">
            {ANIMATION_PRESETS[selectedPreset]?.prompt}
          </p>
        </div>
      )}
    </div>
  );
}
