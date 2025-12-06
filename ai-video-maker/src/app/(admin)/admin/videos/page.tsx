'use client';

import React, { useState, useEffect } from 'react';
import { DataTable, StatsCard, type Column } from '@/components/features/admin';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  FileVideo,
  Clock,
  CheckCircle,
  XCircle,
  RefreshCw,
  Loader2,
  AlertTriangle,
} from 'lucide-react';
import type { Video, RenderStatus, Project } from '@/types/database';

interface VideoWithProject extends Video {
  project?: Project & {
    user_email?: string;
  };
}

interface RenderQueueItem {
  id: string;
  projectId: string;
  projectName: string;
  userEmail: string;
  status: RenderStatus;
  progress: number;
  currentStep: string;
  startedAt: string;
}

const statusConfig: Record<RenderStatus, { label: string; color: string; icon: React.ElementType }> = {
  queued: { label: '대기', color: 'bg-gray-100 text-gray-700', icon: Clock },
  rendering: { label: '렌더링', color: 'bg-blue-100 text-blue-700', icon: Loader2 },
  completed: { label: '완료', color: 'bg-green-100 text-green-700', icon: CheckCircle },
  failed: { label: '실패', color: 'bg-red-100 text-red-700', icon: XCircle },
};

const queueColumns: Column<RenderQueueItem>[] = [
  {
    key: 'projectName',
    header: '프로젝트',
    cell: (item) => (
      <div>
        <div className="font-medium">{item.projectName}</div>
        <div className="text-xs text-gray-500">{item.userEmail}</div>
      </div>
    ),
  },
  {
    key: 'status',
    header: '상태',
    cell: (item) => {
      const config = statusConfig[item.status];
      const Icon = config.icon;
      return (
        <Badge variant="secondary" className={config.color}>
          <Icon className={`mr-1 h-3 w-3 ${item.status === 'rendering' ? 'animate-spin' : ''}`} />
          {config.label}
        </Badge>
      );
    },
  },
  {
    key: 'progress',
    header: '진행률',
    cell: (item) => (
      <div className="flex items-center gap-2">
        <div className="h-2 w-24 rounded-full bg-gray-200">
          <div
            className="h-full rounded-full bg-rose-500 transition-all"
            style={{ width: `${item.progress}%` }}
          />
        </div>
        <span className="text-sm">{item.progress}%</span>
      </div>
    ),
  },
  {
    key: 'currentStep',
    header: '현재 단계',
  },
  {
    key: 'startedAt',
    header: '시작 시간',
    cell: (item) => new Date(item.startedAt).toLocaleString('ko-KR'),
  },
];

const videoColumns: Column<VideoWithProject>[] = [
  {
    key: 'project',
    header: '프로젝트',
    cell: (video) => (
      <div>
        <div className="font-medium">{video.project?.name || '-'}</div>
        <div className="text-xs text-gray-500">{video.project?.user_email || '-'}</div>
      </div>
    ),
  },
  {
    key: 'render_status',
    header: '상태',
    cell: (video) => {
      const config = statusConfig[video.render_status];
      return (
        <Badge variant="secondary" className={config.color}>
          {config.label}
        </Badge>
      );
    },
  },
  {
    key: 'resolution',
    header: '해상도',
  },
  {
    key: 'duration_seconds',
    header: '길이',
    cell: (video) => (video.duration_seconds ? `${video.duration_seconds}초` : '-'),
  },
  {
    key: 'file_size_bytes',
    header: '파일 크기',
    cell: (video) => {
      if (!video.file_size_bytes) return '-';
      const mb = video.file_size_bytes / (1024 * 1024);
      return `${mb.toFixed(1)} MB`;
    },
  },
  {
    key: 'error_message',
    header: '에러',
    cell: (video) => (
      video.error_message ? (
        <span className="text-red-600" title={video.error_message}>
          <AlertTriangle className="h-4 w-4" />
        </span>
      ) : '-'
    ),
  },
  {
    key: 'created_at',
    header: '생성일',
    cell: (video) => new Date(video.created_at).toLocaleDateString('ko-KR'),
  },
];

export default function AdminVideosPage() {
  const [queue, setQueue] = useState<RenderQueueItem[]>([]);
  const [videos, setVideos] = useState<VideoWithProject[]>([]);
  const [failedVideos, setFailedVideos] = useState<VideoWithProject[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState({
    queueLength: 0,
    processing: 0,
    completed: 0,
    failed: 0,
  });

  // 데이터 조회
  const fetchData = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/admin/videos');
      const data = await response.json();

      if (data.success) {
        setQueue(data.data.queue);
        setVideos(data.data.videos);
        setFailedVideos(data.data.failedVideos);
        setStats(data.data.stats);
      }
    } catch (error) {
      console.error('Failed to fetch videos:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();

    // 30초마다 새로고침
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, []);

  // 실패한 작업 재시도
  const handleRetry = async (videoId: string) => {
    try {
      await fetch(`/api/admin/videos/${videoId}/retry`, {
        method: 'POST',
      });
      await fetchData();
    } catch (error) {
      console.error('Failed to retry video:', error);
    }
  };

  const failedColumnsWithActions: Column<VideoWithProject>[] = [
    ...videoColumns,
    {
      key: 'actions',
      header: '',
      cell: (video) => (
        <Button
          variant="outline"
          size="sm"
          onClick={() => handleRetry(video.id)}
        >
          <RefreshCw className="mr-1 h-3 w-3" />
          재시도
        </Button>
      ),
      className: 'w-24',
    },
  ];

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            영상 모니터링
          </h1>
          <p className="mt-1 text-gray-600 dark:text-gray-400">
            렌더링 큐 및 영상 상태를 모니터링합니다
          </p>
        </div>
        <Button variant="outline" onClick={fetchData}>
          <RefreshCw className="mr-2 h-4 w-4" />
          새로고침
        </Button>
      </div>

      {/* 통계 카드 */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="대기 중"
          value={stats.queueLength}
          icon={Clock}
        />
        <StatsCard
          title="렌더링 중"
          value={stats.processing}
          icon={Loader2}
        />
        <StatsCard
          title="완료"
          value={stats.completed}
          icon={CheckCircle}
        />
        <StatsCard
          title="실패"
          value={stats.failed}
          icon={XCircle}
        />
      </div>

      {/* 탭 */}
      <Tabs defaultValue="queue">
        <TabsList>
          <TabsTrigger value="queue" className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            렌더링 큐
            {stats.queueLength > 0 && (
              <Badge variant="secondary">{stats.queueLength}</Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="failed" className="flex items-center gap-2">
            <XCircle className="h-4 w-4" />
            실패한 작업
            {stats.failed > 0 && (
              <Badge variant="destructive">{stats.failed}</Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="all" className="flex items-center gap-2">
            <FileVideo className="h-4 w-4" />
            전체 영상
          </TabsTrigger>
        </TabsList>

        {/* 렌더링 큐 */}
        <TabsContent value="queue">
          <Card>
            <CardHeader>
              <CardTitle>렌더링 큐</CardTitle>
              <CardDescription>현재 대기 중이거나 렌더링 중인 작업</CardDescription>
            </CardHeader>
            <CardContent>
              <DataTable
                data={queue}
                columns={queueColumns}
                isLoading={isLoading}
                emptyMessage="대기 중인 작업이 없습니다."
              />
            </CardContent>
          </Card>
        </TabsContent>

        {/* 실패한 작업 */}
        <TabsContent value="failed">
          <Card>
            <CardHeader>
              <CardTitle>실패한 작업</CardTitle>
              <CardDescription>렌더링에 실패한 영상 목록</CardDescription>
            </CardHeader>
            <CardContent>
              <DataTable
                data={failedVideos}
                columns={failedColumnsWithActions}
                isLoading={isLoading}
                emptyMessage="실패한 작업이 없습니다."
              />
            </CardContent>
          </Card>
        </TabsContent>

        {/* 전체 영상 */}
        <TabsContent value="all">
          <Card>
            <CardHeader>
              <CardTitle>전체 영상</CardTitle>
              <CardDescription>모든 영상 목록</CardDescription>
            </CardHeader>
            <CardContent>
              <DataTable
                data={videos}
                columns={videoColumns}
                searchable
                searchPlaceholder="프로젝트명 검색..."
                searchKey="project"
                isLoading={isLoading}
                emptyMessage="영상이 없습니다."
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
