import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Dashboard } from '@/components/dashboard'

export default async function Home() {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth/signin')
  }

  // Fetch user's repositories
  const { data: repositories, error } = await supabase
    .from('repositories')
    .select('*')
    .order('created_at', { ascending: false })

  // Fetch user's profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  return (
    <Dashboard 
      user={user} 
      profile={profile}
      initialRepositories={repositories || []}
    />
  )
}
