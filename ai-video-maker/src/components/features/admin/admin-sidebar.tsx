'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  Users,
  FileVideo,
  CreditCard,
  Film,
  Settings,
  ArrowLeft,
  Shield,
} from 'lucide-react';

const navigation = [
  { name: '대시보드', href: '/admin', icon: LayoutDashboard },
  { name: '사용자 관리', href: '/admin/users', icon: Users },
  { name: '템플릿 관리', href: '/admin/templates', icon: Film },
  { name: '결제 관리', href: '/admin/payments', icon: CreditCard },
  { name: '영상 모니터링', href: '/admin/videos', icon: FileVideo },
];

export function AdminSidebar() {
  const pathname = usePathname();

  return (
    <aside className="flex w-64 flex-col border-r border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-950">
      {/* 헤더 */}
      <div className="flex h-16 items-center gap-2 border-b border-gray-200 px-6 dark:border-gray-800">
        <Shield className="h-6 w-6 text-rose-600" />
        <span className="font-bold text-gray-900 dark:text-gray-100">
          관리자
        </span>
      </div>

      {/* 네비게이션 */}
      <nav className="flex-1 space-y-1 p-4">
        {navigation.map((item) => {
          const isActive =
            pathname === item.href ||
            (item.href !== '/admin' && pathname.startsWith(item.href));

          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-rose-50 text-rose-700 dark:bg-rose-950/50 dark:text-rose-400'
                  : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800'
              )}
            >
              <item.icon className="h-5 w-5" />
              {item.name}
            </Link>
          );
        })}
      </nav>

      {/* 푸터 */}
      <div className="border-t border-gray-200 p-4 dark:border-gray-800">
        <Link
          href="/dashboard"
          className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
        >
          <ArrowLeft className="h-5 w-5" />
          사용자 대시보드로
        </Link>
      </div>
    </aside>
  );
}

export default AdminSidebar;
