import { createClient } from '@/lib/supabase/client'
import { createClient as createServerClient } from '@/lib/supabase/server'
import { User } from '@/types/database'

export interface AuthUser {
  id: string
  email: string
  user_metadata?: Record<string, any>
  app_metadata?: Record<string, any>
}

export interface SignUpData {
  email: string
  password: string
  fullName: string
  phone?: string
  mobile?: string
  preferredContactMethod?: 'email' | 'text' | 'phone'
}

export interface SignInData {
  email: string
  password?: string // Optional for magic link
}

/**
 * Client-side authentication functions
 */
export const authClient = {
  /**
   * Sign up with email and password
   */
  async signUp(data: SignUpData) {
    const supabase = createClient()
    
    const { data: authData, error } = await supabase.auth.signUp({
      email: data.email,
      password: data.password,
      options: {
        data: {
          full_name: data.fullName,
          phone: data.phone,
          mobile: data.mobile,
          preferred_contact_method: data.preferredContactMethod || 'email'
        }
      }
    })

    if (error) {
      throw new Error(error.message)
    }

    return authData
  },

  /**
   * Sign in with email and password
   */
  async signInWithPassword(data: SignInData) {
    if (!data.password) {
      throw new Error('Password is required for password sign in')
    }

    const supabase = createClient()
    const { data: authData, error } = await supabase.auth.signInWithPassword({
      email: data.email,
      password: data.password
    })

    if (error) {
      throw new Error(error.message)
    }

    return authData
  },

  /**
   * Sign in with magic link
   */
  async signInWithMagicLink(email: string, redirectTo?: string) {
    const supabase = createClient()
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: redirectTo || `${window.location.origin}/auth/callback`
      }
    })

    if (error) {
      throw new Error(error.message)
    }

    return { message: 'Check your email for the login link!' }
  },

  /**
   * Sign out
   */
  async signOut() {
    const supabase = createClient()
    const { error } = await supabase.auth.signOut()
    
    if (error) {
      throw new Error(error.message)
    }
  },

  /**
   * Get current session
   */
  async getSession() {
    const supabase = createClient()
    const { data: { session }, error } = await supabase.auth.getSession()
    
    if (error) {
      throw new Error(error.message)
    }

    return session
  },

  /**
   * Get current user
   */
  async getUser() {
    const supabase = createClient()
    const { data: { user }, error } = await supabase.auth.getUser()
    
    if (error) {
      throw new Error(error.message)
    }

    return user
  },

  /**
   * Update user password
   */
  async updatePassword(newPassword: string) {
    const supabase = createClient()
    const { error } = await supabase.auth.updateUser({
      password: newPassword
    })

    if (error) {
      throw new Error(error.message)
    }
  },

  /**
   * Reset password
   */
  async resetPassword(email: string, redirectTo?: string) {
    const supabase = createClient()
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: redirectTo || `${window.location.origin}/auth/reset-password`
    })

    if (error) {
      throw new Error(error.message)
    }

    return { message: 'Check your email for the password reset link!' }
  },

  /**
   * Listen to auth state changes
   */
  onAuthStateChange(callback: (event: string, session: any) => void) {
    const supabase = createClient()
    return supabase.auth.onAuthStateChange(callback)
  }
}

/**
 * Server-side authentication functions
 */
export const authServer = {
  /**
   * Get current user on server
   */
  async getUser() {
    const supabase = await createServerClient()
    const { data: { user }, error } = await supabase.auth.getUser()
    
    if (error) {
      return null
    }

    return user
  },

  /**
   * Get current session on server
   */
  async getSession() {
    const supabase = await createServerClient()
    const { data: { session }, error } = await supabase.auth.getSession()
    
    if (error) {
      return null
    }

    return session
  },

  /**
   * Require authentication (throws if not authenticated)
   */
  async requireAuth() {
    const user = await this.getUser()
    if (!user) {
      throw new Error('Authentication required')
    }
    return user
  }
}

/**
 * Auth state management hook for React components
 */
export function useAuthState() {
  // This will be implemented as a React hook later
  // For now, just return the client functions
  return authClient
}