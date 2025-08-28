import { supabase } from '../../lib/supabase'

// Gmail OAuth configuration
const GMAIL_OAUTH_CONFIG = {
  clientId: import.meta.env.VITE_GOOGLE_CLIENT_ID,
  clientSecret: import.meta.env.VITE_GOOGLE_CLIENT_SECRET,
  redirectUri: import.meta.env.VITE_GOOGLE_REDIRECT_URI || 'http://localhost:5173/auth/google/callback',
  authorizationBaseUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
  tokenUrl: 'https://oauth2.googleapis.com/token',
  scopes: [
    'https://www.googleapis.com/auth/gmail.readonly',
    'https://www.googleapis.com/auth/userinfo.email',
    'https://www.googleapis.com/auth/userinfo.profile'
  ]
}

export interface GmailAuthTokens {
  access_token: string
  refresh_token?: string
  token_type: string
  expires_in: number
  scope: string
}

export interface GmailConnection {
  isConnected: boolean
  lastSyncDate?: string
  syncEnabled?: boolean
  userEmail?: string
}

class GmailAuthService {
  /**
   * Generate the OAuth authorization URL
   * User will be redirected here to grant permissions
   */
  getAuthorizationUrl(): string {
    const params = new URLSearchParams({
      client_id: GMAIL_OAUTH_CONFIG.clientId,
      redirect_uri: GMAIL_OAUTH_CONFIG.redirectUri,
      response_type: 'code',
      scope: GMAIL_OAUTH_CONFIG.scopes.join(' '),
      access_type: 'offline', // Request refresh token
      prompt: 'consent', // Force consent screen to ensure refresh token
      state: this.generateState() // CSRF protection
    })

    return `${GMAIL_OAUTH_CONFIG.authorizationBaseUrl}?${params.toString()}`
  }

  /**
   * Exchange authorization code for access tokens
   */
  async exchangeCodeForTokens(code: string): Promise<GmailAuthTokens> {
    const params = new URLSearchParams({
      code,
      client_id: GMAIL_OAUTH_CONFIG.clientId,
      client_secret: GMAIL_OAUTH_CONFIG.clientSecret,
      redirect_uri: GMAIL_OAUTH_CONFIG.redirectUri,
      grant_type: 'authorization_code'
    })

    try {
      const response = await fetch(GMAIL_OAUTH_CONFIG.tokenUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: params.toString()
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(`Token exchange failed: ${error.error_description || error.error}`)
      }

      const tokens = await response.json() as GmailAuthTokens
      return tokens
    } catch (error) {
      console.error('Failed to exchange code for tokens:', error)
      throw error
    }
  }

  /**
   * Refresh the access token using the refresh token
   */
  async refreshAccessToken(refreshToken: string): Promise<GmailAuthTokens> {
    const params = new URLSearchParams({
      refresh_token: refreshToken,
      client_id: GMAIL_OAUTH_CONFIG.clientId,
      client_secret: GMAIL_OAUTH_CONFIG.clientSecret,
      grant_type: 'refresh_token'
    })

    try {
      const response = await fetch(GMAIL_OAUTH_CONFIG.tokenUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: params.toString()
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(`Token refresh failed: ${error.error_description || error.error}`)
      }

      const tokens = await response.json() as GmailAuthTokens
      return tokens
    } catch (error) {
      console.error('Failed to refresh access token:', error)
      throw error
    }
  }

  /**
   * Save Gmail connection tokens to database
   */
  async saveConnection(userId: string, tokens: GmailAuthTokens, _userEmail?: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('gmail_connections')
        .upsert({
          user_id: userId,
          access_token: tokens.access_token, // In production, encrypt this
          refresh_token: tokens.refresh_token, // In production, encrypt this
          token_expiry: new Date(Date.now() + tokens.expires_in * 1000).toISOString(),
          sync_enabled: true,
          updated_at: new Date().toISOString()
        })

      if (error) {
        console.error('Failed to save Gmail connection:', error)
        throw error
      }

      console.log('✅ Gmail connection saved successfully')
    } catch (error) {
      console.error('Error saving Gmail connection:', error)
      throw error
    }
  }

  /**
   * Get Gmail connection status for a user
   */
  async getConnectionStatus(userId: string): Promise<GmailConnection> {
    try {
      const { data, error } = await supabase
        .from('gmail_connections')
        .select('*')
        .eq('user_id', userId)
        .single()

      if (error || !data) {
        return { isConnected: false }
      }

      return {
        isConnected: true,
        lastSyncDate: data.last_sync_date,
        syncEnabled: data.sync_enabled,
        userEmail: data.user_email
      }
    } catch (error) {
      console.error('Error checking Gmail connection:', error)
      return { isConnected: false }
    }
  }

  /**
   * Get stored tokens for a user
   */
  async getStoredTokens(userId: string): Promise<{ accessToken: string; refreshToken: string; expiry: string } | null> {
    try {
      const { data, error } = await supabase
        .from('gmail_connections')
        .select('access_token, refresh_token, token_expiry')
        .eq('user_id', userId)
        .single()

      if (error || !data) {
        return null
      }

      return {
        accessToken: data.access_token,
        refreshToken: data.refresh_token,
        expiry: data.token_expiry
      }
    } catch (error) {
      console.error('Error fetching stored tokens:', error)
      return null
    }
  }

  /**
   * Get valid access token, refreshing if necessary
   */
  async getValidAccessToken(userId: string): Promise<string | null> {
    const tokens = await this.getStoredTokens(userId)
    
    if (!tokens) {
      console.log('No stored tokens found')
      return null
    }

    // Check if token is expired
    const expiry = new Date(tokens.expiry)
    const now = new Date()
    const bufferTime = 5 * 60 * 1000 // 5 minutes buffer

    if (expiry.getTime() - now.getTime() > bufferTime) {
      // Token is still valid
      return tokens.accessToken
    }

    // Token expired or about to expire, refresh it
    if (!tokens.refreshToken) {
      console.error('No refresh token available')
      return null
    }

    try {
      console.log('🔄 Refreshing expired access token...')
      const newTokens = await this.refreshAccessToken(tokens.refreshToken)
      
      // Update stored tokens
      await supabase
        .from('gmail_connections')
        .update({
          access_token: newTokens.access_token,
          token_expiry: new Date(Date.now() + newTokens.expires_in * 1000).toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userId)

      return newTokens.access_token
    } catch (error) {
      console.error('Failed to refresh token:', error)
      return null
    }
  }

  /**
   * Disconnect Gmail (revoke access and delete stored tokens)
   */
  async disconnect(userId: string): Promise<void> {
    try {
      // Get the access token to revoke it
      const tokens = await this.getStoredTokens(userId)
      
      if (tokens?.accessToken) {
        // Revoke the token with Google
        await fetch(`https://oauth2.googleapis.com/revoke?token=${tokens.accessToken}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
          }
        })
      }

      // Delete from database
      const { error } = await supabase
        .from('gmail_connections')
        .delete()
        .eq('user_id', userId)

      if (error) {
        throw error
      }

      console.log('✅ Gmail disconnected successfully')
    } catch (error) {
      console.error('Error disconnecting Gmail:', error)
      throw error
    }
  }

  /**
   * Generate state parameter for CSRF protection
   */
  private generateState(): string {
    return Math.random().toString(36).substring(2, 15) + 
           Math.random().toString(36).substring(2, 15)
  }

  /**
   * Handle the OAuth callback
   */
  async handleOAuthCallback(code: string, userId: string): Promise<boolean> {
    try {
      // Exchange code for tokens
      const tokens = await this.exchangeCodeForTokens(code)
      
      // Get user email from Google
      const userInfo = await this.getUserInfo(tokens.access_token)
      
      // Save connection to database
      await this.saveConnection(userId, tokens, userInfo.email)
      
      return true
    } catch (error) {
      console.error('OAuth callback handling failed:', error)
      return false
    }
  }

  /**
   * Get user info from Google
   */
  private async getUserInfo(accessToken: string): Promise<{ email: string; name?: string }> {
    try {
      const response = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      })

      if (!response.ok) {
        throw new Error('Failed to fetch user info')
      }

      const data = await response.json()
      return {
        email: data.email,
        name: data.name
      }
    } catch (error) {
      console.error('Failed to get user info:', error)
      throw error
    }
  }
}

export const gmailAuthService = new GmailAuthService()