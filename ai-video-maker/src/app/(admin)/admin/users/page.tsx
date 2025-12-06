'use client';

import React, { useState, useEffect } from 'react';
import { DataTable, type Column } from '@/components/features/admin';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Users, Coins, Crown, AlertCircle } from 'lucide-react';
import type { User, UserRole, SubscriptionTier } from '@/types/database';

interface UserWithStats extends User {
  projectCount?: number;
  paymentCount?: number;
}

const userColumns: Column<UserWithStats>[] = [
  {
    key: 'email',
    header: '이메일',
    cell: (user) => (
      <div>
        <div className="font-medium">{user.email}</div>
        <div className="text-xs text-gray-500">{user.name || '-'}</div>
      </div>
    ),
  },
  {
    key: 'role',
    header: '역할',
    cell: (user) => (
      <Badge
        variant={user.role === 'admin' ? 'default' : 'secondary'}
        className={user.role === 'admin' ? 'bg-rose-600' : ''}
      >
        {user.role === 'admin' ? '관리자' : '사용자'}
      </Badge>
    ),
  },
  {
    key: 'subscription_tier',
    header: '구독',
    cell: (user) => {
      const tierConfig: Record<SubscriptionTier, { label: string; color: string }> = {
        free: { label: 'Free', color: 'bg-gray-100 text-gray-700' },
        basic: { label: 'Basic', color: 'bg-blue-100 text-blue-700' },
        pro: { label: 'Pro', color: 'bg-purple-100 text-purple-700' },
        business: { label: 'Business', color: 'bg-amber-100 text-amber-700' },
      };
      const config = tierConfig[user.subscription_tier];
      return (
        <Badge variant="secondary" className={config.color}>
          {config.label}
        </Badge>
      );
    },
  },
  {
    key: 'credits',
    header: '크레딧',
    cell: (user) => (
      <div className="flex items-center gap-1">
        <Coins className="h-4 w-4 text-amber-500" />
        <span>{user.credits}</span>
      </div>
    ),
  },
  {
    key: 'created_at',
    header: '가입일',
    cell: (user) => new Date(user.created_at).toLocaleDateString('ko-KR'),
  },
];

export default function AdminUsersPage() {
  const [users, setUsers] = useState<UserWithStats[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState<UserWithStats | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editCredits, setEditCredits] = useState('');
  const [editRole, setEditRole] = useState<UserRole>('user');
  const [editSubscription, setEditSubscription] = useState<SubscriptionTier>('free');
  const [isSaving, setIsSaving] = useState(false);

  // 사용자 목록 조회
  const fetchUsers = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/admin/users');
      const data = await response.json();
      if (data.success) {
        setUsers(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch users:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  // 사용자 편집 다이얼로그 열기
  const handleEditUser = (user: UserWithStats) => {
    setSelectedUser(user);
    setEditCredits(String(user.credits));
    setEditRole(user.role);
    setEditSubscription(user.subscription_tier);
    setIsEditDialogOpen(true);
  };

  // 사용자 정보 저장
  const handleSaveUser = async () => {
    if (!selectedUser) return;

    try {
      setIsSaving(true);
      const response = await fetch(`/api/admin/users/${selectedUser.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          credits: parseInt(editCredits),
          role: editRole,
          subscription_tier: editSubscription,
        }),
      });

      if (response.ok) {
        await fetchUsers();
        setIsEditDialogOpen(false);
      }
    } catch (error) {
      console.error('Failed to update user:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const columnsWithActions: Column<UserWithStats>[] = [
    ...userColumns,
    {
      key: 'actions',
      header: '',
      cell: (user) => (
        <Button
          variant="ghost"
          size="sm"
          onClick={(e) => {
            e.stopPropagation();
            handleEditUser(user);
          }}
        >
          편집
        </Button>
      ),
      className: 'w-20',
    },
  ];

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            사용자 관리
          </h1>
          <p className="mt-1 text-gray-600 dark:text-gray-400">
            등록된 사용자를 관리합니다
          </p>
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <Users className="h-4 w-4" />
          총 {users.length}명
        </div>
      </div>

      {/* 사용자 테이블 */}
      <Card>
        <CardHeader>
          <CardTitle>사용자 목록</CardTitle>
          <CardDescription>이메일로 검색하거나 사용자를 편집할 수 있습니다</CardDescription>
        </CardHeader>
        <CardContent>
          <DataTable
            data={users}
            columns={columnsWithActions}
            searchable
            searchPlaceholder="이메일 검색..."
            searchKey="email"
            isLoading={isLoading}
            emptyMessage="사용자가 없습니다."
          />
        </CardContent>
      </Card>

      {/* 사용자 편집 다이얼로그 */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>사용자 편집</DialogTitle>
            <DialogDescription>
              {selectedUser?.email}의 정보를 수정합니다
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* 크레딧 */}
            <div className="space-y-2">
              <Label htmlFor="credits">크레딧</Label>
              <div className="flex items-center gap-2">
                <Coins className="h-4 w-4 text-amber-500" />
                <Input
                  id="credits"
                  type="number"
                  value={editCredits}
                  onChange={(e) => setEditCredits(e.target.value)}
                  min={0}
                />
              </div>
            </div>

            {/* 역할 */}
            <div className="space-y-2">
              <Label htmlFor="role">역할</Label>
              <Select value={editRole} onValueChange={(v) => setEditRole(v as UserRole)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="user">사용자</SelectItem>
                  <SelectItem value="admin">관리자</SelectItem>
                </SelectContent>
              </Select>
              {editRole === 'admin' && (
                <p className="flex items-center gap-1 text-xs text-amber-600">
                  <AlertCircle className="h-3 w-3" />
                  관리자 권한은 신중하게 부여해주세요
                </p>
              )}
            </div>

            {/* 구독 */}
            <div className="space-y-2">
              <Label htmlFor="subscription">구독 등급</Label>
              <Select
                value={editSubscription}
                onValueChange={(v) => setEditSubscription(v as SubscriptionTier)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="free">Free</SelectItem>
                  <SelectItem value="basic">Basic</SelectItem>
                  <SelectItem value="pro">Pro</SelectItem>
                  <SelectItem value="business">Business</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              취소
            </Button>
            <Button onClick={handleSaveUser} disabled={isSaving}>
              {isSaving ? '저장 중...' : '저장'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
