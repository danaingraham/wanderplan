import { storage } from './storage'

export interface AuthState {
  isAuthenticated: boolean
  authToken: string | null
  userId: string | null
}

/**
 * Check if the current auth token is valid
 */
export function isAuthTokenValid(token: string | null): boolean {
  if (!token) return false
  
  // Check token format: wanderplan_{userId}_{timestamp}_{random}
  const parts = token.split('_')
  if (parts.length < 4) return false
  if (parts[0] !== 'wanderplan') return false
  
  // In a real app, you might also check token expiry or validate with server
  return true
}

/**
 * Get current auth state from localStorage
 */
export function getAuthState(): AuthState {
  const authToken = storage.get<string>('authToken')
  const user = storage.get<any>('wanderplan_user')
  
  const isValid = isAuthTokenValid(authToken)
  
  return {
    isAuthenticated: isValid && !!user,
    authToken: isValid ? authToken : null,
    userId: user?.id || null
  }
}

/**
 * Clear all auth data
 */
export function clearAuthData(): void {
  storage.remove('authToken')
  storage.remove('wanderplan_user')
  
  // Clean up legacy keys
  storage.remove('wanderplan_session')
  storage.remove('wanderplan_session_expiry')
}

/**
 * Store auth data after successful login
 */
export function setAuthData(user: any): string {
  const authToken = `wanderplan_${user.id}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  
  storage.set('authToken', authToken)
  storage.set('wanderplan_user', user)
  
  return authToken
}