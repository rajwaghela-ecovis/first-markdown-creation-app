// Database types for Supabase
// Auto-generated from schema.sql

export type Platform = 'github' | 'gitlab' | 'replit' | 'lovable'
export type ConnectionStatus = 'connected' | 'failed' | 'pending'

export interface Profile {
  id: string
  email: string | null
  full_name: string | null
  avatar_url: string | null
  created_at: string
  updated_at: string
}

export interface Repository {
  id: string
  user_id: string
  platform: Platform
  repo_url: string
  repo_name: string
  repo_owner: string
  is_private: boolean
  status: ConnectionStatus
  error_message: string | null
  metadata: RepositoryMetadata
  last_synced_at: string | null
  created_at: string
  updated_at: string
}

export interface RepositoryMetadata {
  stars?: number
  forks?: number
  language?: string
  description?: string
  last_commit?: string
  default_branch?: string
  // Replit specific
  last_run?: string
  // Lovable specific
  framework?: string
  last_deployment?: string
}

export interface PlatformToken {
  id: string
  user_id: string
  platform: Platform
  access_token: string
  token_type: string
  scopes: string[] | null
  expires_at: string | null
  created_at: string
  updated_at: string
}

// Insert types (without auto-generated fields)
export interface InsertRepository {
  user_id?: string // Will be set by RLS
  platform: Platform
  repo_url: string
  repo_name: string
  repo_owner: string
  is_private?: boolean
  status?: ConnectionStatus
  error_message?: string | null
  metadata?: RepositoryMetadata
}

export interface InsertPlatformToken {
  user_id?: string // Will be set by RLS
  platform: Platform
  access_token: string
  token_type?: string
  scopes?: string[]
  expires_at?: string | null
}

// Update types (partial)
export interface UpdateRepository {
  status?: ConnectionStatus
  error_message?: string | null
  metadata?: RepositoryMetadata
  last_synced_at?: string
}

// Database schema type for Supabase client
export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: Profile
        Insert: Omit<Profile, 'created_at' | 'updated_at'>
        Update: Partial<Omit<Profile, 'id' | 'created_at' | 'updated_at'>>
      }
      repositories: {
        Row: Repository
        Insert: InsertRepository
        Update: UpdateRepository
      }
      platform_tokens: {
        Row: PlatformToken
        Insert: InsertPlatformToken
        Update: Partial<Omit<PlatformToken, 'id' | 'user_id' | 'created_at' | 'updated_at'>>
      }
    }
    Functions: {
      get_user_repo_count: {
        Args: { user_uuid: string }
        Returns: number
      }
      can_add_repository: {
        Args: { user_uuid: string }
        Returns: boolean
      }
    }
  }
}
