import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { fetchGitHubRepo, githubRepoToMetadata } from '@/lib/api/github'
import { fetchGitLabProject, fetchGitLabProjectLanguages, gitlabProjectToMetadata } from '@/lib/api/gitlab'
import { Platform } from '@/types/database'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { platform, owner, repo } = body as { platform: Platform; owner: string; repo: string }

    if (!platform || !owner || !repo) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Get user's token for this platform (if exists)
    const { data: tokenData } = await supabase
      .from('platform_tokens')
      .select('access_token')
      .eq('platform', platform)
      .single()

    const token = tokenData?.access_token

    // Fetch metadata based on platform
    if (platform === 'github') {
      const { data, error, isPrivate } = await fetchGitHubRepo(owner, repo, token)
      
      if (error) {
        return NextResponse.json({ error, isPrivate }, { status: 400 })
      }

      if (data) {
        return NextResponse.json({
          metadata: githubRepoToMetadata(data),
          isPrivate: data.private,
        })
      }
    }

    if (platform === 'gitlab') {
      const { data, error, isPrivate } = await fetchGitLabProject(owner, repo, token)
      
      if (error) {
        return NextResponse.json({ error, isPrivate }, { status: 400 })
      }

      if (data) {
        // Also fetch languages
        const languages = await fetchGitLabProjectLanguages(owner, repo, token)
        
        return NextResponse.json({
          metadata: gitlabProjectToMetadata(data, languages || undefined),
          isPrivate: data.visibility !== 'public',
        })
      }
    }

    // For Replit and Lovable, return basic metadata (no public API)
    if (platform === 'replit' || platform === 'lovable') {
      return NextResponse.json({
        metadata: {},
        isPrivate: false,
      })
    }

    return NextResponse.json({ error: 'Unsupported platform' }, { status: 400 })
  } catch (err) {
    console.error('Error fetching metadata:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
