'use client'

import { useState, useEffect, createContext, useContext } from 'react'
import { User as AuthUser } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/client'
import { userServiceClient, UserWithAssignments } from '@/lib/services/user-service'

interface AuthContextType {
  user: AuthUser | null
  profile: UserWithAssignments | null
  loading: boolean
  signOut: () => Promise<void>
  refreshProfile: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export function useAuthState() {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [profile, setProfile] = useState<UserWithAssignments | null>(null)
  const [loading, setLoading] = useState(true)
  
  const supabase = createClient()

  const refreshProfile = async () => {
    if (!user) {
      setProfile(null)
      return
    }

    try {
      const userProfile = await userServiceClient.getCurrentUser()
      setProfile(userProfile)
    } catch (error) {
      console.error('Error fetching user profile:', error)
      setProfile(null)
    }
  }

  const signOut = async () => {
    const { error } = await supabase.auth.signOut()
    if (error) {
      console.error('Error signing out:', error)
      throw error
    }
    setUser(null)
    setProfile(null)
  }

  useEffect(() => {
    // Get initial session
    const getInitialSession = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      setUser(session?.user ?? null)
      setLoading(false)
    }

    getInitialSession()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setUser(session?.user ?? null)
        
        if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
          // Refresh profile when user signs in or token refreshes
          if (session?.user) {
            await refreshProfile()
          }
        } else if (event === 'SIGNED_OUT') {
          setProfile(null)
        }
        
        setLoading(false)
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  // Load profile when user changes
  useEffect(() => {
    if (user && !loading) {
      refreshProfile()
    }
  }, [user, loading])

  return {
    user,
    profile,
    loading,
    signOut,
    refreshProfile
  }
}