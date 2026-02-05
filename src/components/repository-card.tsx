'use client'

import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Github, GitlabIcon as GitLab, MoreVertical, Eye, RefreshCw, Trash2, Star, GitFork } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'

interface Repository {
  id: string
  platform: 'github' | 'gitlab' | 'replit' | 'lovable'
  name: string
  owner: string
  url: string
  isPrivate: boolean
  status: 'connected' | 'failed' | 'pending'
  metadata?: {
    stars?: number
    forks?: number
    lastCommit?: string
    language?: string
  }
  lastSyncedAt: string
  createdAt: string
}

interface RepositoryCardProps {
  repository: Repository
}

const platformIcons = {
  github: Github,
  gitlab: GitLab,
  replit: () => (
    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2L2 7v10l10 5 10-5V7L12 2zm0 2.18l7.45 3.73L12 11.64 4.55 7.91 12 4.18zM4 9.45l7 3.5v6.87l-7-3.5V9.45zm9 10.37v-6.87l7-3.5v6.87l-7 3.5z" />
    </svg>
  ),
  lovable: () => (
    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2L2 7v10l10 5 10-5V7L12 2z" />
    </svg>
  ),
}

const statusColors = {
  connected: 'bg-green-100 text-green-800 border-green-200',
  failed: 'bg-red-100 text-red-800 border-red-200',
  pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
}

const statusLabels = {
  connected: 'Connected',
  failed: 'Failed',
  pending: 'Pending',
}

export function RepositoryCard({ repository }: RepositoryCardProps) {
  const PlatformIcon = platformIcons[repository.platform]

  const handleViewDetails = () => {
    // TODO: Navigate to repository details page
    console.log('View details:', repository.id)
  }

  const handleReconnect = () => {
    // TODO: Implement reconnect logic
    console.log('Reconnect:', repository.id)
  }

  const handleDisconnect = () => {
    // TODO: Implement disconnect logic
    console.log('Disconnect:', repository.id)
  }

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-2">
            <div className="p-2 bg-gray-100 rounded-lg">
              <PlatformIcon className="h-5 w-5 text-gray-700" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-lg truncate">{repository.name}</h3>
              <p className="text-sm text-muted-foreground truncate">
                {repository.owner}
              </p>
            </div>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={handleViewDetails}>
                <Eye className="mr-2 h-4 w-4" />
                View Details
              </DropdownMenuItem>
              {repository.status === 'failed' && (
                <DropdownMenuItem onClick={handleReconnect}>
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Reconnect
                </DropdownMenuItem>
              )}
              <DropdownMenuItem
                onClick={handleDisconnect}
                className="text-red-600"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Disconnect
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        <div className="flex items-center space-x-2">
          <Badge
            variant="outline"
            className={statusColors[repository.status]}
          >
            {statusLabels[repository.status]}
          </Badge>
          {repository.isPrivate && (
            <Badge variant="outline">Private</Badge>
          )}
        </div>

        {repository.metadata && (repository.platform === 'github' || repository.platform === 'gitlab') && (
          <div className="flex items-center space-x-4 text-sm text-muted-foreground">
            {repository.metadata.stars !== undefined && (
              <div className="flex items-center space-x-1">
                <Star className="h-4 w-4" />
                <span>{repository.metadata.stars}</span>
              </div>
            )}
            {repository.metadata.forks !== undefined && (
              <div className="flex items-center space-x-1">
                <GitFork className="h-4 w-4" />
                <span>{repository.metadata.forks}</span>
              </div>
            )}
          </div>
        )}

        {repository.metadata?.language && (
          <div className="text-sm text-muted-foreground">
            <span className="font-medium">Language:</span> {repository.metadata.language}
          </div>
        )}
      </CardContent>

      <CardFooter className="pt-3 border-t">
        <div className="text-xs text-muted-foreground">
          Last synced {formatDistanceToNow(new Date(repository.lastSyncedAt), { addSuffix: true })}
        </div>
      </CardFooter>
    </Card>
  )
}
