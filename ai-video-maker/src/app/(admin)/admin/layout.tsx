import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { AdminSidebar } from '@/components/features/admin/admin-sidebar';

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();

  // 인증 확인
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    redirect('/login?redirect=/admin');
  }

  // 관리자 권한 확인
  const { data: userData, error: userError } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single();

  if (userError || !userData || userData.role !== 'admin') {
    redirect('/dashboard?error=unauthorized');
  }

  return (
    <div className="flex min-h-screen">
      {/* 사이드바 */}
      <AdminSidebar />

      {/* 메인 콘텐츠 */}
      <main className="flex-1 bg-gray-50 dark:bg-gray-900">
        <div className="p-6 lg:p-8">
          {children}
        </div>
      </main>
    </div>
  );
}
