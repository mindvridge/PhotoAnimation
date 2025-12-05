import { SignupForm } from '@/components/features/auth';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '회원가입 | AI Video Maker',
  description: '새 계정을 만들어 AI Video Maker 서비스를 시작하세요.',
};

export default function SignupPage() {
  return <SignupForm />;
}
