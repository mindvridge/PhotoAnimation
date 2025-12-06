export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

// Enum types
export type SubscriptionTier = 'free' | 'basic' | 'pro' | 'business';
export type TemplateCategory = 'wedding' | 'birthday' | 'anniversary' | 'celebration' | 'memorial';
export type ProjectStatus = 'draft' | 'processing' | 'completed' | 'failed';
export type AnimationStatus = 'pending' | 'processing' | 'completed' | 'failed';
export type RenderStatus = 'queued' | 'rendering' | 'completed' | 'failed';
export type PaymentStatus = 'pending' | 'completed' | 'failed' | 'refunded';
export type UserRole = 'user' | 'admin';

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          email: string;
          name: string | null;
          avatar_url: string | null;
          role: UserRole;
          subscription_tier: SubscriptionTier;
          credits: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email: string;
          name?: string | null;
          avatar_url?: string | null;
          role?: UserRole;
          subscription_tier?: SubscriptionTier;
          credits?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          name?: string | null;
          avatar_url?: string | null;
          role?: UserRole;
          subscription_tier?: SubscriptionTier;
          credits?: number;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      templates: {
        Row: {
          id: string;
          name: string;
          slug: string;
          description: string | null;
          category: TemplateCategory;
          thumbnail_url: string | null;
          preview_video_url: string | null;
          remotion_template_id: string | null;
          duration_seconds: number;
          max_photos: number;
          is_premium: boolean;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          slug: string;
          description?: string | null;
          category: TemplateCategory;
          thumbnail_url?: string | null;
          preview_video_url?: string | null;
          remotion_template_id?: string | null;
          duration_seconds: number;
          max_photos: number;
          is_premium?: boolean;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          slug?: string;
          description?: string | null;
          category?: TemplateCategory;
          thumbnail_url?: string | null;
          preview_video_url?: string | null;
          remotion_template_id?: string | null;
          duration_seconds?: number;
          max_photos?: number;
          is_premium?: boolean;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      projects: {
        Row: {
          id: string;
          user_id: string;
          template_id: string | null;
          name: string;
          status: ProjectStatus;
          settings: ProjectSettings;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          template_id?: string | null;
          name: string;
          status?: ProjectStatus;
          settings?: ProjectSettings;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          template_id?: string | null;
          name?: string;
          status?: ProjectStatus;
          settings?: ProjectSettings;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'projects_user_id_fkey';
            columns: ['user_id'];
            referencedRelation: 'users';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'projects_template_id_fkey';
            columns: ['template_id'];
            referencedRelation: 'templates';
            referencedColumns: ['id'];
          }
        ];
      };
      photos: {
        Row: {
          id: string;
          project_id: string;
          original_url: string;
          animated_url: string | null;
          order_index: number;
          animation_status: AnimationStatus;
          animation_settings: AnimationSettings;
          created_at: string;
        };
        Insert: {
          id?: string;
          project_id: string;
          original_url: string;
          animated_url?: string | null;
          order_index?: number;
          animation_status?: AnimationStatus;
          animation_settings?: AnimationSettings;
          created_at?: string;
        };
        Update: {
          id?: string;
          project_id?: string;
          original_url?: string;
          animated_url?: string | null;
          order_index?: number;
          animation_status?: AnimationStatus;
          animation_settings?: AnimationSettings;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'photos_project_id_fkey';
            columns: ['project_id'];
            referencedRelation: 'projects';
            referencedColumns: ['id'];
          }
        ];
      };
      videos: {
        Row: {
          id: string;
          project_id: string;
          video_url: string;
          thumbnail_url: string | null;
          duration_seconds: number | null;
          resolution: string | null;
          file_size_bytes: number | null;
          render_status: RenderStatus;
          error_message: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          project_id: string;
          video_url: string;
          thumbnail_url?: string | null;
          duration_seconds?: number | null;
          resolution?: string | null;
          file_size_bytes?: number | null;
          render_status?: RenderStatus;
          error_message?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          project_id?: string;
          video_url?: string;
          thumbnail_url?: string | null;
          duration_seconds?: number | null;
          resolution?: string | null;
          file_size_bytes?: number | null;
          render_status?: RenderStatus;
          error_message?: string | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'videos_project_id_fkey';
            columns: ['project_id'];
            referencedRelation: 'projects';
            referencedColumns: ['id'];
          }
        ];
      };
      payments: {
        Row: {
          id: string;
          user_id: string;
          order_id: string;
          order_name: string;
          amount: number;
          currency: string;
          payment_method: string | null;
          payment_key: string | null;
          status: PaymentStatus;
          package_id: string | null;
          credits_added: number;
          approved_at: string | null;
          receipt_url: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          order_id: string;
          order_name: string;
          amount: number;
          currency?: string;
          payment_method?: string | null;
          payment_key?: string | null;
          status?: PaymentStatus;
          package_id?: string | null;
          credits_added?: number;
          approved_at?: string | null;
          receipt_url?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          order_id?: string;
          order_name?: string;
          amount?: number;
          currency?: string;
          payment_method?: string | null;
          payment_key?: string | null;
          status?: PaymentStatus;
          package_id?: string | null;
          credits_added?: number;
          approved_at?: string | null;
          receipt_url?: string | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'payments_user_id_fkey';
            columns: ['user_id'];
            referencedRelation: 'users';
            referencedColumns: ['id'];
          }
        ];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      subscription_tier: SubscriptionTier;
      template_category: TemplateCategory;
      project_status: ProjectStatus;
      animation_status: AnimationStatus;
      render_status: RenderStatus;
      payment_status: PaymentStatus;
      user_role: UserRole;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
}

// Project settings JSON structure
export interface ProjectSettings {
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
  transitions?: {
    type: 'fade' | 'slide' | 'zoom' | 'none';
    duration: number;
  };
  resolution?: '720p' | '1080p' | '4k';
  aspectRatio?: '16:9' | '9:16' | '1:1';
}

// Animation settings JSON structure
export interface AnimationSettings {
  expression?: 'smile' | 'neutral' | 'surprised' | 'sad';
  movement?: 'subtle' | 'moderate' | 'dynamic';
  duration?: number;
}

// Convenience type aliases
export type User = Database['public']['Tables']['users']['Row'];
export type UserInsert = Database['public']['Tables']['users']['Insert'];
export type UserUpdate = Database['public']['Tables']['users']['Update'];

export type Template = Database['public']['Tables']['templates']['Row'];
export type TemplateInsert = Database['public']['Tables']['templates']['Insert'];
export type TemplateUpdate = Database['public']['Tables']['templates']['Update'];

export type Project = Database['public']['Tables']['projects']['Row'];
export type ProjectInsert = Database['public']['Tables']['projects']['Insert'];
export type ProjectUpdate = Database['public']['Tables']['projects']['Update'];

export type Photo = Database['public']['Tables']['photos']['Row'];
export type PhotoInsert = Database['public']['Tables']['photos']['Insert'];
export type PhotoUpdate = Database['public']['Tables']['photos']['Update'];

export type Video = Database['public']['Tables']['videos']['Row'];
export type VideoInsert = Database['public']['Tables']['videos']['Insert'];
export type VideoUpdate = Database['public']['Tables']['videos']['Update'];

export type Payment = Database['public']['Tables']['payments']['Row'];
export type PaymentInsert = Database['public']['Tables']['payments']['Insert'];
export type PaymentUpdate = Database['public']['Tables']['payments']['Update'];

// Extended types with relations
export interface ProjectWithRelations extends Project {
  template?: Template | null;
  photos?: Photo[];
  videos?: Video[];
}

export interface PhotoWithProject extends Photo {
  project?: Project;
}

export interface VideoWithProject extends Video {
  project?: Project;
}
