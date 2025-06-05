import { createClient } from '@/lib/supabase/server'
import { NextRequest } from 'next/server'
import { redirect } from 'next/navigation'

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  
  await supabase.auth.signOut()
  
  redirect('/auth/sign-in')
}