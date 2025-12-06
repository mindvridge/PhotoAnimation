import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { PricingCard } from '@/components/features/payment';
import { CREDIT_PACKAGES, SUBSCRIPTION_PLANS, CREDIT_COSTS } from '@/lib/tosspayments';
import { Coins, Infinity, HelpCircle, Image, Film, Sparkles } from 'lucide-react';

export const metadata = {
  title: '요금제 | AI Video Maker',
  description: '크레딧 패키지 및 구독 플랜을 확인하세요.',
};

export default function PricingPage() {
  return (
    <div className="container mx-auto max-w-6xl px-4 py-8">
      {/* 헤더 */}
      <div className="mb-12 text-center">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 sm:text-4xl">
          요금제 선택
        </h1>
        <p className="mt-4 text-lg text-gray-600 dark:text-gray-400">
          필요에 맞는 크레딧 패키지 또는 구독 플랜을 선택하세요
        </p>
      </div>

      {/* 탭: 크레딧 패키지 / 구독 */}
      <Tabs defaultValue="packages" className="space-y-8">
        <TabsList className="grid w-full max-w-md mx-auto grid-cols-2">
          <TabsTrigger value="packages" className="flex items-center gap-2">
            <Coins className="h-4 w-4" />
            크레딧 패키지
          </TabsTrigger>
          <TabsTrigger value="subscription" className="flex items-center gap-2">
            <Infinity className="h-4 w-4" />
            구독 플랜
          </TabsTrigger>
        </TabsList>

        {/* 크레딧 패키지 */}
        <TabsContent value="packages">
          <div className="grid gap-6 md:grid-cols-3">
            {CREDIT_PACKAGES.map((pkg) => (
              <PricingCard
                key={pkg.id}
                id={pkg.id}
                name={pkg.name}
                price={pkg.price}
                credits={pkg.credits}
                bonus={'bonus' in pkg ? pkg.bonus : undefined}
                description={pkg.description}
                features={pkg.features}
                popular={pkg.popular}
                type="package"
              />
            ))}
          </div>
        </TabsContent>

        {/* 구독 플랜 */}
        <TabsContent value="subscription">
          <div className="mx-auto max-w-md">
            {SUBSCRIPTION_PLANS.map((plan) => (
              <PricingCard
                key={plan.id}
                id={plan.id}
                name={plan.name}
                price={plan.price}
                credits={0}
                description={plan.description}
                features={plan.features}
                popular={plan.popular}
                interval={plan.interval}
                type="subscription"
              />
            ))}
          </div>
        </TabsContent>
      </Tabs>

      {/* 크레딧 사용 안내 */}
      <div className="mt-16">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <HelpCircle className="h-5 w-5" />
              크레딧 사용 안내
            </CardTitle>
            <CardDescription>
              크레딧은 다음과 같이 사용됩니다
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-6 sm:grid-cols-3">
              {/* AI 애니메이션 */}
              <div className="flex items-start gap-4 rounded-lg border p-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-purple-100 dark:bg-purple-900/50">
                  <Sparkles className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                </div>
                <div>
                  <h3 className="font-medium text-gray-900 dark:text-gray-100">
                    AI 애니메이션
                  </h3>
                  <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                    사진 1장당 {CREDIT_COSTS.AI_ANIMATION} 크레딧
                  </p>
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-500">
                    정지 이미지를 움직이는 영상으로 변환
                  </p>
                </div>
              </div>

              {/* HD 렌더링 */}
              <div className="flex items-start gap-4 rounded-lg border p-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/50">
                  <Film className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <h3 className="font-medium text-gray-900 dark:text-gray-100">
                    HD 렌더링
                  </h3>
                  <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                    무료 (포함)
                  </p>
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-500">
                    720p 해상도 영상 생성
                  </p>
                </div>
              </div>

              {/* Full HD 렌더링 */}
              <div className="flex items-start gap-4 rounded-lg border p-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-rose-100 dark:bg-rose-900/50">
                  <Image className="h-5 w-5 text-rose-600 dark:text-rose-400" />
                </div>
                <div>
                  <h3 className="font-medium text-gray-900 dark:text-gray-100">
                    Full HD 렌더링
                  </h3>
                  <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                    추가 {CREDIT_COSTS.FULL_HD_RENDER} 크레딧
                  </p>
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-500">
                    1080p 고화질 영상 생성
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* FAQ */}
      <div className="mt-12">
        <h2 className="mb-6 text-center text-2xl font-bold text-gray-900 dark:text-gray-100">
          자주 묻는 질문
        </h2>
        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">크레딧 유효기간이 있나요?</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                구매한 크레딧은 1년간 유효합니다. 보너스 크레딧은 6개월간 유효합니다.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">환불이 가능한가요?</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                미사용 크레딧에 대해 구매 후 7일 이내 환불 요청이 가능합니다.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">구독 해지는 어떻게 하나요?</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                설정 페이지에서 언제든지 구독을 해지할 수 있으며, 결제 기간 종료 시까지 서비스를 이용할 수 있습니다.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">결제 수단은 무엇이 있나요?</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                신용/체크카드, 계좌이체, 카카오페이, 네이버페이, 토스 등 다양한 결제 수단을 지원합니다.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
