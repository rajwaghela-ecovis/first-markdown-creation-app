'use client'

import { useState } from 'react'
import { User } from '@supabase/supabase-js'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Plus, Search, LogOut, FileText } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { ThemeToggle } from '@/components/theme-toggle'
import { ConnectRepositoryDialog } from '@/components/connect-repository-dialog'
import { RepositoryCard } from '@/components/repository-card'
import { Profile, Repository } from '@/types/database'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { toast } from 'sonner'

interface DashboardProps {
  user: User
  profile: Profile | null
  initialRepositories: Repository[]
}

export function Dashboard({ user, profile, initialRepositories }: DashboardProps) {
  const [isConnectDialogOpen, setIsConnectDialogOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [platformFilter, setPlatformFilter] = useState('all')
  const [repositories, setRepositories] = useState<Repository[]>(initialRepositories)
  const supabase = createClient()

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    window.location.href = '/auth/signin'
  }

  const handleRepositoryAdded = (newRepo: Repository) => {
    setRepositories(prev => [newRepo, ...prev])
    toast.success('Repository connected successfully!')
  }

  const handleRepositoryDeleted = (repoId: string) => {
    setRepositories(prev => prev.filter(r => r.id !== repoId))
    toast.success('Repository disconnected')
  }

  const filteredRepositories = repositories.filter((repo) => {
    const matchesSearch = repo.repo_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         repo.repo_owner.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesPlatform = platformFilter === 'all' || repo.platform === platformFilter
    return matchesSearch && matchesPlatform
  })

  const stats = {
    total: repositories.length,
    connected: repositories.filter(r => r.status === 'connected').length,
    failed: repositories.filter(r => r.status === 'failed').length,
    limit: 10,
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation Bar */}
      <nav className="border-b bg-card">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center space-x-3">
              <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                <FileText className="h-4 w-4 text-primary" />
              </div>
              <h1 className="text-lg font-semibold">
                Doc Generator
              </h1>
            </div>
            <div className="flex items-center space-x-4">
              <ThemeToggle />
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={profile?.avatar_url || undefined} alt={user.email || ''} />
                      <AvatarFallback className="bg-primary/10 text-primary">
                        {user.email?.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end" forceMount>
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none">
                        {profile?.full_name || 'User'}
                      </p>
                      <p className="text-xs leading-none text-muted-foreground">
                        {user.email}
                      </p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleSignOut} className="text-destructive">
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Log out</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <div>
            <h2 className="text-3xl font-bold">My Repositories</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Connect and manage your repositories ({stats.total}/{stats.limit} used)
            </p>
          </div>
          <Button 
            onClick={() => setIsConnectDialogOpen(true)}
            disabled={stats.total >= stats.limit}
          >
            <Plus className="mr-2 h-4 w-4" />
            Connect Repository
          </Button>
        </div>

        {/* Stats Bar */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-card rounded-lg border p-6">
            <div className="text-sm font-medium text-muted-foreground">Total Repositories</div>
            <div className="mt-2 text-3xl font-bold">
              {stats.total}
            </div>
          </div>
          <div className="bg-card rounded-lg border p-6">
            <div className="text-sm font-medium text-muted-foreground">Connected</div>
            <div className="mt-2 text-3xl font-bold text-green-500">
              {stats.connected}
            </div>
          </div>
          <div className="bg-card rounded-lg border p-6">
            <div className="text-sm font-medium text-muted-foreground">Failed</div>
            <div className="mt-2 text-3xl font-bold text-destructive">
              {stats.failed}
            </div>
          </div>
        </div>

        {/* Search & Filter Bar */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search repositories..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-background"
            />
          </div>
          <Select value={platformFilter} onValueChange={setPlatformFilter}>
            <SelectTrigger className="w-full sm:w-[200px]">
              <SelectValue placeholder="Filter by platform" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Platforms</SelectItem>
              <SelectItem value="github">GitHub</SelectItem>
              <SelectItem value="gitlab">GitLab</SelectItem>
              <SelectItem value="replit">Replit</SelectItem>
              <SelectItem value="lovable">Lovable</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Repository Grid */}
        {filteredRepositories.length === 0 ? (
          <div className="bg-card rounded-lg border p-12 text-center">
            <div className="mx-auto h-24 w-24 text-muted-foreground mb-4 flex items-center justify-center">
              <FileText className="h-16 w-16" />
            </div>
            <h3 className="text-lg font-medium mb-2">
              {repositories.length === 0 
                ? 'No repositories connected' 
                : 'No repositories match your search'}
            </h3>
            <p className="text-muted-foreground mb-6">
              {repositories.length === 0 
                ? 'Get started by connecting your first repository'
                : 'Try adjusting your search or filter'}
            </p>
            {repositories.length === 0 && (
              <Button onClick={() => setIsConnectDialogOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Connect Your First Repository
              </Button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredRepositories.map((repo) => (
              <RepositoryCard 
                key={repo.id} 
                repository={repo} 
                onDelete={handleRepositoryDeleted}
              />
            ))}
          </div>
        )}
      </main>

      {/* Connect Repository Dialog */}
      <ConnectRepositoryDialog
        open={isConnectDialogOpen}
        onOpenChange={setIsConnectDialogOpen}
        onRepositoryAdded={handleRepositoryAdded}
        currentRepoCount={stats.total}
        maxRepos={stats.limit}
      />
    </div>
  )
}
