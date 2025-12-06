/**
 * Seed Script for AI Video Maker
 * 개발 및 테스트용 시드 데이터 삽입 스크립트
 *
 * 실행 방법:
 * npx tsx scripts/seed.ts
 *
 * 환경 변수 필요:
 * - NEXT_PUBLIC_SUPABASE_URL
 * - SUPABASE_SERVICE_ROLE_KEY
 */

import { createClient } from '@supabase/supabase-js';

// 환경 변수 확인
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Error: Missing environment variables');
  console.error('Required: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

// Supabase Admin 클라이언트 생성
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

// 템플릿 시드 데이터
const templates = [
  {
    id: 'tmpl_romantic_wedding_001',
    name: '로맨틱 웨딩',
    slug: 'romantic-wedding',
    description:
      '사랑스러운 두 분의 결혼을 축하하는 로맨틱한 웨딩 영상입니다. 부드러운 전환 효과와 감성적인 배경음악이 어우러져 특별한 순간을 더욱 아름답게 담아냅니다.',
    category: 'wedding' as const,
    thumbnail_url: '/templates/romantic-wedding-thumb.jpg',
    preview_video_url: '/templates/romantic-wedding-preview.mp4',
    remotion_template_id: 'WeddingTemplate',
    duration_seconds: 60,
    max_photos: 10,
    is_premium: false,
    is_active: true,
  },
  {
    id: 'tmpl_first_birthday_001',
    name: '우리 아기 첫 생일',
    slug: 'first-birthday',
    description:
      '소중한 아기의 첫 번째 생일을 축하하는 귀여운 돌잔치 영상입니다. 밝고 경쾌한 분위기로 아기의 성장 과정을 담아보세요.',
    category: 'birthday' as const,
    thumbnail_url: '/templates/first-birthday-thumb.jpg',
    preview_video_url: '/templates/first-birthday-preview.mp4',
    remotion_template_id: 'BirthdayTemplate',
    duration_seconds: 45,
    max_photos: 8,
    is_premium: false,
    is_active: true,
  },
  {
    id: 'tmpl_seventieth_001',
    name: '감사의 마음',
    slug: 'seventieth-celebration',
    description:
      '부모님의 칠순을 축하하며 그동안의 감사한 마음을 전하는 영상입니다. 따뜻하고 품격 있는 디자인으로 특별한 날을 기념하세요.',
    category: 'anniversary' as const,
    thumbnail_url: '/templates/seventieth-celebration-thumb.jpg',
    preview_video_url: '/templates/seventieth-celebration-preview.mp4',
    remotion_template_id: 'SeventyTemplate',
    duration_seconds: 60,
    max_photos: 12,
    is_premium: true,
    is_active: true,
  },
  {
    id: 'tmpl_happy_birthday_001',
    name: '해피 버스데이',
    slug: 'happy-birthday',
    description:
      '생일을 축하하는 밝고 즐거운 영상입니다. 화려한 색상과 경쾌한 음악으로 특별한 생일 파티를 만들어보세요.',
    category: 'birthday' as const,
    thumbnail_url: '/templates/happy-birthday-thumb.jpg',
    preview_video_url: '/templates/happy-birthday-preview.mp4',
    remotion_template_id: 'BirthdayTemplate',
    duration_seconds: 30,
    max_photos: 6,
    is_premium: false,
    is_active: true,
  },
  {
    id: 'tmpl_eternal_memory_001',
    name: '영원한 기억',
    slug: 'eternal-memory',
    description:
      '소중한 분을 추모하며 아름다운 기억을 간직하는 영상입니다. 차분하고 경건한 분위기로 고인을 기리는 마음을 담아냅니다.',
    category: 'memorial' as const,
    thumbnail_url: '/templates/eternal-memory-thumb.jpg',
    preview_video_url: '/templates/eternal-memory-preview.mp4',
    remotion_template_id: 'WeddingTemplate',
    duration_seconds: 90,
    max_photos: 15,
    is_premium: true,
    is_active: true,
  },
];

// 배경음악 데이터 (public/music 폴더에 저장될 파일들)
const musicTracks = [
  {
    id: 'music_wedding_romantic',
    name: '로맨틱 웨딩',
    filename: 'wedding-romantic.mp3',
    duration: 180,
    category: 'wedding',
  },
  {
    id: 'music_birthday_happy',
    name: '해피 버스데이',
    filename: 'birthday-happy.mp3',
    duration: 120,
    category: 'birthday',
  },
  {
    id: 'music_anniversary_warm',
    name: '따뜻한 기억',
    filename: 'anniversary-warm.mp3',
    duration: 180,
    category: 'anniversary',
  },
  {
    id: 'music_memorial_peaceful',
    name: '평화로운 추억',
    filename: 'memorial-peaceful.mp3',
    duration: 240,
    category: 'memorial',
  },
];

/**
 * 템플릿 시드 삽입
 */
async function seedTemplates(): Promise<void> {
  console.log('Seeding templates...');

  for (const template of templates) {
    const { error } = await supabase.from('templates').upsert(template, {
      onConflict: 'id',
    });

    if (error) {
      console.error(`Error seeding template ${template.slug}:`, error.message);
    } else {
      console.log(`  ✓ Template: ${template.name} (${template.slug})`);
    }
  }

  console.log(`Seeded ${templates.length} templates`);
}

/**
 * 테스트 사용자 생성 (Auth + users 테이블)
 */
async function seedTestUsers(): Promise<void> {
  console.log('Seeding test users...');

  // 테스트 관리자 계정
  const adminEmail = 'admin@aivideomaker.io';
  const adminPassword = 'admin123!@#';

  try {
    // Auth 사용자 생성
    const { data: adminAuth, error: adminAuthError } =
      await supabase.auth.admin.createUser({
        email: adminEmail,
        password: adminPassword,
        email_confirm: true,
        user_metadata: { name: '관리자' },
      });

    if (adminAuthError && !adminAuthError.message.includes('already exists')) {
      console.error('Error creating admin auth user:', adminAuthError.message);
    } else if (adminAuth?.user) {
      // users 테이블에 추가 정보 업데이트
      const { error: userError } = await supabase
        .from('users')
        .upsert({
          id: adminAuth.user.id,
          email: adminEmail,
          name: '관리자',
          role: 'admin',
          subscription_tier: 'business',
          credits: 9999,
        }, { onConflict: 'id' });

      if (userError) {
        console.error('Error updating admin user data:', userError.message);
      } else {
        console.log(`  ✓ Admin: ${adminEmail}`);
      }
    }
  } catch (error) {
    console.log('  - Admin user may already exist');
  }

  // 테스트 일반 사용자 계정
  const userEmail = 'user@aivideomaker.io';
  const userPassword = 'user123!@#';

  try {
    const { data: userAuth, error: userAuthError } =
      await supabase.auth.admin.createUser({
        email: userEmail,
        password: userPassword,
        email_confirm: true,
        user_metadata: { name: '테스트 사용자' },
      });

    if (userAuthError && !userAuthError.message.includes('already exists')) {
      console.error('Error creating test user:', userAuthError.message);
    } else if (userAuth?.user) {
      const { error: userError } = await supabase
        .from('users')
        .upsert({
          id: userAuth.user.id,
          email: userEmail,
          name: '테스트 사용자',
          role: 'user',
          subscription_tier: 'free',
          credits: 50,
        }, { onConflict: 'id' });

      if (userError) {
        console.error('Error updating test user data:', userError.message);
      } else {
        console.log(`  ✓ User: ${userEmail}`);
      }
    }
  } catch (error) {
    console.log('  - Test user may already exist');
  }

  console.log('Test user credentials:');
  console.log(`  Admin: ${adminEmail} / ${adminPassword}`);
  console.log(`  User:  ${userEmail} / ${userPassword}`);
}

/**
 * 샘플 프로젝트 생성
 */
async function seedSampleProjects(): Promise<void> {
  console.log('Seeding sample projects...');

  // 테스트 사용자 조회
  const { data: testUser } = await supabase
    .from('users')
    .select('id')
    .eq('email', 'user@aivideomaker.io')
    .single();

  if (!testUser) {
    console.log('  - Skipping: Test user not found');
    return;
  }

  const projects = [
    {
      id: 'proj_sample_wedding_001',
      user_id: testUser.id,
      template_id: 'tmpl_romantic_wedding_001',
      name: '우리의 결혼식',
      status: 'draft' as const,
      settings: {
        texts: {
          title: '우리의 결혼식',
          subtitle: '2024년 3월 15일',
          credits: '감사합니다',
        },
        backgroundMusic: {
          name: 'Wedding March',
          volume: 0.5,
        },
        transitions: {
          type: 'fade',
          duration: 1,
        },
        resolution: '1080p',
        aspectRatio: '16:9',
      },
    },
    {
      id: 'proj_sample_birthday_001',
      user_id: testUser.id,
      template_id: 'tmpl_happy_birthday_001',
      name: '생일 축하해',
      status: 'draft' as const,
      settings: {
        texts: {
          title: '생일 축하해!',
          subtitle: '사랑하는 친구에게',
          credits: '항상 행복하세요',
        },
        backgroundMusic: {
          name: 'Happy Birthday',
          volume: 0.6,
        },
        transitions: {
          type: 'slide',
          duration: 0.8,
        },
        resolution: '1080p',
        aspectRatio: '16:9',
      },
    },
  ];

  for (const project of projects) {
    const { error } = await supabase.from('projects').upsert(project, {
      onConflict: 'id',
    });

    if (error) {
      console.error(`Error seeding project ${project.name}:`, error.message);
    } else {
      console.log(`  ✓ Project: ${project.name}`);
    }
  }
}

/**
 * 메인 시드 함수
 */
async function main(): Promise<void> {
  console.log('========================================');
  console.log('AI Video Maker - Seed Script');
  console.log('========================================\n');

  try {
    // 1. 템플릿 시드
    await seedTemplates();
    console.log('');

    // 2. 테스트 사용자 시드
    await seedTestUsers();
    console.log('');

    // 3. 샘플 프로젝트 시드
    await seedSampleProjects();
    console.log('');

    console.log('========================================');
    console.log('Seed completed successfully!');
    console.log('========================================');

    // 음악 트랙 정보 출력
    console.log('\nMusic tracks (place in public/music/):');
    musicTracks.forEach((track) => {
      console.log(`  - ${track.filename} (${track.name})`);
    });

    console.log('\nTemplate thumbnails (place in public/templates/):');
    templates.forEach((template) => {
      console.log(`  - ${template.thumbnail_url?.split('/').pop()}`);
    });
  } catch (error) {
    console.error('Seed failed:', error);
    process.exit(1);
  }
}

// 실행
main();
