import { createContext, useContext, useState, useEffect } from 'react'
import type { ReactNode } from 'react'
import type { User } from '../types'
import { storage, STORAGE_KEYS } from '../utils/storage'
import { emailService } from '../services/emailService'
import { googleAuthService } from '../services/googleAuthService'

interface UserContextType {
  user: User | null
  setUser: (user: User | null) => void
  isAuthenticated: boolean
  login: (email: string, password: string) => Promise<boolean>
  register: (email: string, password: string, fullName: string) => Promise<boolean>
  loginWithGoogle: () => Promise<{ success: boolean; error?: string }>
  requestPasswordReset: (email: string) => Promise<{ success: boolean; error?: string }>
  resetPassword: (token: string, email: string, newPassword: string) => Promise<{ success: boolean; error?: string }>
  logout: () => void
  updateProfile: (updates: Partial<User>) => void
  getAllUsers: () => User[]
  refreshSession: () => void
}

const UserContext = createContext<UserContextType | undefined>(undefined)

// Generate a unique user ID
const generateUserId = () => `user-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

// Hash password (simple demo version - in production use proper hashing)
const hashPassword = (password: string) => btoa(password + 'wanderplan-salt')

export function UserProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [sessionChecked, setSessionChecked] = useState(false)

  useEffect(() => {
    // Prevent double-initialization in StrictMode
    if (sessionChecked) return
    
    console.log('🔐 UserContext: Checking for existing session...')
    
    // Check for existing login session
    const savedUser = storage.get<User>(STORAGE_KEYS.USER)
    const currentSession = storage.get<string>('wanderplan_session')
    const sessionExpiry = storage.get<string>('wanderplan_session_expiry')
    
    console.log('🔐 UserContext: Found saved user:', !!savedUser)
    console.log('🔐 UserContext: Found session:', !!currentSession)
    console.log('🔐 UserContext: Session expiry:', sessionExpiry ? new Date(parseInt(sessionExpiry)) : 'none')
    
    if (savedUser && currentSession) {
      // Check if session has expired
      if (sessionExpiry && parseInt(sessionExpiry) > Date.now()) {
        console.log('🔐 UserContext: Restoring valid session for user:', savedUser.email)
        setUser(savedUser)
      } else if (!sessionExpiry) {
        // Old session without expiry - keep it valid (backward compatibility)
        console.log('🔐 UserContext: Restoring legacy session for user:', savedUser.email)
        setUser(savedUser)
        
        // Add expiry to legacy session
        const newExpiry = Date.now() + (30 * 24 * 60 * 60 * 1000)
        storage.set('wanderplan_session_expiry', newExpiry.toString())
      } else {
        console.log('🔐 UserContext: Session expired, clearing...')
        storage.remove(STORAGE_KEYS.USER)
        storage.remove('wanderplan_session')
        storage.remove('wanderplan_session_expiry')
      }
    } else {
      console.log('🔐 UserContext: No valid session found')
    }
    
    setSessionChecked(true)
  }, [])

  // Add debugging to track when user state changes and recover from storage
  useEffect(() => {
    if (sessionChecked) {
      console.log('🔐 UserContext: User state changed:', user ? user.email : 'null')
      if (!user) {
        console.log('🔐 UserContext: User was logged out! Checking storage...')
        const storageUser = storage.get<User>(STORAGE_KEYS.USER)
        const storageSession = storage.get<string>('wanderplan_session')
        const sessionExpiry = storage.get<string>('wanderplan_session_expiry')
        console.log('🔐 UserContext: Storage still has user:', !!storageUser)
        console.log('🔐 UserContext: Storage still has session:', !!storageSession)
        
        // If storage has valid session but user state is null, restore it
        if (storageUser && storageSession && sessionExpiry && parseInt(sessionExpiry) > Date.now()) {
          console.log('🔧 UserContext: Restoring user from storage due to unexpected logout')
          setUser(storageUser)
        }
      }
    }
  }, [user, sessionChecked])

  const login = async (email: string, password: string): Promise<boolean> => {
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    console.log('🔐 UserContext: Attempting login for:', email)
    
    // Get all registered users
    const users = storage.get<User[]>('wanderplan_users') || []
    const hashedPassword = hashPassword(password)
    
    // Find user with matching email and password
    const foundUser = users.find(u => 
      u.email === email && 
      storage.get<string>(`wanderplan_password_${u.id}`) === hashedPassword
    )
    
    if (foundUser) {
      console.log('🔐 UserContext: Login successful for:', foundUser.email)
      setUser(foundUser)
      storage.set(STORAGE_KEYS.USER, foundUser)
      storage.set('wanderplan_session', foundUser.id)
      
      // Set a long-lived session (30 days)
      const sessionExpiry = Date.now() + (30 * 24 * 60 * 60 * 1000)
      storage.set('wanderplan_session_expiry', sessionExpiry.toString())
      
      return true
    }
    
    console.log('🔐 UserContext: Login failed - invalid credentials')
    return false
  }

  const register = async (email: string, password: string, fullName: string): Promise<boolean> => {
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    // Get existing users
    const users = storage.get<User[]>('wanderplan_users') || []
    
    // Check if email already exists
    if (users.some(u => u.email === email)) {
      return false
    }
    
    // Create new user
    const newUser: User = {
      id: generateUserId(),
      email,
      full_name: fullName,
      role: 'user',
      auth_provider: 'local',
      email_verified: false,
      created_date: new Date().toISOString(),
      updated_date: new Date().toISOString()
    }
    
    // Save user and password
    const updatedUsers = [...users, newUser]
    storage.set('wanderplan_users', updatedUsers)
    storage.set(`wanderplan_password_${newUser.id}`, hashPassword(password))
    
    // Log them in
    setUser(newUser)
    storage.set(STORAGE_KEYS.USER, newUser)
    storage.set('wanderplan_session', newUser.id)
    
    // Set a long-lived session (30 days)
    const sessionExpiry = Date.now() + (30 * 24 * 60 * 60 * 1000)
    storage.set('wanderplan_session_expiry', sessionExpiry.toString())
    
    return true
  }

  const loginWithGoogle = async (): Promise<{ success: boolean; error?: string }> => {
    try {
      console.log('🔐 UserContext: Starting Google login...')
      
      const result = await googleAuthService.signInWithPopup()
      if (!result.success || !result.user) {
        return {
          success: false,
          error: result.error || 'Google sign-in failed'
        }
      }

      const googleUser = result.user
      const users = storage.get<User[]>('wanderplan_users') || []
      
      // Check if user exists by Google ID or email
      let existingUser = users.find(u => u.google_id === googleUser.id || u.email === googleUser.email)
      
      if (existingUser) {
        // Update existing user with Google data
        existingUser = {
          ...existingUser,
          google_id: googleUser.id,
          profile_picture: googleUser.picture,
          auth_provider: 'google',
          email_verified: true,
          updated_date: new Date().toISOString()
        }
        
        const updatedUsers = users.map(u => 
          (u.google_id === googleUser.id || u.email === googleUser.email) ? existingUser! : u
        )
        storage.set('wanderplan_users', updatedUsers)
      } else {
        // Create new user from Google data
        const newUser = {
          ...googleAuthService.convertGoogleUserToAppUser(googleUser),
          auth_provider: 'google' as const,
          email_verified: true,
          created_date: new Date().toISOString(),
          updated_date: new Date().toISOString()
        }
        
        const updatedUsers = [...users, newUser]
        storage.set('wanderplan_users', updatedUsers)
        existingUser = newUser
      }

      // Log them in
      setUser(existingUser)
      storage.set(STORAGE_KEYS.USER, existingUser)
      storage.set('wanderplan_session', existingUser.id)
      
      const sessionExpiry = Date.now() + (30 * 24 * 60 * 60 * 1000)
      storage.set('wanderplan_session_expiry', sessionExpiry.toString())

      console.log('✅ UserContext: Google login successful:', existingUser.email)
      return { success: true }
    } catch (error) {
      console.error('❌ UserContext: Google login failed:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Google login failed'
      }
    }
  }

  const requestPasswordReset = async (email: string): Promise<{ success: boolean; error?: string }> => {
    try {
      console.log('🔐 UserContext: Requesting password reset for:', email)
      
      const users = storage.get<User[]>('wanderplan_users') || []
      const user = users.find(u => u.email === email)
      
      if (!user) {
        // Don't reveal if email exists for security
        return { success: true }
      }

      // Don't allow password reset for Google users
      if (user.auth_provider === 'google') {
        return {
          success: false,
          error: 'This account uses Google sign-in. Please use Google to sign in.'
        }
      }

      const result = await emailService.sendPasswordResetEmail(email, user.full_name)
      return result
    } catch (error) {
      console.error('❌ UserContext: Password reset request failed:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to send password reset email'
      }
    }
  }

  const resetPassword = async (token: string, email: string, newPassword: string): Promise<{ success: boolean; error?: string }> => {
    try {
      console.log('🔐 UserContext: Resetting password for:', email)
      
      // Validate reset token
      const tokenValidation = emailService.validateResetToken(token, email)
      if (!tokenValidation.valid) {
        return {
          success: false,
          error: tokenValidation.error
        }
      }

      const users = storage.get<User[]>('wanderplan_users') || []
      const userIndex = users.findIndex(u => u.email === email)
      
      if (userIndex === -1) {
        return {
          success: false,
          error: 'User not found'
        }
      }

      const user = users[userIndex]
      
      // Don't allow password reset for Google users
      if (user.auth_provider === 'google') {
        return {
          success: false,
          error: 'This account uses Google sign-in. Password reset is not available.'
        }
      }

      // Update password
      const hashedPassword = hashPassword(newPassword)
      storage.set(`wanderplan_password_${user.id}`, hashedPassword)
      
      // Update user record
      users[userIndex] = {
        ...user,
        updated_date: new Date().toISOString()
      }
      storage.set('wanderplan_users', users)
      
      // Mark token as used
      emailService.markResetTokenAsUsed(token, email)
      
      console.log('✅ UserContext: Password reset successful')
      return { success: true }
    } catch (error) {
      console.error('❌ UserContext: Password reset failed:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Password reset failed'
      }
    }
  }

  const logout = async () => {
    console.log('🔐 UserContext: Logging out user')
    
    // Sign out from Google if applicable
    if (user?.auth_provider === 'google') {
      await googleAuthService.signOut()
    }
    
    setUser(null)
    storage.remove(STORAGE_KEYS.USER)
    storage.remove('wanderplan_session')
    storage.remove('wanderplan_session_expiry')
  }

  const getAllUsers = (): User[] => {
    return storage.get<User[]>('wanderplan_users') || []
  }

  const updateProfile = (updates: Partial<User>) => {
    if (user) {
      const updatedUser = {
        ...user,
        ...updates,
        updated_date: new Date().toISOString()
      }
      setUser(updatedUser)
      storage.set(STORAGE_KEYS.USER, updatedUser)
    }
  }

  const refreshSession = () => {
    const isDevelopment = import.meta.env.DEV
    if (isDevelopment) {
      console.log('🔐 UserContext: Refreshing session...')
    }
    
    const savedUser = storage.get<User>(STORAGE_KEYS.USER)
    const currentSession = storage.get<string>('wanderplan_session')
    const sessionExpiry = storage.get<string>('wanderplan_session_expiry')
    
    if (isDevelopment) {
      console.log('🔐 UserContext: Session check - User:', !!savedUser, 'Session:', !!currentSession, 'Valid:', sessionExpiry ? parseInt(sessionExpiry) > Date.now() : false)
    }
    
    if (savedUser && currentSession && sessionExpiry && parseInt(sessionExpiry) > Date.now()) {
      // Extend session by another 30 days
      const newExpiry = Date.now() + (30 * 24 * 60 * 60 * 1000)
      storage.set('wanderplan_session_expiry', newExpiry.toString())
      
      if (!user) {
        console.log('🔐 UserContext: Restoring user from valid session')
        setUser(savedUser)
      }
    } else if (isDevelopment) {
      console.warn('🔐 UserContext: Session refresh failed - clearing invalid session data')
      if (savedUser && currentSession && (!sessionExpiry || parseInt(sessionExpiry) <= Date.now())) {
        // Clean up expired session
        storage.remove(STORAGE_KEYS.USER)
        storage.remove('wanderplan_session')
        storage.remove('wanderplan_session_expiry')
        setUser(null)
      }
    }
  }

  // Periodic session check and refresh - less aggressive in development
  useEffect(() => {
    if (!user) return

    // Less frequent checks in development to avoid interference
    const isDevelopment = import.meta.env.DEV
    const checkInterval = isDevelopment ? 15 * 60 * 1000 : 5 * 60 * 1000 // 15 min dev, 5 min prod

    const interval = setInterval(() => {
      console.log('🔐 UserContext: Periodic session check...', isDevelopment ? '(dev mode)' : '(prod mode)')
      refreshSession()
    }, checkInterval)

    return () => clearInterval(interval)
  }, [user])

  // Refresh session on user activity
  useEffect(() => {
    if (!user) return

    let isActive = true // Prevent stale closures

    const handleActivity = () => {
      if (!isActive) return
      
      try {
        // Throttle session refresh to once per minute
        const lastRefresh = parseInt(localStorage.getItem('wanderplan_last_refresh') || '0')
        if (Date.now() - lastRefresh > 60000) { // 1 minute
          refreshSession()
          localStorage.setItem('wanderplan_last_refresh', Date.now().toString())
        }
      } catch (error) {
        console.error('🔐 UserContext: Error in activity handler:', error)
      }
    }

    // Listen for user activity
    const events = ['click', 'keypress', 'scroll', 'mousemove']
    events.forEach(event => {
      document.addEventListener(event, handleActivity, { passive: true })
    })

    return () => {
      isActive = false
      events.forEach(event => {
        document.removeEventListener(event, handleActivity)
      })
    }
  }, [user])

  const value: UserContextType = {
    user,
    setUser,
    isAuthenticated: !!user,
    login,
    register,
    loginWithGoogle,
    requestPasswordReset,
    resetPassword,
    logout,
    updateProfile,
    getAllUsers,
    refreshSession
  }

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>
}

export function useUser() {
  const context = useContext(UserContext)
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider')
  }
  return context
}