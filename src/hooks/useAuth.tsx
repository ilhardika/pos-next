'use client'

import React, { useState, useEffect, useContext, createContext } from 'react'
import type { ReactNode } from 'react'
import {
  AuthUser,
  UserProfile,
  getCurrentUser,
  getUserProfile,
  onAuthStateChange,
} from '@/lib/auth'

interface AuthContextType {
  user: AuthUser | null
  profile: UserProfile | null
  loading: boolean
  signOut: () => Promise<void>
  refreshProfile: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)

  const refreshProfile = async () => {
    if (user) {
      try {
        const userProfile = await getUserProfile(user.id)
        setProfile(userProfile)
      } catch (error) {
        console.error('Error fetching user profile:', error)
        setProfile(null)
      }
    } else {
      setProfile(null)
    }
  }

  const handleSignOut = async () => {
    const { signOut } = await import('@/lib/auth')
    try {
      await signOut()
      setUser(null)
      setProfile(null)
    } catch (error) {
      console.error('Error signing out:', error)
      throw error
    }
  }

  useEffect(() => {
    // Get initial user
    getCurrentUser()
      .then(setUser)
      .catch(console.error)
      .finally(() => setLoading(false))

    // Listen for auth changes
    const { data: { subscription } } = onAuthStateChange((user) => {
      setUser(user)
      setLoading(false)
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  // Fetch profile when user changes
  useEffect(() => {
    refreshProfile()
  }, [user])

  const value = {
    user,
    profile,
    loading,
    signOut: handleSignOut,
    refreshProfile,
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

// Hook to check if user is authenticated
export function useRequireAuth() {
  const { user, loading } = useAuth()
  
  return {
    user,
    loading,
    isAuthenticated: !!user,
  }
}

// Hook to check user permissions
export function usePermissions() {
  const { profile } = useAuth()
  
  const hasPermission = (requiredRole: 'owner' | 'cashier'): boolean => {
    if (!profile) return false
    
    if (requiredRole === 'cashier') {
      return true // Both owner and cashier can perform cashier actions
    }
    
    return profile.role === 'owner' // Only owner can perform owner actions
  }

  const isOwner = profile?.role === 'owner'
  const isCashier = profile?.role === 'cashier'

  return {
    hasPermission,
    isOwner,
    isCashier,
    role: profile?.role,
  }
}
