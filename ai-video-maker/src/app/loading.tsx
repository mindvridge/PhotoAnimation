import { Loader2 } from 'lucide-react';

export default function Loading() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-950">
      <div className="text-center">
        {/* 로딩 스피너 */}
        <div className="mb-6">
          <Loader2 className="mx-auto h-12 w-12 animate-spin text-rose-500" />
        </div>

        {/* 로딩 텍스트 */}
        <p className="text-lg font-medium text-gray-600 dark:text-gray-400">
          로딩 중...
        </p>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-500">
          잠시만 기다려주세요
        </p>
      </div>
    </div>
  );
}
