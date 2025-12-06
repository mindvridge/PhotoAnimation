'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ProjectCard, EmptyProjectsState } from '@/components/features/dashboard';
import type { Project, ProjectStatus } from '@/components/features/dashboard';
import { Plus, Grid, List, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

// Mock data
const allProjects: Project[] = [
  {
    id: '1',
    title: '우리 결혼합니다',
    thumbnail: 'https://images.unsplash.com/photo-1519741497674-611481863552?w=400&h=300&fit=crop',
    templateName: '로맨틱 웨딩',
    status: 'completed',
    createdAt: '2024-01-15T10:00:00Z',
    updatedAt: '2024-01-15T12:30:00Z',
  },
  {
    id: '2',
    title: '아버지 칠순잔치',
    thumbnail: 'https://images.unsplash.com/photo-1464349095431-e9a21285b5f3?w=400&h=300&fit=crop',
    templateName: '전통 축하',
    status: 'processing',
    createdAt: '2024-01-14T09:00:00Z',
    updatedAt: '2024-01-14T14:00:00Z',
  },
  {
    id: '3',
    title: '민준이 첫돌',
    thumbnail: 'https://images.unsplash.com/photo-1504803900752-c2051699d0e8?w=400&h=300&fit=crop',
    templateName: '아기 돌잔치',
    status: 'draft',
    createdAt: '2024-01-13T11:00:00Z',
    updatedAt: '2024-01-13T11:00:00Z',
  },
  {
    id: '4',
    title: '서연이 생일파티',
    thumbnail: 'https://images.unsplash.com/photo-1558636508-e0db3814bd1d?w=400&h=300&fit=crop',
    templateName: '해피 버스데이',
    status: 'completed',
    createdAt: '2024-01-10T08:00:00Z',
    updatedAt: '2024-01-10T16:00:00Z',
  },
  {
    id: '5',
    title: '할머니 추모영상',
    thumbnail: 'https://images.unsplash.com/photo-1490730141103-6cac27abb37f?w=400&h=300&fit=crop',
    templateName: '추모',
    status: 'completed',
    createdAt: '2024-01-05T10:00:00Z',
    updatedAt: '2024-01-05T18:00:00Z',
  },
  {
    id: '6',
    title: '졸업 축하영상',
    thumbnail: 'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=400&h=300&fit=crop',
    templateName: '축하 메시지',
    status: 'failed',
    createdAt: '2024-01-03T09:00:00Z',
    updatedAt: '2024-01-03T09:30:00Z',
  },
];

type ViewMode = 'grid' | 'list';
type SortOption = 'newest' | 'oldest' | 'name';

const statusOptions: { value: ProjectStatus | 'all'; label: string }[] = [
  { value: 'all', label: '전체' },
  { value: 'draft', label: '임시저장' },
  { value: 'processing', label: '처리중' },
  { value: 'completed', label: '완료' },
  { value: 'failed', label: '실패' },
];

const sortOptions: { value: SortOption; label: string }[] = [
  { value: 'newest', label: '최신순' },
  { value: 'oldest', label: '오래된순' },
  { value: 'name', label: '이름순' },
];

export default function ProjectsPage() {
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [statusFilter, setStatusFilter] = useState<ProjectStatus | 'all'>('all');
  const [sortBy, setSortBy] = useState<SortOption>('newest');
  const [searchQuery, setSearchQuery] = useState('');

  // Filter and sort projects
  const filteredProjects = allProjects
    .filter((project) => {
      if (statusFilter !== 'all' && project.status !== statusFilter) {
        return false;
      }
      if (searchQuery && !project.title.toLowerCase().includes(searchQuery.toLowerCase())) {
        return false;
      }
      return true;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'newest':
          return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
        case 'oldest':
          return new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime();
        case 'name':
          return a.title.localeCompare(b.title, 'ko');
        default:
          return 0;
      }
    });

  const handleDelete = (id: string) => {
    console.log('Delete project:', id);
    // TODO: Implement delete
  };

  const handleDuplicate = (id: string) => {
    console.log('Duplicate project:', id);
    // TODO: Implement duplicate
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            내 프로젝트
          </h1>
          <p className="mt-1 text-gray-600 dark:text-gray-400">
            총 {filteredProjects.length}개의 프로젝트
          </p>
        </div>
        <Link href="/projects/new">
          <Button className="w-full bg-gradient-to-r from-rose-500 to-pink-500 hover:from-rose-600 hover:to-pink-600 sm:w-auto">
            <Plus className="mr-2 h-4 w-4" />
            새 영상 만들기
          </Button>
        </Link>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        {/* Search */}
        <div className="relative flex-1 sm:max-w-xs">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <Input
            placeholder="프로젝트 검색..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>

        <div className="flex items-center gap-2">
          {/* Status Filter */}
          <Select
            value={statusFilter}
            onValueChange={(value) => setStatusFilter(value as ProjectStatus | 'all')}
          >
            <SelectTrigger className="w-[120px]">
              <SelectValue placeholder="상태" />
            </SelectTrigger>
            <SelectContent>
              {statusOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Sort */}
          <Select value={sortBy} onValueChange={(value) => setSortBy(value as SortOption)}>
            <SelectTrigger className="w-[120px]">
              <SelectValue placeholder="정렬" />
            </SelectTrigger>
            <SelectContent>
              {sortOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* View Mode Toggle */}
          <div className="hidden items-center rounded-lg border p-1 sm:flex">
            <button
              onClick={() => setViewMode('grid')}
              className={cn(
                'rounded p-1.5 transition-colors',
                viewMode === 'grid'
                  ? 'bg-gray-100 text-gray-900 dark:bg-gray-800 dark:text-gray-100'
                  : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
              )}
            >
              <Grid className="h-4 w-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={cn(
                'rounded p-1.5 transition-colors',
                viewMode === 'list'
                  ? 'bg-gray-100 text-gray-900 dark:bg-gray-800 dark:text-gray-100'
                  : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
              )}
            >
              <List className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Projects Grid/List */}
      {filteredProjects.length > 0 ? (
        <div
          className={cn(
            viewMode === 'grid'
              ? 'grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'
              : 'space-y-3'
          )}
        >
          {filteredProjects.map((project) => (
            <ProjectCard
              key={project.id}
              project={project}
              view={viewMode}
              onDelete={handleDelete}
              onDuplicate={handleDuplicate}
            />
          ))}
        </div>
      ) : (
        <EmptyProjectsState />
      )}

      {/* Pagination placeholder */}
      {filteredProjects.length > 0 && (
        <div className="flex items-center justify-center gap-2 pt-4">
          <Button variant="outline" size="sm" disabled>
            이전
          </Button>
          <Button variant="outline" size="sm" className="bg-rose-50 text-rose-600 dark:bg-rose-950 dark:text-rose-400">
            1
          </Button>
          <Button variant="outline" size="sm">
            2
          </Button>
          <Button variant="outline" size="sm">
            3
          </Button>
          <Button variant="outline" size="sm">
            다음
          </Button>
        </div>
      )}
    </div>
  );
}
