'use client'

import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Github, Link as LinkIcon, Key, Loader2, CheckCircle } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Repository, Platform, InsertRepository } from '@/types/database'
import { toast } from 'sonner'

interface ConnectRepositoryDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onRepositoryAdded: (repo: Repository) => void
  currentRepoCount: number
  maxRepos: number
}

// URL patterns for validation
const urlPatterns: Record<Platform, RegExp> = {
  github: /^https?:\/\/(www\.)?github\.com\/[\w.-]+\/[\w.-]+\/?$/,
  gitlab: /^https?:\/\/(www\.)?gitlab\.com\/[\w.-]+\/[\w.-]+\/?$/,
  replit: /^https?:\/\/(www\.)?replit\.com\/@[\w.-]+\/[\w.-]+\/?$/,
  lovable: /^https?:\/\/(www\.)?lovable\.(dev|app)\/[\w.-]+\/?$/,
}

// Extract repo info from URL
function parseRepoUrl(url: string, platform: Platform): { owner: string; name: string } | null {
  try {
    const urlObj = new URL(url)
    const pathParts = urlObj.pathname.split('/').filter(Boolean)
    
    if (platform === 'replit') {
      // Replit: /@username/repl-name
      if (pathParts.length >= 2 && pathParts[0].startsWith('@')) {
        return {
          owner: pathParts[0].substring(1),
          name: pathParts[1],
        }
      }
    } else {
      // GitHub/GitLab/Lovable: /owner/repo
      if (pathParts.length >= 2) {
        return {
          owner: pathParts[0],
          name: pathParts[1],
        }
      }
    }
    return null
  } catch {
    return null
  }
}

export function ConnectRepositoryDialog({
  open,
  onOpenChange,
  onRepositoryAdded,
  currentRepoCount,
  maxRepos,
}: ConnectRepositoryDialogProps) {
  const [activeTab, setActiveTab] = useState('url')
  const [platform, setPlatform] = useState<Platform>('github')
  const [repoUrl, setRepoUrl] = useState('')
  const [apiToken, setApiToken] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const supabase = createClient()

  const resetForm = () => {
    setRepoUrl('')
    setApiToken('')
    setError(null)
    setSuccess(false)
    setIsLoading(false)
  }

  const handleClose = () => {
    resetForm()
    onOpenChange(false)
  }

  const validateUrl = (url: string, plat: Platform): boolean => {
    return urlPatterns[plat].test(url)
  }

  const handleUrlConnect = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setIsLoading(true)

    // Check repo limit
    if (currentRepoCount >= maxRepos) {
      setError(`Repository limit reached (${maxRepos}). Remove a repository to add a new one.`)
      setIsLoading(false)
      return
    }

    // Validate URL format
    if (!validateUrl(repoUrl, platform)) {
      setError(`Invalid ${platform} URL format. Please check the URL and try again.`)
      setIsLoading(false)
      return
    }

    // Parse repo info from URL
    const repoInfo = parseRepoUrl(repoUrl, platform)
    if (!repoInfo) {
      setError('Could not parse repository information from URL.')
      setIsLoading(false)
      return
    }

    try {
      // Check for duplicates
      const { data: existing } = await supabase
        .from('repositories')
        .select('id')
        .eq('repo_url', repoUrl)
        .single()

      if (existing) {
        setError('This repository is already connected.')
        setIsLoading(false)
        return
      }

      // Fetch metadata from API
      let metadata = {}
      let isPrivate = false
      
      try {
        const metadataResponse = await fetch('/api/repositories/fetch-metadata', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            platform,
            owner: repoInfo.owner,
            repo: repoInfo.name,
          }),
        })
        
        if (metadataResponse.ok) {
          const metadataData = await metadataResponse.json()
          metadata = metadataData.metadata || {}
          isPrivate = metadataData.isPrivate || false
        }
      } catch (e) {
        // Continue without metadata if fetch fails
        console.warn('Failed to fetch metadata:', e)
      }

      // Insert repository
      const newRepo: InsertRepository = {
        platform,
        repo_url: repoUrl,
        repo_name: repoInfo.name,
        repo_owner: repoInfo.owner,
        is_private: isPrivate,
        status: 'connected',
        metadata,
      }

      const { data, error: insertError } = await supabase
        .from('repositories')
        .insert(newRepo)
        .select()
        .single()

      if (insertError) throw insertError

      setSuccess(true)
      onRepositoryAdded(data)
      
      setTimeout(() => {
        handleClose()
      }, 1500)
      
    } catch (err: any) {
      setError(err.message || 'Failed to connect repository. Please try again.')
      setIsLoading(false)
    }
  }

  const handleTokenConnect = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setIsLoading(true)

    if (!apiToken || apiToken.length < 10) {
      setError('Please enter a valid API token')
      setIsLoading(false)
      return
    }

    try {
      // Save token to platform_tokens table
      const { error: tokenError } = await supabase
        .from('platform_tokens')
        .upsert({
          platform,
          access_token: apiToken,
          token_type: 'bearer',
        }, {
          onConflict: 'user_id,platform'
        })

      if (tokenError) throw tokenError

      toast.success(`${platform} token saved! You can now connect repositories.`)
      setActiveTab('url')
      setApiToken('')
      setIsLoading(false)
      
    } catch (err: any) {
      setError(err.message || 'Failed to save token. Please try again.')
      setIsLoading(false)
    }
  }

  const handleOAuthConnect = async (provider: 'github' | 'gitlab') => {
    setError(null)
    toast.info(`${provider === 'github' ? 'GitHub' : 'GitLab'} OAuth coming soon!`)
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[550px]">
        <DialogHeader>
          <DialogTitle>Connect Repository</DialogTitle>
          <DialogDescription>
            Connect your repository from GitHub, GitLab, Replit, or Lovable
            ({currentRepoCount}/{maxRepos} repositories used)
          </DialogDescription>
        </DialogHeader>

        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {success && (
          <Alert className="border-green-500/20 bg-green-500/10">
            <CheckCircle className="h-4 w-4 text-green-500" />
            <AlertDescription className="text-green-500">
              Repository connected successfully!
            </AlertDescription>
          </Alert>
        )}

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="url" className="flex items-center gap-2">
              <LinkIcon className="h-4 w-4" />
              URL
            </TabsTrigger>
            <TabsTrigger value="oauth">OAuth</TabsTrigger>
            <TabsTrigger value="token" className="flex items-center gap-2">
              <Key className="h-4 w-4" />
              Token
            </TabsTrigger>
          </TabsList>

          <TabsContent value="url" className="space-y-4 mt-4">
            <form onSubmit={handleUrlConnect} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="platform">Platform</Label>
                <Select value={platform} onValueChange={(v) => setPlatform(v as Platform)}>
                  <SelectTrigger id="platform">
                    <SelectValue placeholder="Select platform" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="github">GitHub</SelectItem>
                    <SelectItem value="gitlab">GitLab</SelectItem>
                    <SelectItem value="replit">Replit</SelectItem>
                    <SelectItem value="lovable">Lovable</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="repo-url">Repository URL</Label>
                <Input
                  id="repo-url"
                  type="url"
                  placeholder={
                    platform === 'github'
                      ? 'https://github.com/username/repo'
                      : platform === 'gitlab'
                      ? 'https://gitlab.com/username/repo'
                      : platform === 'replit'
                      ? 'https://replit.com/@username/repo'
                      : 'https://lovable.dev/project'
                  }
                  value={repoUrl}
                  onChange={(e) => setRepoUrl(e.target.value)}
                  required
                  disabled={isLoading || success}
                  className="bg-background"
                />
                <p className="text-xs text-muted-foreground">
                  Paste the full URL of your repository
                </p>
              </div>

              <Button
                type="submit"
                className="w-full"
                disabled={isLoading || success || currentRepoCount >= maxRepos}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Connecting...
                  </>
                ) : success ? (
                  <>
                    <CheckCircle className="mr-2 h-4 w-4" />
                    Connected!
                  </>
                ) : (
                  'Connect Repository'
                )}
              </Button>
            </form>
          </TabsContent>

          <TabsContent value="oauth" className="space-y-4 mt-4">
            <div className="space-y-3">
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={() => handleOAuthConnect('github')}
                disabled={isLoading}
              >
                <Github className="mr-2 h-5 w-5" />
                Connect with GitHub
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={() => handleOAuthConnect('gitlab')}
                disabled={isLoading}
              >
                <svg className="mr-2 h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M22.65 14.39L12 22.13 1.35 14.39a.84.84 0 0 1-.3-.94l1.22-3.78 2.44-7.51A.42.42 0 0 1 4.82 2a.43.43 0 0 1 .58 0 .42.42 0 0 1 .11.18l2.44 7.49h8.1l2.44-7.51A.42.42 0 0 1 18.6 2a.43.43 0 0 1 .58 0 .42.42 0 0 1 .11.18l2.44 7.51L23 13.45a.84.84 0 0 1-.35.94z"/>
                </svg>
                Connect with GitLab
              </Button>
            </div>
            <p className="text-xs text-muted-foreground text-center">
              OAuth allows you to connect multiple repositories at once
            </p>
          </TabsContent>

          <TabsContent value="token" className="space-y-4 mt-4">
            <form onSubmit={handleTokenConnect} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="token-platform">Platform</Label>
                <Select value={platform} onValueChange={(v) => setPlatform(v as Platform)}>
                  <SelectTrigger id="token-platform">
                    <SelectValue placeholder="Select platform" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="github">GitHub</SelectItem>
                    <SelectItem value="gitlab">GitLab</SelectItem>
                    <SelectItem value="replit">Replit</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="api-token">Personal Access Token</Label>
                <Input
                  id="api-token"
                  type="password"
                  placeholder={platform === 'github' ? 'ghp_xxxxxxxxxxxx' : 'glpat-xxxxxxxxxxxx'}
                  value={apiToken}
                  onChange={(e) => setApiToken(e.target.value)}
                  required
                  disabled={isLoading}
                  className="bg-background"
                />
                <p className="text-xs text-muted-foreground">
                  {platform === 'github' && (
                    <>
                      Generate a token at{' '}
                      <a
                        href="https://github.com/settings/tokens"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:underline"
                      >
                        GitHub Settings
                      </a>
                    </>
                  )}
                  {platform === 'gitlab' && (
                    <>
                      Generate a token at{' '}
                      <a
                        href="https://gitlab.com/-/profile/personal_access_tokens"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:underline"
                      >
                        GitLab Settings
                      </a>
                    </>
                  )}
                  {platform === 'replit' && 'Get your token from Replit account settings'}
                </p>
              </div>

              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  'Save Token'
                )}
              </Button>
            </form>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}
