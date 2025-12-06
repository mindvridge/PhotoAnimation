'use client';

import { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Pencil, Loader2 } from 'lucide-react';
import type { TemplateData } from './template-selector';

interface ProjectNameInputProps {
  template: TemplateData;
  onSubmit: (name: string) => void;
  onBack: () => void;
  isLoading?: boolean;
}

export function ProjectNameInput({
  template,
  onSubmit,
  onBack,
  isLoading = false,
}: ProjectNameInputProps) {
  const getDefaultName = () => {
    const today = new Date().toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
    return `내 ${template.name} 영상 - ${today}`;
  };

  const [projectName, setProjectName] = useState(getDefaultName());

  // Update default name when template changes
  useEffect(() => {
    setProjectName(getDefaultName());
  }, [template.id]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(projectName.trim() || getDefaultName());
  };

  return (
    <Card className="mx-auto max-w-lg">
      <CardHeader className="text-center">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-rose-100 to-pink-100 dark:from-rose-900/30 dark:to-pink-900/30">
          <Pencil className="h-6 w-6 text-rose-500" />
        </div>
        <CardTitle>프로젝트 이름</CardTitle>
        <CardDescription>
          프로젝트 이름을 입력해주세요. 나중에 변경할 수 있습니다.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Selected Template Preview */}
          <div className="flex items-center gap-4 rounded-lg border border-gray-200 p-3 dark:border-gray-800">
            <img
              src={template.thumbnail}
              alt={template.name}
              className="h-16 w-24 rounded-md object-cover"
            />
            <div className="flex-1 min-w-0">
              <p className="font-medium text-gray-900 dark:text-gray-100 truncate">
                {template.name}
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {template.creditCost} 크레딧
              </p>
            </div>
          </div>

          {/* Name Input */}
          <div className="space-y-2">
            <label
              htmlFor="projectName"
              className="text-sm font-medium text-gray-700 dark:text-gray-300"
            >
              프로젝트 이름
            </label>
            <Input
              id="projectName"
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              placeholder="프로젝트 이름을 입력하세요"
              disabled={isLoading}
              className="h-11"
            />
            <p className="text-xs text-muted-foreground">
              예: 우리 결혼합니다, 아버지 칠순잔치, 민준이 첫돌
            </p>
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={onBack}
              disabled={isLoading}
              className="flex-1"
            >
              이전
            </Button>
            <Button
              type="submit"
              disabled={isLoading}
              className="flex-1 bg-gradient-to-r from-rose-500 to-pink-500 hover:from-rose-600 hover:to-pink-600"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  생성 중...
                </>
              ) : (
                '프로젝트 생성'
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
