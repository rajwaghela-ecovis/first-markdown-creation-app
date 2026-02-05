-- =============================================
-- PROJ-1: Repository Connection & Authentication
-- Database Schema for Supabase
-- =============================================

-- Enable UUID extension (usually already enabled in Supabase)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================
-- ENUM TYPES
-- =============================================

-- Platform types for repositories
CREATE TYPE platform_type AS ENUM ('github', 'gitlab', 'replit', 'lovable');

-- Connection status for repositories
CREATE TYPE connection_status AS ENUM ('connected', 'failed', 'pending');

-- =============================================
-- TABLES
-- =============================================

-- User profiles (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT,
    full_name TEXT,
    avatar_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Connected repositories
CREATE TABLE IF NOT EXISTS public.repositories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Repository info
    platform platform_type NOT NULL,
    repo_url TEXT NOT NULL,
    repo_name TEXT NOT NULL,
    repo_owner TEXT NOT NULL,
    is_private BOOLEAN DEFAULT FALSE,
    
    -- Connection status
    status connection_status DEFAULT 'pending',
    error_message TEXT,
    
    -- Platform-specific metadata (stars, forks, language, etc.)
    metadata JSONB DEFAULT '{}',
    
    -- Timestamps
    last_synced_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Constraints
    UNIQUE(user_id, repo_url)
);

-- Platform tokens (encrypted access tokens for API calls)
CREATE TABLE IF NOT EXISTS public.platform_tokens (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Token info
    platform platform_type NOT NULL,
    access_token TEXT NOT NULL, -- Will be encrypted at application level
    token_type TEXT DEFAULT 'bearer',
    
    -- Token metadata
    scopes TEXT[], -- Array of granted scopes
    expires_at TIMESTAMPTZ,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- One token per platform per user
    UNIQUE(user_id, platform)
);

-- =============================================
-- INDEXES
-- =============================================

-- Fast lookup by user
CREATE INDEX IF NOT EXISTS idx_repositories_user_id ON public.repositories(user_id);
CREATE INDEX IF NOT EXISTS idx_platform_tokens_user_id ON public.platform_tokens(user_id);

-- Fast lookup by platform
CREATE INDEX IF NOT EXISTS idx_repositories_platform ON public.repositories(platform);

-- Fast lookup by status
CREATE INDEX IF NOT EXISTS idx_repositories_status ON public.repositories(status);

-- =============================================
-- ROW LEVEL SECURITY (RLS)
-- =============================================

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.repositories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.platform_tokens ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view own profile" ON public.profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.profiles
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON public.profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

-- Repositories policies
CREATE POLICY "Users can view own repositories" ON public.repositories
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own repositories" ON public.repositories
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own repositories" ON public.repositories
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own repositories" ON public.repositories
    FOR DELETE USING (auth.uid() = user_id);

-- Platform tokens policies (most restrictive)
CREATE POLICY "Users can view own tokens" ON public.platform_tokens
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own tokens" ON public.platform_tokens
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own tokens" ON public.platform_tokens
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own tokens" ON public.platform_tokens
    FOR DELETE USING (auth.uid() = user_id);

-- =============================================
-- FUNCTIONS & TRIGGERS
-- =============================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_repositories_updated_at
    BEFORE UPDATE ON public.repositories
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_platform_tokens_updated_at
    BEFORE UPDATE ON public.platform_tokens
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, email, full_name, avatar_url)
    VALUES (
        NEW.id,
        NEW.email,
        NEW.raw_user_meta_data->>'full_name',
        NEW.raw_user_meta_data->>'avatar_url'
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to auto-create profile on signup
CREATE OR REPLACE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to count user's repositories (for 10 repo limit)
CREATE OR REPLACE FUNCTION public.get_user_repo_count(user_uuid UUID)
RETURNS INTEGER AS $$
BEGIN
    RETURN (SELECT COUNT(*) FROM public.repositories WHERE user_id = user_uuid);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if user can add more repositories
CREATE OR REPLACE FUNCTION public.can_add_repository(user_uuid UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN (SELECT COUNT(*) FROM public.repositories WHERE user_id = user_uuid) < 10;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================
-- SAMPLE DATA (for testing - optional)
-- =============================================

-- Uncomment below to add sample data after signing up a test user
/*
INSERT INTO public.repositories (user_id, platform, repo_url, repo_name, repo_owner, status, metadata)
VALUES 
    ('YOUR_USER_UUID', 'github', 'https://github.com/vercel/next.js', 'next.js', 'vercel', 'connected', 
     '{"stars": 120000, "forks": 25000, "language": "TypeScript"}'),
    ('YOUR_USER_UUID', 'gitlab', 'https://gitlab.com/gitlab-org/gitlab', 'gitlab', 'gitlab-org', 'connected',
     '{"stars": 8000, "forks": 2000, "language": "Ruby"}');
*/
