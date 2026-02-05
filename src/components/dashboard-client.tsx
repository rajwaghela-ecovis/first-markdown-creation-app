'use client'

import { useState } from 'react'
import { User } from '@supabase/supabase-js'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Plus, Search, LogOut } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { ConnectRepositoryDialog } from '@/components/connect-repository-dialog'
import { RepositoryCard } from '@/components/repository-card'
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

interface DashboardClientProps {
  user: User
}

export function DashboardClient({ user }: DashboardClientProps) {
  const [isConnectDialogOpen, setIsConnectDialogOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [platformFilter, setPlatformFilter] = useState('all')
  const supabase = createClient()

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    window.location.href = '/auth/signin'
  }

  // Mock data for now - will be replaced with real data from Supabase
  const repositories = []

  const filteredRepositories = repositories.filter((repo: any) => {
    const matchesSearch = repo.name.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesPlatform = platformFilter === 'all' || repo.platform === platformFilter
    return matchesSearch && matchesPlatform
  })

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation Bar */}
      <nav className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-bold text-gray-900">
                Project Documentation Generator
              </h1>
            </div>
            <div className="flex items-center space-x-4">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={user.user_metadata?.avatar_url} alt={user.email} />
                      <AvatarFallback>
                        {user.email?.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end" forceMount>
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none">
                        {user.user_metadata?.full_name || 'User'}
                      </p>
                      <p className="text-xs leading-none text-muted-foreground">
                        {user.email}
                      </p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleSignOut}>
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
        <div className="flex justify-between items-center mb-8">
          <div>
            <h2 className="text-3xl font-bold text-gray-900">My Repositories</h2>
            <p className="mt-1 text-sm text-gray-500">
              Connect and manage your repositories from multiple platforms
            </p>
          </div>
          <Button onClick={() => setIsConnectDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Connect Repository
          </Button>
        </div>

        {/* Stats Bar */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-sm font-medium text-gray-500">Total Repositories</div>
            <div className="mt-2 text-3xl font-bold text-gray-900">
              {repositories.length}
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-sm font-medium text-gray-500">Connected</div>
            <div className="mt-2 text-3xl font-bold text-green-600">
              {repositories.filter((r: any) => r.status === 'connected').length}
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-sm font-medium text-gray-500">Failed</div>
            <div className="mt-2 text-3xl font-bold text-red-600">
              {repositories.filter((r: any) => r.status === 'failed').length}
            </div>
          </div>
        </div>

        {/* Search & Filter Bar */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              type="text"
              placeholder="Search repositories..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
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
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <div className="mx-auto h-24 w-24 text-gray-400 mb-4">
              <svg
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No repositories connected
            </h3>
            <p className="text-gray-500 mb-6">
              Get started by connecting your first repository
            </p>
            <Button onClick={() => setIsConnectDialogOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Connect Your First Repository
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredRepositories.map((repo: any) => (
              <RepositoryCard key={repo.id} repository={repo} />
            ))}
          </div>
        )}
      </main>

      {/* Connect Repository Dialog */}
      <ConnectRepositoryDialog
        open={isConnectDialogOpen}
        onOpenChange={setIsConnectDialogOpen}
      />
    </div>
  )
}
