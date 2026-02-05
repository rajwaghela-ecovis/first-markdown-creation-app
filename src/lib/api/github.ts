import { RepositoryMetadata } from '@/types/database'

const GITHUB_API_BASE = 'https://api.github.com'

interface GitHubRepo {
  id: number
  name: string
  full_name: string
  private: boolean
  description: string | null
  stargazers_count: number
  forks_count: number
  language: string | null
  default_branch: string
  pushed_at: string
}

interface GitHubError {
  message: string
  documentation_url?: string
}

export async function fetchGitHubRepo(
  owner: string,
  repo: string,
  token?: string
): Promise<{ data: GitHubRepo | null; error: string | null; isPrivate?: boolean }> {
  try {
    const headers: HeadersInit = {
      'Accept': 'application/vnd.github.v3+json',
      'User-Agent': 'ProjectDocGenerator/1.0',
    }

    if (token) {
      headers['Authorization'] = `Bearer ${token}`
    }

    const response = await fetch(`${GITHUB_API_BASE}/repos/${owner}/${repo}`, {
      headers,
    })

    if (!response.ok) {
      if (response.status === 404) {
        // Could be private repo without auth
        return { 
          data: null, 
          error: 'Repository not found. It may be private or doesn\'t exist.',
          isPrivate: true 
        }
      }
      if (response.status === 401) {
        return { data: null, error: 'Invalid or expired GitHub token.' }
      }
      if (response.status === 403) {
        const errorData: GitHubError = await response.json()
        if (errorData.message.includes('rate limit')) {
          return { data: null, error: 'GitHub API rate limit exceeded. Please try again later.' }
        }
        return { data: null, error: 'Access denied. You may need to authenticate.' }
      }
      
      const errorData: GitHubError = await response.json()
      return { data: null, error: errorData.message || 'Failed to fetch repository' }
    }

    const data: GitHubRepo = await response.json()
    return { data, error: null }
  } catch (err) {
    return { data: null, error: 'Network error. Please check your connection.' }
  }
}

export function githubRepoToMetadata(repo: GitHubRepo): RepositoryMetadata {
  return {
    stars: repo.stargazers_count,
    forks: repo.forks_count,
    language: repo.language || undefined,
    description: repo.description || undefined,
    last_commit: repo.pushed_at,
    default_branch: repo.default_branch,
  }
}

// Fetch user's repositories (requires token)
export async function fetchUserGitHubRepos(
  token: string,
  page: number = 1,
  perPage: number = 30
): Promise<{ data: GitHubRepo[] | null; error: string | null }> {
  try {
    const response = await fetch(
      `${GITHUB_API_BASE}/user/repos?page=${page}&per_page=${perPage}&sort=updated`,
      {
        headers: {
          'Accept': 'application/vnd.github.v3+json',
          'Authorization': `Bearer ${token}`,
          'User-Agent': 'ProjectDocGenerator/1.0',
        },
      }
    )

    if (!response.ok) {
      if (response.status === 401) {
        return { data: null, error: 'Invalid or expired GitHub token.' }
      }
      return { data: null, error: 'Failed to fetch repositories' }
    }

    const data: GitHubRepo[] = await response.json()
    return { data, error: null }
  } catch (err) {
    return { data: null, error: 'Network error. Please check your connection.' }
  }
}

// Validate GitHub token
export async function validateGitHubToken(token: string): Promise<{ valid: boolean; error: string | null }> {
  try {
    const response = await fetch(`${GITHUB_API_BASE}/user`, {
      headers: {
        'Accept': 'application/vnd.github.v3+json',
        'Authorization': `Bearer ${token}`,
        'User-Agent': 'ProjectDocGenerator/1.0',
      },
    })

    if (response.ok) {
      return { valid: true, error: null }
    }

    if (response.status === 401) {
      return { valid: false, error: 'Invalid GitHub token' }
    }

    return { valid: false, error: 'Failed to validate token' }
  } catch (err) {
    return { valid: false, error: 'Network error' }
  }
}
