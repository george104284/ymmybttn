import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export default async function AuthCallback({
  searchParams
}: {
  searchParams: { code?: string; error?: string }
}) {
  const { code, error } = searchParams

  if (error) {
    console.error('Auth callback error:', error)
    redirect('/auth/sign-in?error=callback_error')
  }

  if (code) {
    const supabase = await createClient()
    
    try {
      // Exchange code for session
      const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)
      
      if (exchangeError) {
        console.error('Code exchange error:', exchangeError)
        redirect('/auth/sign-in?error=exchange_error')
      }

      // Redirect to dashboard - user sync will happen via database triggers
      redirect('/dashboard')
    } catch (err) {
      console.error('Unexpected auth callback error:', err)
      redirect('/auth/sign-in?error=unexpected_error')
    }
  }

  // No code provided
  redirect('/auth/sign-in?error=no_code')
}