'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { CreditBalance } from './credit-balance';
import { LogoutButton } from '@/components/features/auth/logout-button';
import { Menu, Bell, Plus, User, Settings, CreditCard } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

interface HeaderProps {
  onMenuClick?: () => void;
}

export function Header({ onMenuClick }: HeaderProps) {
  const { user } = useAuth();

  const userInitials = user?.user_metadata?.full_name
    ? user.user_metadata.full_name
        .split(' ')
        .map((n: string) => n[0])
        .join('')
        .toUpperCase()
    : user?.email?.charAt(0).toUpperCase() || 'U';

  return (
    <header className="sticky top-0 z-40 flex h-16 shrink-0 items-center gap-x-4 border-b border-gray-200 bg-white/80 px-4 backdrop-blur-sm dark:border-gray-800 dark:bg-gray-950/80 sm:gap-x-6 sm:px-6 lg:px-8">
      {/* Mobile menu button */}
      <button
        type="button"
        className="-m-2.5 p-2.5 text-gray-700 lg:hidden dark:text-gray-300"
        onClick={onMenuClick}
      >
        <span className="sr-only">메뉴 열기</span>
        <Menu className="h-6 w-6" />
      </button>

      {/* Separator - mobile */}
      <div className="h-6 w-px bg-gray-200 lg:hidden dark:bg-gray-800" />

      {/* Search or spacer */}
      <div className="flex flex-1 gap-x-4 self-stretch lg:gap-x-6">
        <div className="flex flex-1" />

        {/* Right side items */}
        <div className="flex items-center gap-x-4 lg:gap-x-6">
          {/* New Project Button */}
          <Link href="/create">
            <Button
              size="sm"
              className="hidden bg-gradient-to-r from-rose-500 to-pink-500 hover:from-rose-600 hover:to-pink-600 sm:flex"
            >
              <Plus className="mr-1 h-4 w-4" />
              새 영상 만들기
            </Button>
            <Button
              size="icon"
              className="bg-gradient-to-r from-rose-500 to-pink-500 hover:from-rose-600 hover:to-pink-600 sm:hidden"
            >
              <Plus className="h-4 w-4" />
            </Button>
          </Link>

          {/* Credit Balance */}
          <CreditBalance credits={100} />

          {/* Notifications */}
          <button
            type="button"
            className="relative -m-2.5 p-2.5 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            <span className="sr-only">알림 보기</span>
            <Bell className="h-5 w-5" />
            {/* Notification badge */}
            <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-rose-500" />
          </button>

          {/* Separator */}
          <div className="hidden h-6 w-px bg-gray-200 lg:block dark:bg-gray-800" />

          {/* User Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="-m-1.5 flex items-center p-1.5">
                <span className="sr-only">사용자 메뉴 열기</span>
                <Avatar className="h-8 w-8">
                  <AvatarImage
                    src={user?.user_metadata?.avatar_url}
                    alt={user?.user_metadata?.full_name || '사용자'}
                  />
                  <AvatarFallback className="bg-gradient-to-br from-rose-400 to-pink-500 text-white text-sm">
                    {userInitials}
                  </AvatarFallback>
                </Avatar>
                <span className="hidden lg:flex lg:items-center">
                  <span className="ml-3 text-sm font-medium text-gray-700 dark:text-gray-200">
                    {user?.user_metadata?.full_name || user?.email?.split('@')[0]}
                  </span>
                </span>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none">
                    {user?.user_metadata?.full_name || '사용자'}
                  </p>
                  <p className="text-xs leading-none text-muted-foreground">
                    {user?.email}
                  </p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href="/settings" className="flex cursor-pointer items-center">
                  <User className="mr-2 h-4 w-4" />
                  프로필
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/credits" className="flex cursor-pointer items-center">
                  <CreditCard className="mr-2 h-4 w-4" />
                  크레딧 충전
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/settings" className="flex cursor-pointer items-center">
                  <Settings className="mr-2 h-4 w-4" />
                  설정
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <LogoutButton
                  variant="ghost"
                  className="w-full cursor-pointer justify-start px-2 py-1.5"
                />
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
