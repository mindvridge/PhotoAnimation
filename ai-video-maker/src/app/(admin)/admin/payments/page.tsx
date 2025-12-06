'use client';

import React, { useState, useEffect } from 'react';
import { DataTable, StatsCard, Chart, type Column } from '@/components/features/admin';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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
import {
  CreditCard,
  DollarSign,
  TrendingUp,
  RefreshCcw,
  AlertCircle,
} from 'lucide-react';
import type { Payment, PaymentStatus } from '@/types/database';

interface PaymentWithUser extends Payment {
  user_email?: string;
}

const statusConfig: Record<PaymentStatus, { label: string; color: string }> = {
  pending: { label: '대기', color: 'bg-yellow-100 text-yellow-700' },
  completed: { label: '완료', color: 'bg-green-100 text-green-700' },
  failed: { label: '실패', color: 'bg-red-100 text-red-700' },
  refunded: { label: '환불', color: 'bg-gray-100 text-gray-700' },
};

const paymentColumns: Column<PaymentWithUser>[] = [
  {
    key: 'id',
    header: '결제 ID',
    cell: (payment) => (
      <div>
        <div className="font-mono text-sm">{payment.id.slice(0, 8)}...</div>
        <div className="text-xs text-gray-500">{payment.user_email}</div>
      </div>
    ),
  },
  {
    key: 'credits_added',
    header: '크레딧',
    cell: (payment) => `${payment.credits_added}크레딧`,
  },
  {
    key: 'amount',
    header: '금액',
    cell: (payment) => `${payment.amount.toLocaleString()}원`,
  },
  {
    key: 'payment_method',
    header: '결제수단',
    cell: (payment) => payment.payment_method || '-',
  },
  {
    key: 'status',
    header: '상태',
    cell: (payment) => {
      const config = statusConfig[payment.status];
      return (
        <Badge variant="secondary" className={config.color}>
          {config.label}
        </Badge>
      );
    },
  },
  {
    key: 'currency',
    header: '통화',
    cell: (payment) => payment.currency,
  },
  {
    key: 'created_at',
    header: '결제일시',
    cell: (payment) => new Date(payment.created_at).toLocaleString('ko-KR'),
  },
];

export default function AdminPaymentsPage() {
  const [payments, setPayments] = useState<PaymentWithUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState({
    totalRevenue: 0,
    monthlyRevenue: 0,
    totalPayments: 0,
    refundedAmount: 0,
  });
  const [monthlyData, setMonthlyData] = useState<{ name: string; revenue: number }[]>([]);
  const [selectedPayment, setSelectedPayment] = useState<PaymentWithUser | null>(null);
  const [isRefundDialogOpen, setIsRefundDialogOpen] = useState(false);
  const [refundReason, setRefundReason] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  // 결제 목록 및 통계 조회
  const fetchPayments = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/admin/payments');
      const data = await response.json();

      if (data.success) {
        setPayments(data.data.payments);
        setStats(data.data.stats);
        setMonthlyData(data.data.monthlyData);
      }
    } catch (error) {
      console.error('Failed to fetch payments:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPayments();
  }, []);

  // 환불 처리
  const handleRefund = async () => {
    if (!selectedPayment || !refundReason) return;

    try {
      setIsProcessing(true);
      const response = await fetch(`/api/admin/payments/${selectedPayment.id}/refund`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: refundReason }),
      });

      if (response.ok) {
        await fetchPayments();
        setIsRefundDialogOpen(false);
        setRefundReason('');
      }
    } catch (error) {
      console.error('Failed to process refund:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  // 환불 다이얼로그 열기
  const openRefundDialog = (payment: PaymentWithUser) => {
    setSelectedPayment(payment);
    setIsRefundDialogOpen(true);
  };

  const columnsWithActions: Column<PaymentWithUser>[] = [
    ...paymentColumns,
    {
      key: 'actions',
      header: '',
      cell: (payment) => (
        <div className="flex items-center gap-2">
          {payment.status === 'completed' && (
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                openRefundDialog(payment);
              }}
            >
              <RefreshCcw className="h-4 w-4" />
              환불
            </Button>
          )}
        </div>
      ),
      className: 'w-32',
    },
  ];

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
          결제 관리
        </h1>
        <p className="mt-1 text-gray-600 dark:text-gray-400">
          결제 내역 및 매출을 관리합니다
        </p>
      </div>

      {/* 통계 카드 */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="총 매출"
          value={`${stats.totalRevenue.toLocaleString()}원`}
          icon={DollarSign}
        />
        <StatsCard
          title="이번 달 매출"
          value={`${stats.monthlyRevenue.toLocaleString()}원`}
          icon={TrendingUp}
          trend={{ value: 12, label: '전월 대비' }}
        />
        <StatsCard
          title="총 결제 건수"
          value={stats.totalPayments}
          icon={CreditCard}
        />
        <StatsCard
          title="환불 금액"
          value={`${stats.refundedAmount.toLocaleString()}원`}
          icon={RefreshCcw}
        />
      </div>

      {/* 월별 매출 차트 */}
      <Chart
        title="월별 매출 현황"
        description="최근 6개월 매출 추이"
        data={monthlyData}
        type="bar"
        dataKeys={[{ key: 'revenue', name: '매출 (만원)', color: '#10b981' }]}
        height={250}
      />

      {/* 결제 내역 테이블 */}
      <Card>
        <CardHeader>
          <CardTitle>결제 내역</CardTitle>
          <CardDescription>총 {payments.length}건의 결제</CardDescription>
        </CardHeader>
        <CardContent>
          <DataTable
            data={payments}
            columns={columnsWithActions}
            searchable
            searchPlaceholder="결제 ID 검색..."
            searchKey="id"
            isLoading={isLoading}
            emptyMessage="결제 내역이 없습니다."
          />
        </CardContent>
      </Card>

      {/* 환불 다이얼로그 */}
      <Dialog open={isRefundDialogOpen} onOpenChange={setIsRefundDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>환불 처리</DialogTitle>
            <DialogDescription>
              {selectedPayment?.credits_added}크레딧 - {selectedPayment?.amount.toLocaleString()}원
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="flex items-start gap-2 rounded-lg bg-amber-50 p-3 dark:bg-amber-950/30">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
              <div className="text-sm text-amber-700 dark:text-amber-300">
                <p className="font-medium">주의</p>
                <p>환불 처리 시 결제 금액이 고객에게 반환되고, 추가된 크레딧이 차감됩니다.</p>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="reason">환불 사유</Label>
              <Input
                id="reason"
                value={refundReason}
                onChange={(e) => setRefundReason(e.target.value)}
                placeholder="환불 사유를 입력하세요"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsRefundDialogOpen(false)}>
              취소
            </Button>
            <Button
              variant="destructive"
              onClick={handleRefund}
              disabled={isProcessing || !refundReason}
            >
              {isProcessing ? '처리 중...' : '환불 처리'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
