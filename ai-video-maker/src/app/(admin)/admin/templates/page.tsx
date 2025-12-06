'use client';

import React, { useState, useEffect } from 'react';
import { DataTable, type Column } from '@/components/features/admin';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Film, Plus, Crown, Eye, EyeOff } from 'lucide-react';
import type { Template, TemplateCategory } from '@/types/database';

const categoryLabels: Record<TemplateCategory, string> = {
  wedding: '결혼식',
  birthday: '생일',
  anniversary: '기념일',
  celebration: '축하',
  memorial: '추모',
};

const templateColumns: Column<Template>[] = [
  {
    key: 'name',
    header: '템플릿명',
    cell: (template) => (
      <div className="flex items-center gap-3">
        {template.thumbnail_url ? (
          <img
            src={template.thumbnail_url}
            alt={template.name}
            className="h-12 w-12 rounded-lg object-cover"
          />
        ) : (
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-gray-100 dark:bg-gray-800">
            <Film className="h-6 w-6 text-gray-400" />
          </div>
        )}
        <div>
          <div className="font-medium">{template.name}</div>
          <div className="text-xs text-gray-500">{template.slug}</div>
        </div>
      </div>
    ),
  },
  {
    key: 'category',
    header: '카테고리',
    cell: (template) => (
      <Badge variant="secondary">
        {categoryLabels[template.category]}
      </Badge>
    ),
  },
  {
    key: 'is_premium',
    header: '프리미엄',
    cell: (template) => (
      template.is_premium ? (
        <Badge className="bg-amber-100 text-amber-700">
          <Crown className="mr-1 h-3 w-3" />
          프리미엄
        </Badge>
      ) : (
        <Badge variant="outline">무료</Badge>
      )
    ),
  },
  {
    key: 'is_active',
    header: '상태',
    cell: (template) => (
      template.is_active ? (
        <Badge className="bg-green-100 text-green-700">
          <Eye className="mr-1 h-3 w-3" />
          활성
        </Badge>
      ) : (
        <Badge variant="secondary" className="bg-gray-100 text-gray-500">
          <EyeOff className="mr-1 h-3 w-3" />
          비활성
        </Badge>
      )
    ),
  },
  {
    key: 'max_photos',
    header: '최대 사진',
    cell: (template) => `${template.max_photos}장`,
  },
  {
    key: 'duration_seconds',
    header: '길이',
    cell: (template) => `${template.duration_seconds}초`,
  },
];

export default function AdminTemplatesPage() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // 폼 상태
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    description: '',
    category: 'wedding' as TemplateCategory,
    max_photos: 10,
    duration_seconds: 60,
    is_premium: false,
    is_active: true,
  });

  // 템플릿 목록 조회
  const fetchTemplates = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/admin/templates');
      const data = await response.json();
      if (data.success) {
        setTemplates(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch templates:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTemplates();
  }, []);

  // 템플릿 편집
  const handleEditTemplate = (template: Template) => {
    setSelectedTemplate(template);
    setFormData({
      name: template.name,
      slug: template.slug,
      description: template.description || '',
      category: template.category,
      max_photos: template.max_photos,
      duration_seconds: template.duration_seconds,
      is_premium: template.is_premium,
      is_active: template.is_active,
    });
    setIsAddDialogOpen(true);
  };

  // 새 템플릿 추가
  const handleAddTemplate = () => {
    setSelectedTemplate(null);
    setFormData({
      name: '',
      slug: '',
      description: '',
      category: 'wedding',
      max_photos: 10,
      duration_seconds: 60,
      is_premium: false,
      is_active: true,
    });
    setIsAddDialogOpen(true);
  };

  // 템플릿 저장
  const handleSaveTemplate = async () => {
    try {
      setIsSaving(true);

      const url = selectedTemplate
        ? `/api/admin/templates/${selectedTemplate.id}`
        : '/api/admin/templates';

      const response = await fetch(url, {
        method: selectedTemplate ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        await fetchTemplates();
        setIsAddDialogOpen(false);
      }
    } catch (error) {
      console.error('Failed to save template:', error);
    } finally {
      setIsSaving(false);
    }
  };

  // 활성화/비활성화 토글
  const handleToggleActive = async (template: Template) => {
    try {
      await fetch(`/api/admin/templates/${template.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_active: !template.is_active }),
      });
      await fetchTemplates();
    } catch (error) {
      console.error('Failed to toggle template:', error);
    }
  };

  const columnsWithActions: Column<Template>[] = [
    ...templateColumns,
    {
      key: 'actions',
      header: '',
      cell: (template) => (
        <div className="flex items-center gap-2">
          <Switch
            checked={template.is_active}
            onCheckedChange={() => handleToggleActive(template)}
          />
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              handleEditTemplate(template);
            }}
          >
            편집
          </Button>
        </div>
      ),
      className: 'w-32',
    },
  ];

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            템플릿 관리
          </h1>
          <p className="mt-1 text-gray-600 dark:text-gray-400">
            영상 템플릿을 관리합니다
          </p>
        </div>
        <Button onClick={handleAddTemplate}>
          <Plus className="mr-2 h-4 w-4" />
          새 템플릿
        </Button>
      </div>

      {/* 템플릿 테이블 */}
      <Card>
        <CardHeader>
          <CardTitle>템플릿 목록</CardTitle>
          <CardDescription>총 {templates.length}개의 템플릿</CardDescription>
        </CardHeader>
        <CardContent>
          <DataTable
            data={templates}
            columns={columnsWithActions}
            searchable
            searchPlaceholder="템플릿명 검색..."
            searchKey="name"
            isLoading={isLoading}
            emptyMessage="템플릿이 없습니다."
          />
        </CardContent>
      </Card>

      {/* 템플릿 추가/편집 다이얼로그 */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {selectedTemplate ? '템플릿 편집' : '새 템플릿 추가'}
            </DialogTitle>
            <DialogDescription>
              템플릿 정보를 입력하세요
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">템플릿명</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="slug">Slug</Label>
                <Input
                  id="slug"
                  value={formData.slug}
                  onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">설명</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="category">카테고리</Label>
                <Select
                  value={formData.category}
                  onValueChange={(v) => setFormData({ ...formData, category: v as TemplateCategory })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(categoryLabels).map(([value, label]) => (
                      <SelectItem key={value} value={value}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="max_photos">최대 사진 수</Label>
                <Input
                  id="max_photos"
                  type="number"
                  value={formData.max_photos}
                  onChange={(e) => setFormData({ ...formData, max_photos: parseInt(e.target.value) })}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="duration">영상 길이 (초)</Label>
                <Input
                  id="duration"
                  type="number"
                  value={formData.duration_seconds}
                  onChange={(e) => setFormData({ ...formData, duration_seconds: parseInt(e.target.value) })}
                />
              </div>
            </div>

            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2">
                <Switch
                  id="is_premium"
                  checked={formData.is_premium}
                  onCheckedChange={(v) => setFormData({ ...formData, is_premium: v })}
                />
                <Label htmlFor="is_premium">프리미엄</Label>
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  id="is_active"
                  checked={formData.is_active}
                  onCheckedChange={(v) => setFormData({ ...formData, is_active: v })}
                />
                <Label htmlFor="is_active">활성화</Label>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
              취소
            </Button>
            <Button onClick={handleSaveTemplate} disabled={isSaving}>
              {isSaving ? '저장 중...' : '저장'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
