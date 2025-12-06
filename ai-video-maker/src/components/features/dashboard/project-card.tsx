'use client';

import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Play,
  MoreVertical,
  Download,
  Trash2,
  Copy,
  Pencil,
  Clock,
  CheckCircle2,
  Loader2,
  AlertCircle,
} from 'lucide-react';
import { cn } from '@/lib/utils';

export type ProjectStatus = 'draft' | 'processing' | 'completed' | 'failed';

export interface Project {
  id: string;
  title: string;
  thumbnail?: string;
  templateName: string;
  status: ProjectStatus;
  createdAt: string;
  updatedAt: string;
  duration?: number;
}

interface ProjectCardProps {
  project: Project;
  view?: 'grid' | 'list';
  onDelete?: (id: string) => void;
  onDuplicate?: (id: string) => void;
}

const statusConfig: Record<
  ProjectStatus,
  { label: string; icon: React.ElementType; variant: 'default' | 'secondary' | 'success' | 'warning' | 'destructive' }
> = {
  draft: {
    label: '임시저장',
    icon: Clock,
    variant: 'secondary',
  },
  processing: {
    label: '처리중',
    icon: Loader2,
    variant: 'warning',
  },
  completed: {
    label: '완료',
    icon: CheckCircle2,
    variant: 'success',
  },
  failed: {
    label: '실패',
    icon: AlertCircle,
    variant: 'destructive',
  },
};

export function ProjectCard({
  project,
  view = 'grid',
  onDelete,
  onDuplicate,
}: ProjectCardProps) {
  const status = statusConfig[project.status];
  const StatusIcon = status.icon;

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('ko-KR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    }).format(date);
  };

  if (view === 'list') {
    return (
      <Card className="group overflow-hidden transition-all hover:shadow-md">
        <div className="flex items-center gap-4 p-4">
          {/* Thumbnail */}
          <div className="relative h-16 w-24 flex-shrink-0 overflow-hidden rounded-lg bg-gray-100 dark:bg-gray-800">
            {project.thumbnail ? (
              <img
                src={project.thumbnail}
                alt={project.title}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center">
                <Play className="h-6 w-6 text-gray-400" />
              </div>
            )}
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <Link
              href={`/projects/${project.id}`}
              className="font-medium text-gray-900 hover:text-rose-600 dark:text-gray-100 dark:hover:text-rose-400"
            >
              {project.title}
            </Link>
            <p className="mt-0.5 text-sm text-gray-500 dark:text-gray-400">
              {project.templateName}
            </p>
          </div>

          {/* Status */}
          <Badge variant={status.variant} className="flex items-center gap-1">
            <StatusIcon
              className={cn(
                'h-3 w-3',
                project.status === 'processing' && 'animate-spin'
              )}
            />
            {status.label}
          </Badge>

          {/* Date */}
          <span className="hidden text-sm text-gray-500 sm:block dark:text-gray-400">
            {formatDate(project.updatedAt)}
          </span>

          {/* Actions */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem asChild>
                <Link href={`/projects/${project.id}`}>
                  <Pencil className="mr-2 h-4 w-4" />
                  편집
                </Link>
              </DropdownMenuItem>
              {project.status === 'completed' && (
                <DropdownMenuItem>
                  <Download className="mr-2 h-4 w-4" />
                  다운로드
                </DropdownMenuItem>
              )}
              <DropdownMenuItem onClick={() => onDuplicate?.(project.id)}>
                <Copy className="mr-2 h-4 w-4" />
                복제
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-destructive focus:text-destructive"
                onClick={() => onDelete?.(project.id)}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                삭제
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </Card>
    );
  }

  return (
    <Card className="group overflow-hidden transition-all hover:shadow-lg hover:-translate-y-1">
      {/* Thumbnail */}
      <div className="relative aspect-video overflow-hidden bg-gray-100 dark:bg-gray-800">
        {project.thumbnail ? (
          <img
            src={project.thumbnail}
            alt={project.title}
            className="h-full w-full object-cover transition-transform group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <Play className="h-12 w-12 text-gray-400" />
          </div>
        )}

        {/* Overlay on hover */}
        <div className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 transition-opacity group-hover:opacity-100">
          <Link href={`/projects/${project.id}`}>
            <Button size="sm" variant="secondary" className="gap-1">
              <Pencil className="h-4 w-4" />
              편집하기
            </Button>
          </Link>
        </div>

        {/* Status Badge */}
        <div className="absolute left-3 top-3">
          <Badge variant={status.variant} className="flex items-center gap-1">
            <StatusIcon
              className={cn(
                'h-3 w-3',
                project.status === 'processing' && 'animate-spin'
              )}
            />
            {status.label}
          </Badge>
        </div>

        {/* Menu */}
        <div className="absolute right-2 top-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="secondary"
                size="icon"
                className="h-8 w-8 opacity-0 group-hover:opacity-100"
              >
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem asChild>
                <Link href={`/projects/${project.id}`}>
                  <Pencil className="mr-2 h-4 w-4" />
                  편집
                </Link>
              </DropdownMenuItem>
              {project.status === 'completed' && (
                <DropdownMenuItem>
                  <Download className="mr-2 h-4 w-4" />
                  다운로드
                </DropdownMenuItem>
              )}
              <DropdownMenuItem onClick={() => onDuplicate?.(project.id)}>
                <Copy className="mr-2 h-4 w-4" />
                복제
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-destructive focus:text-destructive"
                onClick={() => onDelete?.(project.id)}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                삭제
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Content */}
      <CardContent className="p-4">
        <Link
          href={`/projects/${project.id}`}
          className="block font-medium text-gray-900 hover:text-rose-600 dark:text-gray-100 dark:hover:text-rose-400"
        >
          {project.title}
        </Link>
        <div className="mt-1 flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
          <span>{project.templateName}</span>
          <span>{formatDate(project.updatedAt)}</span>
        </div>
      </CardContent>
    </Card>
  );
}

export function EmptyProjectsState() {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-gray-200 px-6 py-16 dark:border-gray-800">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-rose-100 to-pink-100 dark:from-rose-900/30 dark:to-pink-900/30">
        <Play className="h-8 w-8 text-rose-500" />
      </div>
      <h3 className="mt-4 text-lg font-semibold text-gray-900 dark:text-gray-100">
        아직 프로젝트가 없습니다
      </h3>
      <p className="mt-1 text-center text-sm text-gray-500 dark:text-gray-400">
        첫 번째 영상을 만들어보세요!
        <br />
        다양한 템플릿으로 특별한 순간을 기록하세요.
      </p>
      <Link href="/projects/new" className="mt-6">
        <Button className="bg-gradient-to-r from-rose-500 to-pink-500 hover:from-rose-600 hover:to-pink-600">
          새 영상 만들기
        </Button>
      </Link>
    </div>
  );
}
