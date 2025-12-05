-- =============================================
-- AI Video Maker - Initial Database Schema
-- =============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================
-- ENUM TYPES
-- =============================================

-- Subscription tier enum
CREATE TYPE subscription_tier AS ENUM ('free', 'basic', 'pro', 'business');

-- Template category enum
CREATE TYPE template_category AS ENUM ('wedding', 'birthday', 'anniversary', 'celebration', 'memorial');

-- Project status enum
CREATE TYPE project_status AS ENUM ('draft', 'processing', 'completed', 'failed');

-- Animation status enum
CREATE TYPE animation_status AS ENUM ('pending', 'processing', 'completed', 'failed');

-- Render status enum
CREATE TYPE render_status AS ENUM ('queued', 'rendering', 'completed', 'failed');

-- Payment status enum
CREATE TYPE payment_status AS ENUM ('pending', 'completed', 'failed', 'refunded');

-- =============================================
-- TABLES
-- =============================================

-- Users table (extends Supabase Auth)
CREATE TABLE users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    name TEXT,
    avatar_url TEXT,
    subscription_tier subscription_tier DEFAULT 'free' NOT NULL,
    credits INTEGER DEFAULT 0 NOT NULL CHECK (credits >= 0),
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Templates table (video templates)
CREATE TABLE templates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    description TEXT,
    category template_category NOT NULL,
    thumbnail_url TEXT,
    preview_video_url TEXT,
    remotion_template_id TEXT,
    duration_seconds INTEGER NOT NULL CHECK (duration_seconds > 0),
    max_photos INTEGER NOT NULL CHECK (max_photos > 0),
    is_premium BOOLEAN DEFAULT false NOT NULL,
    is_active BOOLEAN DEFAULT true NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Projects table (user projects)
CREATE TABLE projects (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    template_id UUID REFERENCES templates(id) ON DELETE SET NULL,
    name TEXT NOT NULL,
    status project_status DEFAULT 'draft' NOT NULL,
    settings JSONB DEFAULT '{}'::jsonb NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Photos table (uploaded photos)
CREATE TABLE photos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    original_url TEXT NOT NULL,
    animated_url TEXT,
    order_index INTEGER NOT NULL DEFAULT 0,
    animation_status animation_status DEFAULT 'pending' NOT NULL,
    animation_settings JSONB DEFAULT '{}'::jsonb NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Videos table (generated videos)
CREATE TABLE videos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    video_url TEXT NOT NULL,
    thumbnail_url TEXT,
    duration_seconds INTEGER,
    resolution TEXT,
    file_size_bytes BIGINT,
    render_status render_status DEFAULT 'queued' NOT NULL,
    error_message TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Payments table (payment history)
CREATE TABLE payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    amount INTEGER NOT NULL CHECK (amount > 0),
    currency TEXT DEFAULT 'KRW' NOT NULL,
    payment_method TEXT,
    payment_key TEXT,
    status payment_status DEFAULT 'pending' NOT NULL,
    credits_added INTEGER DEFAULT 0 NOT NULL CHECK (credits_added >= 0),
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- =============================================
-- INDEXES
-- =============================================

-- Users indexes
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_subscription_tier ON users(subscription_tier);

-- Templates indexes
CREATE INDEX idx_templates_slug ON templates(slug);
CREATE INDEX idx_templates_category ON templates(category);
CREATE INDEX idx_templates_is_active ON templates(is_active);

-- Projects indexes
CREATE INDEX idx_projects_user_id ON projects(user_id);
CREATE INDEX idx_projects_template_id ON projects(template_id);
CREATE INDEX idx_projects_status ON projects(status);
CREATE INDEX idx_projects_created_at ON projects(created_at DESC);

-- Photos indexes
CREATE INDEX idx_photos_project_id ON photos(project_id);
CREATE INDEX idx_photos_animation_status ON photos(animation_status);
CREATE INDEX idx_photos_order ON photos(project_id, order_index);

-- Videos indexes
CREATE INDEX idx_videos_project_id ON videos(project_id);
CREATE INDEX idx_videos_render_status ON videos(render_status);

-- Payments indexes
CREATE INDEX idx_payments_user_id ON payments(user_id);
CREATE INDEX idx_payments_status ON payments(status);
CREATE INDEX idx_payments_created_at ON payments(created_at DESC);

-- =============================================
-- TRIGGERS
-- =============================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at trigger to tables
CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_templates_updated_at
    BEFORE UPDATE ON templates
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_projects_updated_at
    BEFORE UPDATE ON projects
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Function to handle new user signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.users (id, email, name, avatar_url)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'name', NEW.raw_user_meta_data->>'full_name'),
        NEW.raw_user_meta_data->>'avatar_url'
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create user profile on signup
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION handle_new_user();

-- =============================================
-- ROW LEVEL SECURITY (RLS)
-- =============================================

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE videos ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

-- =============================================
-- RLS POLICIES - Users
-- =============================================

-- Users can read their own data
CREATE POLICY "Users can view own profile"
    ON users FOR SELECT
    USING (auth.uid() = id);

-- Users can update their own data
CREATE POLICY "Users can update own profile"
    ON users FOR UPDATE
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

-- =============================================
-- RLS POLICIES - Templates
-- =============================================

-- Everyone can view active templates
CREATE POLICY "Anyone can view active templates"
    ON templates FOR SELECT
    USING (is_active = true);

-- Only service role can manage templates (admin operations)
-- Note: Service role bypasses RLS by default

-- =============================================
-- RLS POLICIES - Projects
-- =============================================

-- Users can view their own projects
CREATE POLICY "Users can view own projects"
    ON projects FOR SELECT
    USING (auth.uid() = user_id);

-- Users can create their own projects
CREATE POLICY "Users can create own projects"
    ON projects FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Users can update their own projects
CREATE POLICY "Users can update own projects"
    ON projects FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Users can delete their own projects
CREATE POLICY "Users can delete own projects"
    ON projects FOR DELETE
    USING (auth.uid() = user_id);

-- =============================================
-- RLS POLICIES - Photos
-- =============================================

-- Users can view photos from their own projects
CREATE POLICY "Users can view own project photos"
    ON photos FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM projects
            WHERE projects.id = photos.project_id
            AND projects.user_id = auth.uid()
        )
    );

-- Users can add photos to their own projects
CREATE POLICY "Users can add photos to own projects"
    ON photos FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM projects
            WHERE projects.id = photos.project_id
            AND projects.user_id = auth.uid()
        )
    );

-- Users can update photos in their own projects
CREATE POLICY "Users can update own project photos"
    ON photos FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM projects
            WHERE projects.id = photos.project_id
            AND projects.user_id = auth.uid()
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM projects
            WHERE projects.id = photos.project_id
            AND projects.user_id = auth.uid()
        )
    );

-- Users can delete photos from their own projects
CREATE POLICY "Users can delete own project photos"
    ON photos FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM projects
            WHERE projects.id = photos.project_id
            AND projects.user_id = auth.uid()
        )
    );

-- =============================================
-- RLS POLICIES - Videos
-- =============================================

-- Users can view videos from their own projects
CREATE POLICY "Users can view own project videos"
    ON videos FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM projects
            WHERE projects.id = videos.project_id
            AND projects.user_id = auth.uid()
        )
    );

-- Service role handles video creation (from render workers)
-- Note: Service role bypasses RLS by default

-- =============================================
-- RLS POLICIES - Payments
-- =============================================

-- Users can view their own payments
CREATE POLICY "Users can view own payments"
    ON payments FOR SELECT
    USING (auth.uid() = user_id);

-- Service role handles payment creation (from payment webhooks)
-- Note: Service role bypasses RLS by default

-- =============================================
-- STORAGE BUCKETS
-- =============================================

-- Note: Run these in Supabase Dashboard or via API
-- INSERT INTO storage.buckets (id, name, public)
-- VALUES
--     ('photos', 'photos', false),
--     ('videos', 'videos', false),
--     ('thumbnails', 'thumbnails', true);

-- Storage policies would be set up similarly through Supabase Dashboard

-- =============================================
-- INITIAL DATA (Optional)
-- =============================================

-- Insert sample templates (uncomment if needed)
/*
INSERT INTO templates (name, slug, description, category, duration_seconds, max_photos, is_premium)
VALUES
    ('Classic Wedding', 'classic-wedding', 'Elegant wedding video template with smooth transitions', 'wedding', 180, 30, false),
    ('Birthday Celebration', 'birthday-celebration', 'Fun birthday video with balloons and confetti', 'birthday', 120, 20, false),
    ('Anniversary Memories', 'anniversary-memories', 'Romantic anniversary slideshow', 'anniversary', 150, 25, true),
    ('Party Time', 'party-time', 'Energetic celebration video', 'celebration', 90, 15, false),
    ('In Loving Memory', 'in-loving-memory', 'Respectful memorial tribute video', 'memorial', 180, 30, true);
*/
