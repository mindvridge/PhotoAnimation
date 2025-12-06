-- ============================================
-- AI Video Maker - Seed Data
-- ============================================
-- 이 파일을 Supabase SQL Editor에서 실행하세요.
-- 주의: 프로덕션 환경에서는 실행하지 마세요!

-- ============================================
-- 1. 템플릿 시드 데이터
-- ============================================

-- 기존 템플릿 삭제 (개발 환경용)
DELETE FROM templates WHERE slug IN (
  'romantic-wedding',
  'first-birthday',
  'seventieth-celebration',
  'happy-birthday',
  'eternal-memory'
);

-- 결혼식 템플릿 - 로맨틱 웨딩
INSERT INTO templates (
  id, name, slug, description, category,
  thumbnail_url, preview_video_url, remotion_template_id,
  duration_seconds, max_photos, is_premium, is_active
) VALUES (
  'tmpl_romantic_wedding_001',
  '로맨틱 웨딩',
  'romantic-wedding',
  '사랑스러운 두 분의 결혼을 축하하는 로맨틱한 웨딩 영상입니다. 부드러운 전환 효과와 감성적인 배경음악이 어우러져 특별한 순간을 더욱 아름답게 담아냅니다.',
  'wedding',
  '/templates/romantic-wedding-thumb.jpg',
  '/templates/romantic-wedding-preview.mp4',
  'WeddingTemplate',
  60,
  10,
  false,
  true
);

-- 돌잔치 템플릿 - 우리 아기 첫 생일
INSERT INTO templates (
  id, name, slug, description, category,
  thumbnail_url, preview_video_url, remotion_template_id,
  duration_seconds, max_photos, is_premium, is_active
) VALUES (
  'tmpl_first_birthday_001',
  '우리 아기 첫 생일',
  'first-birthday',
  '소중한 아기의 첫 번째 생일을 축하하는 귀여운 돌잔치 영상입니다. 밝고 경쾌한 분위기로 아기의 성장 과정을 담아보세요.',
  'birthday',
  '/templates/first-birthday-thumb.jpg',
  '/templates/first-birthday-preview.mp4',
  'BirthdayTemplate',
  45,
  8,
  false,
  true
);

-- 칠순잔치 템플릿 - 감사의 마음
INSERT INTO templates (
  id, name, slug, description, category,
  thumbnail_url, preview_video_url, remotion_template_id,
  duration_seconds, max_photos, is_premium, is_active
) VALUES (
  'tmpl_seventieth_001',
  '감사의 마음',
  'seventieth-celebration',
  '부모님의 칠순을 축하하며 그동안의 감사한 마음을 전하는 영상입니다. 따뜻하고 품격 있는 디자인으로 특별한 날을 기념하세요.',
  'anniversary',
  '/templates/seventieth-celebration-thumb.jpg',
  '/templates/seventieth-celebration-preview.mp4',
  'SeventyTemplate',
  60,
  12,
  true,
  true
);

-- 생일축하 템플릿 - 해피 버스데이
INSERT INTO templates (
  id, name, slug, description, category,
  thumbnail_url, preview_video_url, remotion_template_id,
  duration_seconds, max_photos, is_premium, is_active
) VALUES (
  'tmpl_happy_birthday_001',
  '해피 버스데이',
  'happy-birthday',
  '생일을 축하하는 밝고 즐거운 영상입니다. 화려한 색상과 경쾌한 음악으로 특별한 생일 파티를 만들어보세요.',
  'birthday',
  '/templates/happy-birthday-thumb.jpg',
  '/templates/happy-birthday-preview.mp4',
  'BirthdayTemplate',
  30,
  6,
  false,
  true
);

-- 추모영상 템플릿 - 영원한 기억
INSERT INTO templates (
  id, name, slug, description, category,
  thumbnail_url, preview_video_url, remotion_template_id,
  duration_seconds, max_photos, is_premium, is_active
) VALUES (
  'tmpl_eternal_memory_001',
  '영원한 기억',
  'eternal-memory',
  '소중한 분을 추모하며 아름다운 기억을 간직하는 영상입니다. 차분하고 경건한 분위기로 고인을 기리는 마음을 담아냅니다.',
  'memorial',
  '/templates/eternal-memory-thumb.jpg',
  '/templates/eternal-memory-preview.mp4',
  'WeddingTemplate',
  90,
  15,
  true,
  true
);

-- ============================================
-- 2. 테스트 사용자 계정
-- ============================================
-- 주의: Supabase Auth를 통해 생성된 사용자와 연동됩니다.
-- auth.users 테이블에 먼저 사용자가 생성되어야 합니다.

-- 테스트 관리자 계정 (auth.users에 존재해야 함)
-- 실제 환경에서는 Supabase Dashboard나 Auth API로 생성
/*
INSERT INTO users (
  id, email, name, role, subscription_tier, credits
) VALUES (
  'test_admin_001',
  'admin@aivideomaker.io',
  '관리자',
  'admin',
  'business',
  9999
) ON CONFLICT (id) DO UPDATE SET
  role = 'admin',
  subscription_tier = 'business',
  credits = 9999;
*/

-- 테스트 일반 사용자 계정 (auth.users에 존재해야 함)
/*
INSERT INTO users (
  id, email, name, role, subscription_tier, credits
) VALUES (
  'test_user_001',
  'user@aivideomaker.io',
  '테스트 사용자',
  'user',
  'free',
  10
) ON CONFLICT (id) DO UPDATE SET
  role = 'user',
  subscription_tier = 'free',
  credits = 10;
*/

-- ============================================
-- 3. 샘플 프로젝트 (테스트 사용자 필요)
-- ============================================
-- 주의: 위의 테스트 사용자가 먼저 생성되어야 합니다.

/*
-- 샘플 결혼식 프로젝트
INSERT INTO projects (
  id, user_id, template_id, name, status, settings
) VALUES (
  'proj_sample_wedding_001',
  'test_user_001',
  'tmpl_romantic_wedding_001',
  '우리의 결혼식',
  'draft',
  '{
    "texts": {
      "title": "우리의 결혼식",
      "subtitle": "2024년 3월 15일",
      "credits": "감사합니다"
    },
    "backgroundMusic": {
      "name": "Wedding March",
      "volume": 0.5
    },
    "transitions": {
      "type": "fade",
      "duration": 1
    },
    "resolution": "1080p",
    "aspectRatio": "16:9"
  }'::jsonb
);

-- 샘플 생일 프로젝트
INSERT INTO projects (
  id, user_id, template_id, name, status, settings
) VALUES (
  'proj_sample_birthday_001',
  'test_user_001',
  'tmpl_happy_birthday_001',
  '생일 축하해',
  'draft',
  '{
    "texts": {
      "title": "생일 축하해!",
      "subtitle": "사랑하는 친구에게",
      "credits": "항상 행복하세요"
    },
    "backgroundMusic": {
      "name": "Happy Birthday",
      "volume": 0.6
    },
    "transitions": {
      "type": "slide",
      "duration": 0.8
    },
    "resolution": "1080p",
    "aspectRatio": "16:9"
  }'::jsonb
);
*/

-- ============================================
-- 4. 초기 결제 패키지 정보 (참조용)
-- ============================================
-- 실제 결제 패키지는 코드에서 관리됩니다.
-- 이 데이터는 참조용으로만 사용하세요.

/*
크레딧 패키지:
- basic: 30 크레딧, 9,900원
- standard: 100 크레딧 + 10 보너스, 29,000원
- premium: 300 크레딧 + 50 보너스, 79,000원

구독 플랜:
- pro_monthly: 무제한, 49,000원/월
*/

-- ============================================
-- 시드 데이터 확인
-- ============================================
-- 삽입된 템플릿 확인
SELECT id, name, slug, category, is_premium, is_active
FROM templates
ORDER BY created_at;

-- 통계 확인
SELECT
  COUNT(*) as total_templates,
  COUNT(*) FILTER (WHERE is_premium = true) as premium_templates,
  COUNT(*) FILTER (WHERE is_active = true) as active_templates
FROM templates;
