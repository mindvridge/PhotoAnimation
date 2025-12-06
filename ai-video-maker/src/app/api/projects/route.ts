import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// GET: 프로젝트 목록 조회
export async function GET() {
  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: '로그인이 필요합니다.' },
        { status: 401 }
      );
    }

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
      .eq('user_id', user.id)
      .order('updated_at', { ascending: false });

    if (error) {
      console.error('Get projects error:', error);
      return NextResponse.json(
        { error: '프로젝트 목록을 불러오는데 실패했습니다.' },
        { status: 500 }
      );
    }

    return NextResponse.json({ data });
  } catch (error) {
    console.error('Projects API error:', error);
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

// POST: 새 프로젝트 생성
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: '로그인이 필요합니다.' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { templateId, name } = body;

    if (!templateId) {
      return NextResponse.json(
        { error: '템플릿을 선택해주세요.' },
        { status: 400 }
      );
    }

    // Verify template exists
    const { data: template, error: templateError } = await supabase
      .from('templates')
      .select('id, name, is_premium')
      .eq('id', templateId)
      .single();

    if (templateError || !template) {
      return NextResponse.json(
        { error: '템플릿을 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    // Check user credits (premium templates cost 2 credits, regular cost 1)
    const creditCost = template.is_premium ? 2 : 1;

    const { data: userProfile, error: profileError } = await supabase
      .from('users')
      .select('credits')
      .eq('id', user.id)
      .single();

    if (profileError) {
      console.error('Get profile error:', profileError);
      return NextResponse.json(
        { error: '사용자 정보를 불러오는데 실패했습니다.' },
        { status: 500 }
      );
    }

    if ((userProfile?.credits || 0) < creditCost) {
      return NextResponse.json(
        { error: '크레딧이 부족합니다.' },
        { status: 400 }
      );
    }

    // Create project
    const projectName = name || `내 ${template.name} 영상 - ${new Date().toLocaleDateString('ko-KR')}`;

    const { data, error } = await supabase
      .from('projects')
      .insert({
        user_id: user.id,
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
      console.error('Create project error:', error);
      return NextResponse.json(
        { error: '프로젝트 생성에 실패했습니다.' },
        { status: 500 }
      );
    }

    return NextResponse.json({ data }, { status: 201 });
  } catch (error) {
    console.error('Projects API error:', error);
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
