import { createContext, useContext, useState, useEffect } from 'react'
import type { ReactNode } from 'react'
import type { User } from '../types'
import { storage, STORAGE_KEYS } from '../utils/storage'

interface UserContextType {
  user: User | null
  setUser: (user: User | null) => void
  isAuthenticated: boolean
  login: (email: string, password: string) => Promise<boolean>
  register: (email: string, password: string, fullName: string) => Promise<boolean>
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

  // Add debugging to track when user state changes
  useEffect(() => {
    if (sessionChecked) {
      console.log('🔐 UserContext: User state changed:', user ? user.email : 'null')
      if (!user) {
        console.log('🔐 UserContext: User was logged out! Checking storage...')
        const storageUser = storage.get<User>(STORAGE_KEYS.USER)
        const storageSession = storage.get<string>('wanderplan_session')
        console.log('🔐 UserContext: Storage still has user:', !!storageUser)
        console.log('🔐 UserContext: Storage still has session:', !!storageSession)
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

  const logout = () => {
    console.log('🔐 UserContext: Logging out user')
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
    console.log('🔐 UserContext: Refreshing session...')
    const savedUser = storage.get<User>(STORAGE_KEYS.USER)
    const currentSession = storage.get<string>('wanderplan_session')
    const sessionExpiry = storage.get<string>('wanderplan_session_expiry')
    
    if (savedUser && currentSession && sessionExpiry && parseInt(sessionExpiry) > Date.now()) {
      // Extend session by another 30 days
      const newExpiry = Date.now() + (30 * 24 * 60 * 60 * 1000)
      storage.set('wanderplan_session_expiry', newExpiry.toString())
      
      if (!user) {
        console.log('🔐 UserContext: Restoring user from valid session')
        setUser(savedUser)
      }
    }
  }

  // Periodic session check and refresh - run every 5 minutes
  useEffect(() => {
    if (!user) return

    const interval = setInterval(() => {
      console.log('🔐 UserContext: Periodic session check...')
      refreshSession()
    }, 5 * 60 * 1000) // 5 minutes

    return () => clearInterval(interval)
  }, [user])

  // Refresh session on user activity
  useEffect(() => {
    if (!user) return

    const handleActivity = () => {
      // Throttle session refresh to once per minute
      const lastRefresh = parseInt(localStorage.getItem('wanderplan_last_refresh') || '0')
      if (Date.now() - lastRefresh > 60000) { // 1 minute
        refreshSession()
        localStorage.setItem('wanderplan_last_refresh', Date.now().toString())
      }
    }

    // Listen for user activity
    const events = ['click', 'keypress', 'scroll', 'mousemove']
    events.forEach(event => {
      document.addEventListener(event, handleActivity, { passive: true })
    })

    return () => {
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