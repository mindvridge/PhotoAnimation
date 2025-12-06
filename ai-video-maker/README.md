# AI Video Maker

AI를 활용한 사진 애니메이션 영상 제작 서비스입니다. 사진에 생명을 불어넣어 감동적인 추모 영상, 결혼식 영상, 생일 영상 등을 손쉽게 만들 수 있습니다.

## 주요 기능

- **AI 사진 애니메이션**: Kling AI를 활용한 사진 생동감 부여
- **다양한 템플릿**: 결혼식, 칠순, 생일, 추모 등 다양한 상황별 템플릿
- **Remotion 기반 렌더링**: 고품질 영상 출력 (HD/Full HD)
- **크레딧 시스템**: TossPayments 기반 결제
- **관리자 대시보드**: 사용자, 결제, 영상 모니터링

## 기술 스택

- **프론트엔드**: Next.js 16, React 19, Tailwind CSS
- **백엔드**: Next.js API Routes, Supabase
- **데이터베이스**: Supabase (PostgreSQL)
- **인증**: Supabase Auth
- **영상 렌더링**: Remotion
- **AI 애니메이션**: Kling AI
- **결제**: TossPayments

## 시작하기

### 1. 저장소 클론

```bash
git clone https://github.com/your-org/ai-video-maker.git
cd ai-video-maker
```

### 2. 의존성 설치

```bash
npm install
```

### 3. 환경 변수 설정

`.env.local.example`을 `.env.local`로 복사하고 값을 설정합니다:

```bash
cp .env.local.example .env.local
```

필수 환경 변수:
- `NEXT_PUBLIC_SUPABASE_URL`: Supabase 프로젝트 URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Supabase Anonymous Key
- `SUPABASE_SERVICE_ROLE_KEY`: Supabase Service Role Key
- `NEXT_PUBLIC_TOSS_CLIENT_KEY`: TossPayments 클라이언트 키
- `TOSS_SECRET_KEY`: TossPayments 시크릿 키
- `KLING_API_KEY`: Kling AI API 키
- `NEXT_PUBLIC_APP_URL`: 앱 URL

### 4. 개발 서버 실행

```bash
npm run dev
```

[http://localhost:3000](http://localhost:3000)에서 확인할 수 있습니다.

### 5. 빌드 및 프로덕션 실행

```bash
npm run build
npm start
```

## 프로젝트 구조

```
src/
├── app/                    # Next.js App Router
│   ├── (auth)/            # 인증 관련 페이지
│   ├── (dashboard)/       # 대시보드 페이지
│   ├── (admin)/           # 관리자 페이지
│   └── api/               # API 라우트
├── components/
│   ├── features/          # 기능별 컴포넌트
│   │   ├── admin/         # 관리자 컴포넌트
│   │   ├── animate/       # 애니메이션 컴포넌트
│   │   ├── auth/          # 인증 컴포넌트
│   │   ├── create/        # 프로젝트 생성 컴포넌트
│   │   ├── dashboard/     # 대시보드 컴포넌트
│   │   ├── payment/       # 결제 컴포넌트
│   │   ├── preview/       # 미리보기 컴포넌트
│   │   └── upload/        # 업로드 컴포넌트
│   ├── providers/         # Context Providers
│   └── ui/                # UI 컴포넌트 (shadcn/ui)
├── hooks/                 # 커스텀 훅
├── lib/                   # 유틸리티 및 API 클라이언트
│   ├── api/              # API 헬퍼
│   ├── queue/            # 작업 큐
│   ├── remotion/         # Remotion 설정
│   └── supabase/         # Supabase 클라이언트
├── remotion/             # Remotion 템플릿
│   ├── components/       # 영상 컴포넌트
│   └── compositions/     # 영상 구성
└── types/                # TypeScript 타입 정의
```

## 주요 페이지

| 경로 | 설명 |
|------|------|
| `/` | 랜딩 페이지 |
| `/login`, `/signup` | 로그인/회원가입 |
| `/dashboard` | 대시보드 |
| `/create` | 프로젝트 생성 |
| `/templates` | 템플릿 선택 |
| `/projects` | 내 프로젝트 목록 |
| `/pricing` | 요금제 |
| `/admin` | 관리자 대시보드 |

## API 엔드포인트

### 프로젝트
- `GET /api/projects` - 프로젝트 목록
- `POST /api/projects` - 프로젝트 생성
- `GET /api/projects/[id]` - 프로젝트 상세
- `PATCH /api/projects/[id]` - 프로젝트 수정
- `DELETE /api/projects/[id]` - 프로젝트 삭제

### 사진
- `GET /api/photos` - 사진 목록
- `POST /api/photos` - 사진 업로드
- `DELETE /api/photos/[id]` - 사진 삭제

### 애니메이션
- `POST /api/animations` - 애니메이션 생성 요청
- `GET /api/animations/[id]/status` - 애니메이션 상태 확인

### 렌더링
- `POST /api/render` - 렌더링 요청
- `GET /api/render/[id]/status` - 렌더링 상태 확인

### 결제
- `POST /api/payments/request` - 결제 요청
- `POST /api/payments/confirm` - 결제 승인
- `POST /api/payments/webhook` - 웹훅

## Vercel 배포

1. [Vercel](https://vercel.com)에 프로젝트 연결
2. 환경 변수 설정 (Settings > Environment Variables)
3. 배포 트리거

필수 환경 변수 설정:
```
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
NEXT_PUBLIC_TOSS_CLIENT_KEY
TOSS_SECRET_KEY
KLING_API_KEY
NEXT_PUBLIC_APP_URL
```

## Supabase 설정

1. [Supabase](https://supabase.com)에서 프로젝트 생성
2. `supabase/migrations` 폴더의 SQL 마이그레이션 실행
3. Storage 버킷 생성: `photos`, `videos`
4. RLS 정책 설정

## 보안 체크리스트

- [x] Supabase RLS 정책 적용
- [x] API Rate Limiting
- [x] 입력 유효성 검사
- [x] 인증/인가 체크
- [x] 환경 변수 분리
- [ ] CORS 설정 (필요시)
- [ ] CSP 헤더 설정 (필요시)

## 프로덕션 체크리스트

- [ ] 모든 환경변수 설정
- [ ] Supabase 프로덕션 프로젝트 설정
- [ ] 도메인 연결
- [ ] SSL 인증서 확인
- [ ] TossPayments 라이브 모드 전환
- [ ] 에러 모니터링 설정 (Sentry 등)
- [ ] 백업 전략 수립
- [ ] 로그 수집 설정

## 개발 가이드

### 코드 스타일
- ESLint + Prettier 사용
- TypeScript strict mode

### 커밋 컨벤션
- `feat:` 새로운 기능
- `fix:` 버그 수정
- `docs:` 문서 수정
- `style:` 코드 포맷팅
- `refactor:` 리팩토링
- `test:` 테스트 추가
- `chore:` 기타 작업

## 라이선스

MIT License

## 문의

- 이메일: support@aivideomaker.io
- 이슈: [GitHub Issues](https://github.com/your-org/ai-video-maker/issues)
