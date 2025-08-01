import { createContext, useContext, useState, useEffect } from 'react'
import type { ReactNode } from 'react'
import type { User } from '../types'
import { storage, STORAGE_KEYS } from '../utils/storage'

interface UserContextType {
  user: User | null
  setUser: (user: User | null) => void
  isAuthenticated: boolean
  login: (email: string, password: string) => Promise<boolean>
  logout: () => void
  updateProfile: (updates: Partial<User>) => void
}

const UserContext = createContext<UserContextType | undefined>(undefined)

const mockUser: User = {
  id: 'user-1',
  email: 'demo@wanderplan.com',
  full_name: 'Demo User',
  role: 'user',
  profile_picture_url: undefined,
  created_date: new Date().toISOString(),
  updated_date: new Date().toISOString()
}

export function UserProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)

  useEffect(() => {
    const savedUser = storage.get<User>(STORAGE_KEYS.USER)
    if (savedUser) {
      setUser(savedUser)
    } else {
      setUser(mockUser)
      storage.set(STORAGE_KEYS.USER, mockUser)
    }
  }, [])

  const login = async (email: string, password: string): Promise<boolean> => {
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    if (email && password) {
      const loginUser = { ...mockUser, email }
      setUser(loginUser)
      storage.set(STORAGE_KEYS.USER, loginUser)
      return true
    }
    return false
  }

  const logout = () => {
    setUser(null)
    storage.remove(STORAGE_KEYS.USER)
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

  const value: UserContextType = {
    user,
    setUser,
    isAuthenticated: !!user,
    login,
    logout,
    updateProfile
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