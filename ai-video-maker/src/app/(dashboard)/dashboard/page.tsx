'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CreditBalanceCard, ProjectCard, TemplateCard } from '@/components/features/dashboard';
import type { Project, Template } from '@/components/features/dashboard';
import { useAuth } from '@/hooks/useAuth';
import { Plus, ArrowRight, Sparkles } from 'lucide-react';

// Mock data - 실제로는 API에서 가져옴
const recentProjects: Project[] = [
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
];

const popularTemplates: Template[] = [
  {
    id: '1',
    name: '로맨틱 웨딩',
    description: '사랑스러운 분위기의 결혼식 영상',
    thumbnail: 'https://images.unsplash.com/photo-1519741497674-611481863552?w=400&h=300&fit=crop',
    category: 'wedding',
    isPremium: false,
    creditCost: 10,
    duration: 180,
  },
  {
    id: '2',
    name: '프리미엄 웨딩',
    description: '고급스러운 시네마틱 웨딩 영상',
    thumbnail: 'https://images.unsplash.com/photo-1511285560929-80b456fea0bc?w=400&h=300&fit=crop',
    category: 'wedding',
    isPremium: true,
    creditCost: 25,
    duration: 240,
  },
  {
    id: '3',
    name: '해피 버스데이',
    description: '생일 축하 영상 템플릿',
    thumbnail: 'https://images.unsplash.com/photo-1558636508-e0db3814bd1d?w=400&h=300&fit=crop',
    category: 'birthday',
    isPremium: false,
    creditCost: 8,
    duration: 120,
  },
  {
    id: '4',
    name: '아기 돌잔치',
    description: '아이의 첫 생일을 축하해요',
    thumbnail: 'https://images.unsplash.com/photo-1504803900752-c2051699d0e8?w=400&h=300&fit=crop',
    category: 'baby',
    isPremium: false,
    creditCost: 10,
    duration: 150,
  },
];

export default function DashboardPage() {
  const { user } = useAuth();
  const userName = user?.user_metadata?.full_name || user?.email?.split('@')[0] || '사용자';

  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 sm:text-3xl">
            안녕하세요, {userName}님!
          </h1>
          <p className="mt-1 text-gray-600 dark:text-gray-400">
            오늘도 특별한 순간을 영상으로 만들어보세요.
          </p>
        </div>
        <Link href="/projects/new">
          <Button
            size="lg"
            className="w-full bg-gradient-to-r from-rose-500 to-pink-500 hover:from-rose-600 hover:to-pink-600 sm:w-auto"
          >
            <Plus className="mr-2 h-5 w-5" />
            새 영상 만들기
          </Button>
        </Link>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {/* Credit Balance Card */}
        <CreditBalanceCard credits={100} />

        {/* Quick Stats */}
        <Card className="bg-gradient-to-br from-violet-500 to-purple-600 text-white">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <div className="rounded-full bg-white/20 p-2">
                <Sparkles className="h-5 w-5" />
              </div>
              <span className="text-sm font-medium text-white/90">완료된 프로젝트</span>
            </div>
            <div className="mt-4">
              <span className="text-4xl font-bold">12</span>
              <span className="ml-2 text-lg text-white/80">개</span>
            </div>
          </CardContent>
        </Card>

        {/* Pro Tip Card */}
        <Card className="bg-gradient-to-br from-emerald-500 to-teal-600 text-white sm:col-span-2 lg:col-span-1">
          <CardContent className="pt-6">
            <h3 className="text-sm font-medium text-white/90">오늘의 팁</h3>
            <p className="mt-2 text-lg font-medium">
              고화질 사진을 사용하면 더 멋진 영상을 만들 수 있어요!
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Projects */}
      <section>
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            최근 프로젝트
          </h2>
          <Link
            href="/projects"
            className="flex items-center text-sm font-medium text-rose-600 hover:text-rose-700 dark:text-rose-400 dark:hover:text-rose-300"
          >
            전체보기
            <ArrowRight className="ml-1 h-4 w-4" />
          </Link>
        </div>

        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {recentProjects.map((project) => (
            <ProjectCard key={project.id} project={project} />
          ))}
        </div>
      </section>

      {/* Popular Templates */}
      <section>
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            인기 템플릿
          </h2>
          <Link
            href="/templates"
            className="flex items-center text-sm font-medium text-rose-600 hover:text-rose-700 dark:text-rose-400 dark:hover:text-rose-300"
          >
            전체보기
            <ArrowRight className="ml-1 h-4 w-4" />
          </Link>
        </div>

        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {popularTemplates.map((template) => (
            <TemplateCard key={template.id} template={template} />
          ))}
        </div>
      </section>
    </div>
  );
}
