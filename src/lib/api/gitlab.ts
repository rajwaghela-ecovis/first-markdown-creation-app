import { RepositoryMetadata } from '@/types/database'

const GITLAB_API_BASE = 'https://gitlab.com/api/v4'

interface GitLabProject {
  id: number
  name: string
  path_with_namespace: string
  visibility: 'public' | 'private' | 'internal'
  description: string | null
  star_count: number
  forks_count: number
  default_branch: string
  last_activity_at: string
  // GitLab doesn't have a single "language" field, but we can get it from languages endpoint
}

interface GitLabError {
  message: string | string[]
  error?: string
}

export async function fetchGitLabProject(
  owner: string,
  repo: string,
  token?: string
): Promise<{ data: GitLabProject | null; error: string | null; isPrivate?: boolean }> {
  try {
    const projectPath = encodeURIComponent(`${owner}/${repo}`)
    
    const headers: HeadersInit = {
      'Accept': 'application/json',
    }

    if (token) {
      headers['PRIVATE-TOKEN'] = token
    }

    const response = await fetch(`${GITLAB_API_BASE}/projects/${projectPath}`, {
      headers,
    })

    if (!response.ok) {
      if (response.status === 404) {
        return { 
          data: null, 
          error: 'Project not found. It may be private or doesn\'t exist.',
          isPrivate: true 
        }
      }
      if (response.status === 401) {
        return { data: null, error: 'Invalid or expired GitLab token.' }
      }
      if (response.status === 403) {
        return { data: null, error: 'Access denied. You may need to authenticate.' }
      }
      
      const errorData: GitLabError = await response.json()
      const message = Array.isArray(errorData.message) 
        ? errorData.message.join(', ') 
        : errorData.message || errorData.error || 'Failed to fetch project'
      return { data: null, error: message }
    }

    const data: GitLabProject = await response.json()
    return { data, error: null }
  } catch (err) {
    return { data: null, error: 'Network error. Please check your connection.' }
  }
}

// Fetch project languages
export async function fetchGitLabProjectLanguages(
  owner: string,
  repo: string,
  token?: string
): Promise<Record<string, number> | null> {
  try {
    const projectPath = encodeURIComponent(`${owner}/${repo}`)
    
    const headers: HeadersInit = {
      'Accept': 'application/json',
    }

    if (token) {
      headers['PRIVATE-TOKEN'] = token
    }

    const response = await fetch(`${GITLAB_API_BASE}/projects/${projectPath}/languages`, {
      headers,
    })

    if (!response.ok) {
      return null
    }

    return await response.json()
  } catch {
    return null
  }
}

export function gitlabProjectToMetadata(project: GitLabProject, languages?: Record<string, number>): RepositoryMetadata {
  // Get primary language (highest percentage)
  let primaryLanguage: string | undefined
  if (languages) {
    const entries = Object.entries(languages)
    if (entries.length > 0) {
      primaryLanguage = entries.sort((a, b) => b[1] - a[1])[0][0]
    }
  }

  return {
    stars: project.star_count,
    forks: project.forks_count,
    language: primaryLanguage,
    description: project.description || undefined,
    last_commit: project.last_activity_at,
    default_branch: project.default_branch,
  }
}

// Fetch user's projects (requires token)
export async function fetchUserGitLabProjects(
  token: string,
  page: number = 1,
  perPage: number = 20
): Promise<{ data: GitLabProject[] | null; error: string | null }> {
  try {
    const response = await fetch(
      `${GITLAB_API_BASE}/projects?membership=true&page=${page}&per_page=${perPage}&order_by=last_activity_at`,
      {
        headers: {
          'Accept': 'application/json',
          'PRIVATE-TOKEN': token,
        },
      }
    )

    if (!response.ok) {
      if (response.status === 401) {
        return { data: null, error: 'Invalid or expired GitLab token.' }
      }
      return { data: null, error: 'Failed to fetch projects' }
    }

    const data: GitLabProject[] = await response.json()
    return { data, error: null }
  } catch (err) {
    return { data: null, error: 'Network error. Please check your connection.' }
  }
}

// Validate GitLab token
export async function validateGitLabToken(token: string): Promise<{ valid: boolean; error: string | null }> {
  try {
    const response = await fetch(`${GITLAB_API_BASE}/user`, {
      headers: {
        'Accept': 'application/json',
        'PRIVATE-TOKEN': token,
      },
    })

    if (response.ok) {
      return { valid: true, error: null }
    }

    if (response.status === 401) {
      return { valid: false, error: 'Invalid GitLab token' }
    }

    return { valid: false, error: 'Failed to validate token' }
  } catch (err) {
    return { valid: false, error: 'Network error' }
  }
}
