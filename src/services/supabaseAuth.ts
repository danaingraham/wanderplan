import { supabase } from '../lib/supabase'

export interface AuthError {
  message: string
  code?: string
}

export interface AuthResponse<T = any> {
  data?: T
  error?: AuthError
}

export const supabaseAuth = {
  // Sign up with email and password
  async signUp(email: string, password: string, fullName?: string): Promise<AuthResponse> {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
          }
        }
      })

      if (error) {
        return { error: { message: error.message, code: error.code } }
      }

      return { data }
    } catch (error: any) {
      return { error: { message: error.message || 'Sign up failed' } }
    }
  },

  // Sign in with email and password
  async signIn(email: string, password: string): Promise<AuthResponse> {
    try {
      console.log('[supabaseAuth] Attempting sign in for:', email)
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        console.error('[supabaseAuth] Sign in error:', error)
        return { error: { message: error.message, code: error.code } }
      }

      console.log('[supabaseAuth] Sign in successful, user:', data.user?.email)
      console.log('[supabaseAuth] Session exists:', !!data.session)
      
      // Verify session was stored
      const { data: sessionCheck } = await supabase.auth.getSession()
      console.log('[supabaseAuth] Session check after login:', !!sessionCheck.session)

      return { data }
    } catch (error: any) {
      console.error('[supabaseAuth] Unexpected error:', error)
      return { error: { message: error.message || 'Sign in failed' } }
    }
  },

  // Sign in with Google
  async signInWithGoogle(): Promise<AuthResponse> {
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/dashboard`
        }
      })

      if (error) {
        return { error: { message: error.message, code: error.code } }
      }

      return { data }
    } catch (error: any) {
      return { error: { message: error.message || 'Google sign in failed' } }
    }
  },

  // Sign out
  async signOut(): Promise<AuthResponse> {
    try {
      const { error } = await supabase.auth.signOut()

      if (error) {
        return { error: { message: error.message, code: error.code } }
      }

      return { data: { success: true } }
    } catch (error: any) {
      return { error: { message: error.message || 'Sign out failed' } }
    }
  },

  // Get current user
  async getCurrentUser() {
    try {
      const { data: { user }, error } = await supabase.auth.getUser()
      
      if (error) {
        return { error: { message: error.message, code: error.code } }
      }

      return { data: user }
    } catch (error: any) {
      return { error: { message: error.message || 'Failed to get user' } }
    }
  },

  // Get current session
  async getSession() {
    try {
      const { data: { session }, error } = await supabase.auth.getSession()
      
      if (error) {
        return { error: { message: error.message, code: error.code } }
      }

      return { data: session }
    } catch (error: any) {
      return { error: { message: error.message || 'Failed to get session' } }
    }
  },

  // Reset password
  async resetPassword(email: string): Promise<AuthResponse> {
    try {
      const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      })

      if (error) {
        return { error: { message: error.message, code: error.code } }
      }

      return { data }
    } catch (error: any) {
      return { error: { message: error.message || 'Password reset failed' } }
    }
  },

  // Update password
  async updatePassword(newPassword: string): Promise<AuthResponse> {
    try {
      const { data, error } = await supabase.auth.updateUser({
        password: newPassword
      })

      if (error) {
        return { error: { message: error.message, code: error.code } }
      }

      return { data }
    } catch (error: any) {
      return { error: { message: error.message || 'Password update failed' } }
    }
  },

  // Update profile
  async updateProfile(updates: { fullName?: string; username?: string }): Promise<AuthResponse> {
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser()
      
      if (userError || !user) {
        return { error: { message: 'User not authenticated' } }
      }

      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: updates.fullName,
          username: updates.username,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id)

      if (error) {
        return { error: { message: error.message } }
      }

      return { data: { success: true } }
    } catch (error: any) {
      return { error: { message: error.message || 'Profile update failed' } }
    }
  },

  // Subscribe to auth state changes
  onAuthStateChange(callback: (event: string, session: any) => void) {
    return supabase.auth.onAuthStateChange(callback)
  }
}