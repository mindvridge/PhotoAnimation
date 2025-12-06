import { createClient } from '@/lib/supabase/client';
import type { Database } from '@/types/database';

type Project = Database['public']['Tables']['projects']['Row'];
type ProjectInsert = Database['public']['Tables']['projects']['Insert'];
type ProjectUpdate = Database['public']['Tables']['projects']['Update'];

export interface CreateProjectInput {
  templateId: string;
  name: string;
}

export interface UpdateProjectInput {
  name?: string;
  status?: 'draft' | 'processing' | 'completed' | 'failed';
  settings?: {
    backgroundMusic?: {
      url: string;
      name: string;
      volume: number;
    };
    texts?: {
      title?: string;
      subtitle?: string;
      credits?: string;
    };
  };
}

function getSupabase() {
  return createClient();
}

export async function createProject(input: CreateProjectInput): Promise<Project> {
  const supabase = getSupabase();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('로그인이 필요합니다.');
  }

  const { data, error } = await supabase
    .from('projects')
    .insert({
      user_id: user.id,
      template_id: input.templateId,
      name: input.name,
      status: 'draft',
    } as ProjectInsert)
    .select()
    .single();

  if (error) {
    console.error('Create project error:', error);
    throw new Error('프로젝트 생성에 실패했습니다.');
  }

  return data;
}

export async function getProjects(): Promise<Project[]> {
  const supabase = getSupabase();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('로그인이 필요합니다.');
  }

  const { data, error } = await supabase
    .from('projects')
    .select('*')
    .eq('user_id', user.id)
    .order('updated_at', { ascending: false });

  if (error) {
    console.error('Get projects error:', error);
    throw new Error('프로젝트 목록을 불러오는데 실패했습니다.');
  }

  return data || [];
}

export async function getProject(id: string): Promise<Project> {
  const supabase = getSupabase();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('로그인이 필요합니다.');
  }

  const { data, error } = await supabase
    .from('projects')
    .select('*')
    .eq('id', id)
    .eq('user_id', user.id)
    .single();

  if (error) {
    console.error('Get project error:', error);
    throw new Error('프로젝트를 찾을 수 없습니다.');
  }

  return data;
}

export async function updateProject(
  id: string,
  input: UpdateProjectInput
): Promise<Project> {
  const supabase = getSupabase();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('로그인이 필요합니다.');
  }

  const updateData: ProjectUpdate = {
    updated_at: new Date().toISOString(),
  };

  if (input.name !== undefined) updateData.name = input.name;
  if (input.status !== undefined) updateData.status = input.status;
  if (input.settings !== undefined) updateData.settings = input.settings;

  const { data, error } = await supabase
    .from('projects')
    .update(updateData)
    .eq('id', id)
    .eq('user_id', user.id)
    .select()
    .single();

  if (error) {
    console.error('Update project error:', error);
    throw new Error('프로젝트 수정에 실패했습니다.');
  }

  return data;
}

export async function deleteProject(id: string): Promise<void> {
  const supabase = getSupabase();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('로그인이 필요합니다.');
  }

  const { error } = await supabase
    .from('projects')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id);

  if (error) {
    console.error('Delete project error:', error);
    throw new Error('프로젝트 삭제에 실패했습니다.');
  }
}
