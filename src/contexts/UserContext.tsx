import { createContext, useContext, useState, useEffect } from 'react'
import type { ReactNode } from 'react'
import type { User } from '../types'
import { storage, STORAGE_KEYS } from '../utils/storage'
import { emailService } from '../services/emailService'
import { googleAuthService } from '../services/googleAuthService'

// Create environment-aware logging
const log = (...args: any[]) => {
  if (import.meta.env.DEV) {
    console.log(...args)
  }
}

interface UserContextType {
  user: User | null
  setUser: (user: User | null) => void
  isAuthenticated: boolean
  isInitialized: boolean
  login: (email: string, password: string) => Promise<boolean>
  register: (email: string, password: string, fullName: string) => Promise<boolean>
  loginWithGoogle: () => Promise<{ success: boolean; error?: string }>
  requestPasswordReset: (email: string) => Promise<{ success: boolean; error?: string }>
  resetPassword: (token: string, email: string, newPassword: string) => Promise<{ success: boolean; error?: string }>
  logout: () => void
  updateProfile: (updates: Partial<User>) => void
  getAllUsers: () => User[]
}

const UserContext = createContext<UserContextType | undefined>(undefined)

// Generate a unique user ID
const generateUserId = () => `user-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

// Hash password (simple demo version - in production use proper hashing)
const hashPassword = (password: string) => btoa(password + 'wanderplan-salt')

export function UserProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isInitialized, setIsInitialized] = useState(false)

  // Initialize auth state from persistent storage
  useEffect(() => {
    log('🔐 UserContext: Initializing auth state...')
    
    const authToken = storage.get<string>('authToken')
    const savedUser = storage.get<User>(STORAGE_KEYS.USER)
    
    log('🔐 UserContext: Auth token exists:', !!authToken)
    log('🔐 UserContext: Saved user exists:', !!savedUser)
    log('🔐 UserContext: Auth token value:', authToken ? `${authToken.substring(0, 20)}...` : 'null')
    log('🔐 UserContext: User data:', savedUser ? `${savedUser.email} (${savedUser.id})` : 'null')
    
    // Check if we have a valid auth token
    if (authToken && isTokenValid(authToken)) {
      if (savedUser) {
        // Both token and user data exist - restore session
        log('🔐 UserContext: Restoring session for user:', savedUser.email)
        setUser(savedUser)
      } else {
        // Token exists but no user data - this is suspicious, clear token
        log('🔐 UserContext: Auth token exists but no user data - clearing token')
        storage.remove('authToken')
      }
    } else if (authToken) {
      // Invalid token format - clear it
      log('🔐 UserContext: Invalid auth token format - clearing')
      storage.remove('authToken')
      storage.remove(STORAGE_KEYS.USER)
    } else if (savedUser) {
      // User data exists but no token - clear user data
      log('🔐 UserContext: User data exists but no auth token - clearing user data')
      storage.remove(STORAGE_KEYS.USER)
    } else {
      log('🔐 UserContext: No auth data found - starting fresh')
    }
    
    // Clean up legacy session keys regardless
    storage.remove('wanderplan_session')
    storage.remove('wanderplan_session_expiry')
    
    setIsInitialized(true)
  }, [])

  // Simple state logging (no session interference)
  useEffect(() => {
    if (isInitialized) {
      log('🔐 UserContext: User state:', user ? user.email : 'logged out')
    }
  }, [user, isInitialized])

  // Periodic auth state validation to catch unexpected logouts
  useEffect(() => {
    if (!isInitialized) return

    const validateAuthState = () => {
      const authToken = storage.get<string>('authToken')
      const savedUser = storage.get<User>(STORAGE_KEYS.USER)
      
      // If we think we're logged in but data is missing, that's a problem
      if (user && (!authToken || !savedUser)) {
        console.error('🚨 UserContext: Auth state corruption detected!')
        console.error('🚨 UserContext: User in state but missing storage data')
        console.error('🚨 UserContext: Token exists:', !!authToken)
        console.error('🚨 UserContext: User data exists:', !!savedUser)
        console.error('🚨 UserContext: Forcing logout to maintain consistency')
        setUser(null)
      }
      
      // If we think we're logged out but data exists, restore it
      if (!user && authToken && savedUser && isTokenValid(authToken)) {
        log('🔧 UserContext: Restoring lost session')
        log('🔧 UserContext: Token valid, user data available, restoring:', savedUser.email)
        setUser(savedUser)
      }
    }

    // Check immediately
    validateAuthState()
    
    // Check every 30 seconds
    const interval = setInterval(validateAuthState, 30000)
    
    return () => clearInterval(interval)
  }, [isInitialized, user])

  const login = async (email: string, password: string): Promise<boolean> => {
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    log('🔐 UserContext: Attempting login for:', email)
    
    // Get all registered users
    const users = storage.get<User[]>('wanderplan_users') || []
    const hashedPassword = hashPassword(password)
    
    // Find user with matching email and password
    const foundUser = users.find(u => 
      u.email === email && 
      storage.get<string>(`wanderplan_password_${u.id}`) === hashedPassword
    )
    
    if (foundUser) {
      log('🔐 UserContext: Login successful for:', foundUser.email)
      
      // Generate persistent auth token
      const authToken = `wanderplan_${foundUser.id}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      
      // Store token and user data
      storage.set('authToken', authToken)
      storage.set(STORAGE_KEYS.USER, foundUser)
      
      // Clean up old session keys
      storage.remove('wanderplan_session')
      storage.remove('wanderplan_session_expiry')
      
      setUser(foundUser)
      log('🔐 UserContext: Auth token stored, user logged in')
      
      return true
    }

    // DEVELOPMENT BYPASS: Auto-create account if it doesn't exist
    if (import.meta.env.DEV && email === 'danabressler@gmail.com') {
      log('🔧 UserContext: DEV BYPASS - Account not found, checking storage...')
      
      // First, let's see what's actually in storage
      const allTrips = storage.get<any[]>('wanderplan_trips') || []
      const allPlaces = storage.get<any[]>('wanderplan_places') || []
      
      log('📊 Storage contents:')
      log('  - Trips found:', allTrips.length)
      log('  - Places found:', allPlaces.length)
      log('  - All trip creators:', allTrips.map(t => t.created_by))
      
      // Ask for the user's actual name
      const userName = window.prompt(
        'Your account was recreated. What name would you like to use?',
        'Dana Ingraham'
      ) || 'User'
      
      // Create the user account
      const newUser: User = {
        id: generateUserId(),
        email,
        full_name: userName,
        role: 'admin',
        auth_provider: 'local',
        email_verified: true,
        created_date: new Date().toISOString(),
        updated_date: new Date().toISOString()
      }
      
      // Save user to users list
      const updatedUsers = [...users, newUser]
      storage.set('wanderplan_users', updatedUsers)
      
      // Save password hash
      storage.set(`wanderplan_password_${newUser.id}`, hashedPassword)
      
      // Generate auth token
      const authToken = `wanderplan_${newUser.id}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      storage.set('authToken', authToken)
      storage.set(STORAGE_KEYS.USER, newUser)
      
      log('✅ UserContext: DEV BYPASS - Account created for:', userName)
      
      // DEV BYPASS: Recover ALL trips regardless of creator - in dev mode assume they're all yours
      if (allTrips.length > 0) {
        log('🔧 UserContext: DEV BYPASS - Assigning ALL', allTrips.length, 'trips to new account')
        
        // Assign ALL trips to this user
        const updatedTrips = allTrips.map(trip => ({ 
          ...trip, 
          created_by: newUser.id 
        }))
        
        storage.set('wanderplan_trips', updatedTrips)
        log('✅ UserContext: DEV BYPASS - All trips reassigned to:', userName)
        
        // Force a page refresh to reload trip data
        setTimeout(() => {
          log('🔄 UserContext: Refreshing page to load trips')
          window.location.reload()
        }, 1000)
      } else {
        log('⚠️  UserContext: No trips found in storage to recover')
      }
      
      setUser(newUser)
      return true
    }
    
    log('🔐 UserContext: Login failed - invalid credentials')
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
    
    // Generate persistent auth token and log them in
    const authToken = `wanderplan_${newUser.id}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    
    storage.set('authToken', authToken)
    storage.set(STORAGE_KEYS.USER, newUser)
    
    setUser(newUser)
    log('🔐 UserContext: New user registered and logged in:', newUser.email)
    
    return true
  }

  const loginWithGoogle = async (): Promise<{ success: boolean; error?: string }> => {
    try {
      log('🔐 UserContext: Starting Google login...')
      
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

      // Generate persistent auth token and log them in
      const authToken = `wanderplan_${existingUser.id}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      
      storage.set('authToken', authToken)
      storage.set(STORAGE_KEYS.USER, existingUser)
      
      setUser(existingUser)
      log('✅ UserContext: Google login successful:', existingUser.email)
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
      log('🔐 UserContext: Requesting password reset for:', email)
      
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
      log('🔐 UserContext: Resetting password for:', email)
      
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
      
      log('✅ UserContext: Password reset successful')
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
    log('🔐 UserContext: Logging out user')
    log('🔐 UserContext: Current user before logout:', user?.email)
    
    // Sign out from Google if applicable
    if (user?.auth_provider === 'google') {
      try {
        await googleAuthService.signOut()
        log('🔐 UserContext: Google sign out completed')
      } catch (error) {
        console.error('🔐 UserContext: Google sign out failed:', error)
      }
    }
    
    // Clear all auth data
    storage.remove('authToken')
    storage.remove(STORAGE_KEYS.USER)
    
    // Clean up legacy session keys
    storage.remove('wanderplan_session')
    storage.remove('wanderplan_session_expiry')
    
    setUser(null)
    log('🔐 UserContext: User logged out, all auth data cleared')
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

  // Token validation helper
  const isTokenValid = (token: string): boolean => {
    // In a real app, you'd validate the token format and possibly check with server
    // For this demo, we just check if it exists and has the right format
    return token.startsWith('wanderplan_') && token.split('_').length >= 4
  }

  const value: UserContextType = {
    user,
    setUser,
    isAuthenticated: !!user,
    isInitialized,
    login,
    register,
    loginWithGoogle,
    requestPasswordReset,
    resetPassword,
    logout,
    updateProfile,
    getAllUsers
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