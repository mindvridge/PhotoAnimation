import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { withAuth, type ApiContext } from '@/lib/api-handler';
import { ValidationError, NotFoundError } from '@/lib/errors';
import { logEvent } from '@/lib/logger';

// GET: 프로젝트 목록 조회
export const GET = withAuth(async (_request: NextRequest, ctx: ApiContext) => {
  const supabase = await createClient();
  const userId = ctx.userId!; // withAuth가 인증을 보장함

  const { data, error } = await supabase
    .from('projects')
    .select(`
      *,
      templates (
        id,
        name,
        thumbnail_url,
        category
      )
    `)
    .eq('user_id', userId)
    .order('updated_at', { ascending: false });

  if (error) {
    throw new Error('프로젝트 목록을 불러오는데 실패했습니다.');
  }

  return NextResponse.json({ data });
});

// POST: 새 프로젝트 생성
export const POST = withAuth(async (request: NextRequest, ctx: ApiContext) => {
  const supabase = await createClient();
  const userId = ctx.userId!; // withAuth가 인증을 보장함

  const body = await request.json();
  const { templateId, name } = body;

  if (!templateId) {
    throw new ValidationError('템플릿을 선택해주세요.');
  }

  // Verify template exists
  const { data: template, error: templateError } = await supabase
    .from('templates')
    .select('id, name, is_premium')
    .eq('id', templateId)
    .single();

  if (templateError || !template) {
    throw new NotFoundError('템플릿을 찾을 수 없습니다.');
  }

  // Check user credits (premium templates cost 2 credits, regular cost 1)
  const creditCost = template.is_premium ? 2 : 1;

  const { data: userProfile, error: profileError } = await supabase
    .from('users')
    .select('credits')
    .eq('id', userId)
    .single();

  if (profileError) {
    throw new Error('사용자 정보를 불러오는데 실패했습니다.');
  }

  if ((userProfile?.credits || 0) < creditCost) {
    throw new ValidationError('크레딧이 부족합니다.');
  }

  // Create project
  const projectName = name || `내 ${template.name} 영상 - ${new Date().toLocaleDateString('ko-KR')}`;

  const { data, error } = await supabase
    .from('projects')
    .insert({
      user_id: userId,
      template_id: templateId,
      name: projectName,
      status: 'draft',
    })
    .select(`
      *,
      templates (
        id,
        name,
        thumbnail_url,
        category
      )
    `)
    .single();

  if (error) {
    throw new Error('프로젝트 생성에 실패했습니다.');
  }

  // 비즈니스 이벤트 로깅
  logEvent('project_created', {
    projectId: data.id,
    templateId,
    templateName: template.name,
    isPremium: template.is_premium,
  }, userId);

  return NextResponse.json({ data }, { status: 201 });
});
