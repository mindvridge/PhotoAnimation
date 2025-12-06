import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Home, ArrowLeft, Search } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-gray-50 to-gray-100 px-4 dark:from-gray-900 dark:to-gray-950">
      <div className="text-center">
        {/* 404 이미지/아이콘 */}
        <div className="mb-8">
          <div className="mx-auto flex h-32 w-32 items-center justify-center rounded-full bg-rose-100 dark:bg-rose-900/30">
            <Search className="h-16 w-16 text-rose-500" strokeWidth={1.5} />
          </div>
        </div>

        {/* 에러 코드 */}
        <h1 className="mb-2 text-6xl font-bold text-gray-900 dark:text-gray-100">
          404
        </h1>

        {/* 제목 */}
        <h2 className="mb-4 text-2xl font-semibold text-gray-800 dark:text-gray-200">
          페이지를 찾을 수 없습니다
        </h2>

        {/* 설명 */}
        <p className="mb-8 max-w-md text-gray-600 dark:text-gray-400">
          요청하신 페이지가 존재하지 않거나, 이동되었거나, 삭제되었을 수 있습니다.
          URL을 다시 확인해주세요.
        </p>

        {/* 버튼 그룹 */}
        <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Button asChild size="lg">
            <Link href="/">
              <Home className="mr-2 h-4 w-4" />
              홈으로 이동
            </Link>
          </Button>
          <Button asChild variant="outline" size="lg">
            <Link href="javascript:history.back()">
              <ArrowLeft className="mr-2 h-4 w-4" />
              이전 페이지
            </Link>
          </Button>
        </div>

        {/* 도움말 링크 */}
        <p className="mt-8 text-sm text-gray-500 dark:text-gray-500">
          문제가 계속되면{' '}
          <Link
            href="mailto:support@aivideomaker.io"
            className="text-rose-500 hover:underline"
          >
            고객센터
          </Link>
          로 문의해주세요.
        </p>
      </div>
    </div>
  );
}
