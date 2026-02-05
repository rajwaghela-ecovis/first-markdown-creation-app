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
import { Github, GitlabIcon as GitLab, Link as LinkIcon, Key } from 'lucide-react'

interface ConnectRepositoryDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function ConnectRepositoryDialog({
  open,
  onOpenChange,
}: ConnectRepositoryDialogProps) {
  const [activeTab, setActiveTab] = useState('url')
  const [platform, setPlatform] = useState('github')
  const [repoUrl, setRepoUrl] = useState('')
  const [apiToken, setApiToken] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const handleUrlConnect = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setIsLoading(true)

    // Validate URL format
    try {
      const url = new URL(repoUrl)
      
      // Basic platform validation
      if (platform === 'github' && !url.hostname.includes('github.com')) {
        setError('Invalid GitHub URL. Expected format: https://github.com/username/repo')
        setIsLoading(false)
        return
      }
      
      if (platform === 'gitlab' && !url.hostname.includes('gitlab.com')) {
        setError('Invalid GitLab URL. Expected format: https://gitlab.com/username/repo')
        setIsLoading(false)
        return
      }

      // TODO: Call API to connect repository
      // For now, simulate success
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      setSuccess(true)
      setTimeout(() => {
        onOpenChange(false)
        setSuccess(false)
        setRepoUrl('')
        setIsLoading(false)
      }, 1500)
      
    } catch (err) {
      setError('Invalid URL format')
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

    // TODO: Call API to connect with token
    // For now, simulate success
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    setSuccess(true)
    setTimeout(() => {
      onOpenChange(false)
      setSuccess(false)
      setApiToken('')
      setIsLoading(false)
    }, 1500)
  }

  const handleOAuthConnect = async (provider: 'github' | 'gitlab') => {
    setError(null)
    setIsLoading(true)

    // TODO: Implement OAuth flow
    // For now, show coming soon message
    setError(`${provider === 'github' ? 'GitHub' : 'GitLab'} OAuth coming soon!`)
    setIsLoading(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Connect Repository</DialogTitle>
          <DialogDescription>
            Connect your repository from GitHub, GitLab, Replit, or Lovable
          </DialogDescription>
        </DialogHeader>

        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {success && (
          <Alert>
            <AlertDescription>Repository connected successfully!</AlertDescription>
          </Alert>
        )}

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="url">
              <LinkIcon className="mr-2 h-4 w-4" />
              URL
            </TabsTrigger>
            <TabsTrigger value="oauth">OAuth</TabsTrigger>
            <TabsTrigger value="token">
              <Key className="mr-2 h-4 w-4" />
              API Token
            </TabsTrigger>
          </TabsList>

          <TabsContent value="url" className="space-y-4">
            <form onSubmit={handleUrlConnect} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="platform">Platform</Label>
                <Select value={platform} onValueChange={setPlatform}>
                  <SelectTrigger id="platform">
                    <SelectValue placeholder="Select platform" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="github">GitHub</SelectItem>
                    <SelectItem value="gitlab">GitLab</SelectItem>
                    <SelectItem value="replit">Replit</SelectItem>
                    <SelectItem value="lovable">Lovable (Coming Soon)</SelectItem>
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
                      : 'https://replit.com/@username/repo'
                  }
                  value={repoUrl}
                  onChange={(e) => setRepoUrl(e.target.value)}
                  required
                  disabled={isLoading || platform === 'lovable'}
                />
                <p className="text-xs text-muted-foreground">
                  Paste the full URL of your repository
                </p>
              </div>

              <Button
                type="submit"
                className="w-full"
                disabled={isLoading || platform === 'lovable'}
              >
                {isLoading ? 'Connecting...' : 'Connect Repository'}
              </Button>
            </form>
          </TabsContent>

          <TabsContent value="oauth" className="space-y-4">
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
                <GitLab className="mr-2 h-5 w-5" />
                Connect with GitLab
              </Button>
            </div>
            <p className="text-xs text-muted-foreground text-center">
              OAuth allows you to connect multiple repositories at once
            </p>
          </TabsContent>

          <TabsContent value="token" className="space-y-4">
            <form onSubmit={handleTokenConnect} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="token-platform">Platform</Label>
                <Select value={platform} onValueChange={setPlatform}>
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
                  placeholder="ghp_xxxxxxxxxxxx"
                  value={apiToken}
                  onChange={(e) => setApiToken(e.target.value)}
                  required
                  disabled={isLoading}
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
                {isLoading ? 'Connecting...' : 'Connect with Token'}
              </Button>
            </form>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}
