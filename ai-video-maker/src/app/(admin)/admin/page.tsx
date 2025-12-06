import { Suspense } from 'react';
import { createClient } from '@/lib/supabase/server';
import { StatsCard, Chart, DataTable, type Column } from '@/components/features/admin';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Users,
  CreditCard,
  Film,
  Coins,
  Activity,
} from 'lucide-react';

// 최근 활동 타입
interface RecentActivity {
  id: string;
  type: 'signup' | 'payment' | 'video' | 'project';
  description: string;
  user: string;
  timestamp: string;
}

// 활동 컬럼 정의
const activityColumns: Column<RecentActivity>[] = [
  {
    key: 'type',
    header: '유형',
    cell: (item) => {
      const typeConfig = {
        signup: { label: '가입', color: 'bg-blue-100 text-blue-700' },
        payment: { label: '결제', color: 'bg-green-100 text-green-700' },
        video: { label: '영상', color: 'bg-purple-100 text-purple-700' },
        project: { label: '프로젝트', color: 'bg-orange-100 text-orange-700' },
      };
      const config = typeConfig[item.type];
      return (
        <Badge variant="secondary" className={config.color}>
          {config.label}
        </Badge>
      );
    },
  },
  { key: 'description', header: '내용' },
  { key: 'user', header: '사용자' },
  {
    key: 'timestamp',
    header: '시간',
    cell: (item) => new Date(item.timestamp).toLocaleString('ko-KR'),
  },
];

async function getAdminStats() {
  const supabase = await createClient();
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // 오늘 가입자 수
  const { count: todaySignups } = await supabase
    .from('users')
    .select('*', { count: 'exact', head: true })
    .gte('created_at', today.toISOString());

  // 오늘 결제 수
  const { count: todayPayments } = await supabase
    .from('payments')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'completed')
    .gte('created_at', today.toISOString());

  // 오늘 매출
  const { data: todayRevenue } = await supabase
    .from('payments')
    .select('amount')
    .eq('status', 'completed')
    .gte('created_at', today.toISOString());

  const totalTodayRevenue = todayRevenue?.reduce((sum, p) => sum + p.amount, 0) || 0;

  // 전체 사용자 수
  const { count: totalUsers } = await supabase
    .from('users')
    .select('*', { count: 'exact', head: true });

  // 전체 프로젝트 수
  const { count: totalProjects } = await supabase
    .from('projects')
    .select('*', { count: 'exact', head: true });

  // 주간 데이터
  const weeklyData = [];
  for (let i = 6; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    date.setHours(0, 0, 0, 0);
    const nextDate = new Date(date);
    nextDate.setDate(nextDate.getDate() + 1);

    const { count: signups } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', date.toISOString())
      .lt('created_at', nextDate.toISOString());

    const { data: payments } = await supabase
      .from('payments')
      .select('amount')
      .eq('status', 'completed')
      .gte('created_at', date.toISOString())
      .lt('created_at', nextDate.toISOString());

    const revenue = payments?.reduce((sum, p) => sum + p.amount, 0) || 0;

    weeklyData.push({
      name: date.toLocaleDateString('ko-KR', { weekday: 'short' }),
      signups: signups || 0,
      revenue: Math.floor(revenue / 1000),
    });
  }

  // 최근 활동
  const recentActivities: RecentActivity[] = [];

  // 최근 가입
  const { data: recentUsers } = await supabase
    .from('users')
    .select('id, email, created_at')
    .order('created_at', { ascending: false })
    .limit(3);

  recentUsers?.forEach((user) => {
    recentActivities.push({
      id: `signup-${user.id}`,
      type: 'signup',
      description: '새로운 회원 가입',
      user: user.email,
      timestamp: user.created_at,
    });
  });

  // 최근 결제
  const { data: recentPayments } = await supabase
    .from('payments')
    .select('id, amount, credits_added, created_at, user_id')
    .eq('status', 'completed')
    .order('created_at', { ascending: false })
    .limit(3);

  for (const payment of recentPayments || []) {
    const { data: user } = await supabase
      .from('users')
      .select('email')
      .eq('id', payment.user_id)
      .single();

    recentActivities.push({
      id: `payment-${payment.id}`,
      type: 'payment',
      description: `${payment.credits_added}크레딧 구매 - ${payment.amount.toLocaleString()}원`,
      user: user?.email || 'Unknown',
      timestamp: payment.created_at,
    });
  }

  // 최근 프로젝트
  const { data: recentProjects } = await supabase
    .from('projects')
    .select('id, name, created_at, user_id')
    .order('created_at', { ascending: false })
    .limit(3);

  for (const project of recentProjects || []) {
    const { data: user } = await supabase
      .from('users')
      .select('email')
      .eq('id', project.user_id)
      .single();

    recentActivities.push({
      id: `project-${project.id}`,
      type: 'project',
      description: `프로젝트 생성: ${project.name}`,
      user: user?.email || 'Unknown',
      timestamp: project.created_at,
    });
  }

  // 시간순 정렬
  recentActivities.sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );

  return {
    todaySignups: todaySignups || 0,
    todayPayments: todayPayments || 0,
    todayRevenue: totalTodayRevenue,
    totalUsers: totalUsers || 0,
    totalProjects: totalProjects || 0,
    weeklyData,
    recentActivities: recentActivities.slice(0, 10),
  };
}

export const metadata = {
  title: '관리자 대시보드 | AI Video Maker',
};

export default async function AdminDashboardPage() {
  const stats = await getAdminStats();

  return (
    <div className="space-y-8">
      {/* 헤더 */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
          관리자 대시보드
        </h1>
        <p className="mt-1 text-gray-600 dark:text-gray-400">
          서비스 현황 및 통계를 확인하세요
        </p>
      </div>

      {/* 오늘의 통계 */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="오늘 가입"
          value={stats.todaySignups}
          description="신규 회원"
          icon={Users}
          trend={{ value: 12, label: '전일 대비' }}
        />
        <StatsCard
          title="오늘 결제"
          value={stats.todayPayments}
          description="완료된 결제"
          icon={CreditCard}
          trend={{ value: 8, label: '전일 대비' }}
        />
        <StatsCard
          title="오늘 매출"
          value={`${stats.todayRevenue.toLocaleString()}원`}
          description="총 매출"
          icon={Coins}
          trend={{ value: 15, label: '전일 대비' }}
        />
        <StatsCard
          title="총 프로젝트"
          value={stats.totalProjects}
          description={`총 ${stats.totalUsers}명의 사용자`}
          icon={Film}
        />
      </div>

      {/* 차트 */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Chart
          title="주간 가입자 현황"
          description="최근 7일간 신규 가입자 수"
          data={stats.weeklyData}
          type="bar"
          dataKeys={[{ key: 'signups', name: '가입자', color: '#f43f5e' }]}
        />
        <Chart
          title="주간 매출 현황"
          description="최근 7일간 매출 (천원)"
          data={stats.weeklyData}
          type="area"
          dataKeys={[{ key: 'revenue', name: '매출', color: '#10b981' }]}
        />
      </div>

      {/* 최근 활동 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            최근 활동
          </CardTitle>
          <CardDescription>
            최근 서비스 활동 내역
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Suspense fallback={<div>로딩 중...</div>}>
            <DataTable
              data={stats.recentActivities}
              columns={activityColumns}
              emptyMessage="최근 활동이 없습니다."
            />
          </Suspense>
        </CardContent>
      </Card>
    </div>
  );
}
