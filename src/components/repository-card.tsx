'use client'

import { useState } from 'react'
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Github, MoreVertical, ExternalLink, RefreshCw, Trash2, Star, GitFork, Lock, Globe } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { Repository, Platform } from '@/types/database'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'

interface RepositoryCardProps {
  repository: Repository
  onDelete: (id: string) => void
}

// Platform icons
const PlatformIcon = ({ platform }: { platform: Platform }) => {
  switch (platform) {
    case 'github':
      return <Github className="h-5 w-5" />
    case 'gitlab':
      return (
        <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
          <path d="M22.65 14.39L12 22.13 1.35 14.39a.84.84 0 0 1-.3-.94l1.22-3.78 2.44-7.51A.42.42 0 0 1 4.82 2a.43.43 0 0 1 .58 0 .42.42 0 0 1 .11.18l2.44 7.49h8.1l2.44-7.51A.42.42 0 0 1 18.6 2a.43.43 0 0 1 .58 0 .42.42 0 0 1 .11.18l2.44 7.51L23 13.45a.84.84 0 0 1-.35.94z"/>
        </svg>
      )
    case 'replit':
      return (
        <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
          <path d="M2 6a2 2 0 0 1 2-2h7v8H4a2 2 0 0 1-2-2V6zm9 0h9a2 2 0 0 1 2 2v4a2 2 0 0 1-2 2h-9V6zm0 10h7a2 2 0 0 1 2 2v2a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2v-2a2 2 0 0 1 2-2h7z"/>
        </svg>
      )
    case 'lovable':
      return (
        <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
        </svg>
      )
    default:
      return <Github className="h-5 w-5" />
  }
}

const statusColors = {
  connected: 'bg-green-500/10 text-green-500 border-green-500/20',
  failed: 'bg-destructive/10 text-destructive border-destructive/20',
  pending: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20',
}

const statusLabels = {
  connected: 'Connected',
  failed: 'Failed',
  pending: 'Pending',
}

export function RepositoryCard({ repository, onDelete }: RepositoryCardProps) {
  const [isDeleting, setIsDeleting] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const supabase = createClient()

  const handleDelete = async () => {
    setIsDeleting(true)
    try {
      const { error } = await supabase
        .from('repositories')
        .delete()
        .eq('id', repository.id)

      if (error) throw error
      
      onDelete(repository.id)
    } catch (error) {
      toast.error('Failed to disconnect repository')
    } finally {
      setIsDeleting(false)
      setShowDeleteDialog(false)
    }
  }

  const handleRefresh = async () => {
    toast.info('Refreshing repository...')
    // TODO: Implement refresh logic with GitHub/GitLab API
  }

  const handleOpenExternal = () => {
    window.open(repository.repo_url, '_blank')
  }

  return (
    <>
      <Card className="hover:border-primary/50 transition-colors">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-muted rounded-lg">
                <PlatformIcon platform={repository.platform} />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold truncate">{repository.repo_name}</h3>
                <p className="text-sm text-muted-foreground truncate">
                  {repository.repo_owner}
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
                <DropdownMenuItem onClick={handleOpenExternal}>
                  <ExternalLink className="mr-2 h-4 w-4" />
                  Open in {repository.platform}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleRefresh}>
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Refresh
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => setShowDeleteDialog(true)}
                  className="text-destructive focus:text-destructive"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Disconnect
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </CardHeader>

        <CardContent className="space-y-3">
          <div className="flex items-center gap-2 flex-wrap">
            <Badge variant="outline" className={statusColors[repository.status]}>
              {statusLabels[repository.status]}
            </Badge>
            <Badge variant="outline" className="flex items-center gap-1">
              {repository.is_private ? (
                <>
                  <Lock className="h-3 w-3" />
                  Private
                </>
              ) : (
                <>
                  <Globe className="h-3 w-3" />
                  Public
                </>
              )}
            </Badge>
          </div>

          {repository.metadata && (repository.platform === 'github' || repository.platform === 'gitlab') && (
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              {repository.metadata.stars !== undefined && (
                <div className="flex items-center gap-1">
                  <Star className="h-4 w-4" />
                  <span>{repository.metadata.stars}</span>
                </div>
              )}
              {repository.metadata.forks !== undefined && (
                <div className="flex items-center gap-1">
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

          {repository.error_message && repository.status === 'failed' && (
            <p className="text-sm text-destructive">{repository.error_message}</p>
          )}
        </CardContent>

        <CardFooter className="pt-3 border-t">
          <div className="text-xs text-muted-foreground">
            {repository.last_synced_at 
              ? `Synced ${formatDistanceToNow(new Date(repository.last_synced_at), { addSuffix: true })}`
              : `Added ${formatDistanceToNow(new Date(repository.created_at), { addSuffix: true })}`
            }
          </div>
        </CardFooter>
      </Card>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Disconnect Repository?</AlertDialogTitle>
            <AlertDialogDescription>
              This will remove <span className="font-medium">{repository.repo_name}</span> from your connected repositories. 
              You can always reconnect it later.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? 'Disconnecting...' : 'Disconnect'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
