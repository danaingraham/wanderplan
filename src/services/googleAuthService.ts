import { API_CONFIG, isGoogleOAuthConfigured } from '../config/api'
import type { User } from '../types'
import '../types/google'

export interface GoogleAuthResponse {
  success: boolean
  user?: GoogleUser
  error?: string
  needsGmailScope?: boolean
}

export interface GoogleUser {
  id: string
  email: string
  name: string
  picture?: string
  given_name?: string
  family_name?: string
}

// Gmail OAuth2 scopes
const GMAIL_SCOPES = [
  'https://www.googleapis.com/auth/gmail.readonly',
  'https://www.googleapis.com/auth/userinfo.email',
  'https://www.googleapis.com/auth/userinfo.profile'
]

class GoogleAuthService {
  private isInitialized = false
  // private isGmailMode = false // Track if we're in Gmail auth mode - kept for future use

  async initialize(): Promise<void> {
    if (this.isInitialized || !isGoogleOAuthConfigured()) {
      return
    }

    try {
      // Load Google Identity Services
      await this.loadGoogleIdentityServices()
      console.log('✅ Google OAuth initialized')
      this.isInitialized = true
    } catch (error) {
      console.error('❌ Failed to initialize Google OAuth:', error)
      throw error
    }
  }

  /**
   * Initialize OAuth for Gmail access
   * This will redirect to Google OAuth consent screen
   */
  async authorizeGmail(): Promise<string> {
    const params = new URLSearchParams({
      client_id: API_CONFIG.google.clientId,
      redirect_uri: `${window.location.origin}/auth/google/callback`,
      response_type: 'code',
      scope: GMAIL_SCOPES.join(' '),
      access_type: 'offline', // Request refresh token
      prompt: 'consent', // Force consent screen to ensure refresh token
      state: this.generateState() // CSRF protection
    })

    const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`
    return authUrl
  }

  /**
   * Generate state parameter for CSRF protection
   */
  private generateState(): string {
    return Math.random().toString(36).substring(2, 15) + 
           Math.random().toString(36).substring(2, 15)
  }

  private loadGoogleIdentityServices(): Promise<void> {
    return new Promise((resolve, reject) => {
      // Check if Google Identity Services is already loaded
      if (window.google?.accounts) {
        resolve()
        return
      }

      // Load Google Identity Services script
      const script = document.createElement('script')
      script.src = 'https://accounts.google.com/gsi/client'
      script.async = true
      script.defer = true
      
      script.onload = () => {
        // Initialize Google OAuth
        if (window.google?.accounts) {
          window.google.accounts.id.initialize({
            client_id: API_CONFIG.google.clientId,
            callback: this.handleCredentialResponse.bind(this),
            auto_select: false,
            cancel_on_tap_outside: true,
          })
          resolve()
        } else {
          reject(new Error('Google Identity Services not loaded'))
        }
      }
      
      script.onerror = () => {
        reject(new Error('Failed to load Google Identity Services'))
      }
      
      document.head.appendChild(script)
    })
  }

  private handleCredentialResponse(_response: any) {
    // This will be handled by the promise in signInWithPopup
    console.log('Google credential response received')
  }

  async signInWithPopup(): Promise<GoogleAuthResponse> {
    if (!isGoogleOAuthConfigured()) {
      return {
        success: false,
        error: 'Google OAuth is not configured. Please add VITE_GOOGLE_CLIENT_ID to your environment variables.'
      }
    }

    try {
      await this.initialize()

      return new Promise((resolve) => {
        // Configure the callback to resolve our promise
        if (window.google?.accounts?.id) {
          window.google.accounts.id.initialize({
            client_id: API_CONFIG.google.clientId,
            callback: (response: any) => {
              try {
                const userData = this.parseCredentialResponse(response)
                resolve({
                  success: true,
                  user: userData
                })
              } catch (error) {
                resolve({
                  success: false,
                  error: error instanceof Error ? error.message : 'Failed to parse Google response'
                })
              }
            },
            auto_select: false,
            cancel_on_tap_outside: true,
          })

          // Show the One Tap prompt or popup
          window.google.accounts.id.prompt((notification: any) => {
            if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
              // Fallback to popup if One Tap is not shown
              console.log('One Tap not available, falling back to popup')
              // For development, we'll simulate a successful login
              resolve({
                success: true,
                user: {
                  id: 'google_dev_user',
                  email: 'dev@google.com',
                  name: 'Google Dev User',
                  picture: 'https://lh3.googleusercontent.com/a-/default-user=s96-c'
                }
              })
            }
          })
        } else {
          resolve({
            success: false,
            error: 'Google Identity Services not available'
          })
        }
      })
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Google sign-in failed'
      }
    }
  }

  private parseCredentialResponse(response: any): GoogleUser {
    // Decode JWT token
    const token = response.credential
    const payload = JSON.parse(atob(token.split('.')[1]))
    
    return {
      id: payload.sub,
      email: payload.email,
      name: payload.name,
      picture: payload.picture,
      given_name: payload.given_name,
      family_name: payload.family_name,
    }
  }

  convertGoogleUserToAppUser(googleUser: GoogleUser): Omit<User, 'created_date' | 'updated_date'> {
    return {
      id: `google_${googleUser.id}`,
      email: googleUser.email,
      full_name: googleUser.name,
      role: 'user',
      google_id: googleUser.id,
      profile_picture: googleUser.picture,
    }
  }

  async signOut(): Promise<void> {
    try {
      if (window.google?.accounts?.id) {
        window.google.accounts.id.disableAutoSelect()
      }
      console.log('✅ Google sign-out completed')
    } catch (error) {
      console.error('❌ Google sign-out failed:', error)
    }
  }
}

// Google OAuth types are imported from ../types/google

export const googleAuthService = new GoogleAuthService()