import { supabase } from '../../lib/supabase'
import { gmailAuthService } from './gmailAuthService'
import { parseEmail } from './parsers'
import type { TravelBooking } from '../../types/travelBooking'

const GMAIL_API_BASE = 'https://gmail.googleapis.com/gmail/v1/users/me'

export interface SyncResult {
  success: boolean
  emailsFetched: number
  emailsParsed: number
  bookingsFound: number
  errors: string[]
  duration: number
}

export interface EmailMessage {
  id: string
  threadId: string
  labelIds: string[]
  snippet: string
  payload: {
    headers: Array<{ name: string; value: string }>
    body?: { data?: string }
    parts?: Array<{
      mimeType: string
      body: { data?: string }
      headers: Array<{ name: string; value: string }>
    }>
  }
  internalDate: string
}

class GmailSyncService {
  private readonly BATCH_SIZE = parseInt(import.meta.env.VITE_GMAIL_BATCH_SIZE || '50')
  private readonly MAX_RESULTS = parseInt(import.meta.env.VITE_GMAIL_MAX_RESULTS || '100')
  // private readonly DAILY_QUOTA = 250 // Gmail API quota per user - kept for reference
  private readonly RATE_LIMIT_DELAY = 100 // ms between requests

  /**
   * Perform initial sync - fetch travel emails from last 2 years
   */
  async performInitialSync(userId: string): Promise<SyncResult> {
    const startTime = Date.now()
    const result: SyncResult = {
      success: false,
      emailsFetched: 0,
      emailsParsed: 0,
      bookingsFound: 0,
      errors: [],
      duration: 0
    }

    try {
      // Get access token
      const accessToken = await gmailAuthService.getValidAccessToken(userId)
      if (!accessToken) {
        throw new Error('No valid access token available')
      }

      // Log sync start
      await this.logSyncStart(userId, 'initial')

      // Define search queries for travel bookings
      const searchQueries = [
        'from:noreply@airbnb.com subject:"reservation confirmed"',
        'from:booking.com subject:"booking confirmation"',
        'from:hotels.com subject:"booking confirmation"',
        'from:noreply@united.com subject:"flight confirmation"',
        'from:noreply@delta.com subject:"flight confirmation"',
        'from:no-reply@opentable.com subject:"reservation"',
        'from:uber.com subject:"trip receipt"',
        'from:lyft.com subject:"ride receipt"',
        'from:viator.com subject:"booking confirmation"',
        'from:expedia.com subject:"itinerary"'
      ]

      // Add date filter (last 2 years)
      const twoYearsAgo = new Date()
      twoYearsAgo.setFullYear(twoYearsAgo.getFullYear() - 2)
      const dateFilter = `after:${Math.floor(twoYearsAgo.getTime() / 1000)}`

      // Fetch and process emails for each query
      for (const baseQuery of searchQueries) {
        const query = `${baseQuery} ${dateFilter}`
        console.log(`📧 Searching: ${query}`)
        
        const messages = await this.searchMessages(accessToken, query)
        result.emailsFetched += messages.length

        // Process each message
        for (const messageId of messages) {
          await this.delay(this.RATE_LIMIT_DELAY) // Rate limiting
          
          try {
            const email = await this.fetchMessage(accessToken, messageId)
            const booking = await this.processEmail(email, userId)
            
            if (booking) {
              result.bookingsFound++
            }
            result.emailsParsed++
          } catch (error) {
            console.error(`Failed to process email ${messageId}:`, error)
            result.errors.push(`Email ${messageId}: ${error instanceof Error ? error.message : 'Unknown error'}`)
          }
        }
      }

      // Update sync status
      await this.updateSyncStatus(userId, new Date().toISOString())
      
      result.success = true
      result.duration = Date.now() - startTime

      // Log sync completion
      await this.logSyncComplete(userId, 'initial', result)

      console.log('✅ Initial sync completed:', result)
      return result
    } catch (error) {
      console.error('Initial sync failed:', error)
      result.errors.push(error instanceof Error ? error.message : 'Unknown error')
      result.duration = Date.now() - startTime
      
      // Log sync failure
      await this.logSyncComplete(userId, 'initial', result)
      
      return result
    }
  }

  /**
   * Perform incremental sync - fetch only new emails since last sync
   */
  async performIncrementalSync(userId: string): Promise<SyncResult> {
    const startTime = Date.now()
    const result: SyncResult = {
      success: false,
      emailsFetched: 0,
      emailsParsed: 0,
      bookingsFound: 0,
      errors: [],
      duration: 0
    }

    try {
      // Get access token and last sync date
      const accessToken = await gmailAuthService.getValidAccessToken(userId)
      if (!accessToken) {
        throw new Error('No valid access token available')
      }

      const lastSyncDate = await this.getLastSyncDate(userId)
      if (!lastSyncDate) {
        // No previous sync, do initial sync instead
        return this.performInitialSync(userId)
      }

      // Log sync start
      await this.logSyncStart(userId, 'incremental')

      // Create date filter for emails since last sync
      const dateFilter = `after:${Math.floor(new Date(lastSyncDate).getTime() / 1000)}`
      
      // Use a broader query for incremental sync
      const query = `(from:airbnb.com OR from:booking.com OR from:hotels.com OR from:united.com OR from:delta.com OR from:opentable.com) ${dateFilter}`
      
      console.log(`📧 Incremental sync query: ${query}`)
      
      const messages = await this.searchMessages(accessToken, query)
      result.emailsFetched = messages.length

      // Process new messages
      for (const messageId of messages) {
        await this.delay(this.RATE_LIMIT_DELAY)
        
        try {
          const email = await this.fetchMessage(accessToken, messageId)
          const booking = await this.processEmail(email, userId)
          
          if (booking) {
            result.bookingsFound++
          }
          result.emailsParsed++
        } catch (error) {
          console.error(`Failed to process email ${messageId}:`, error)
          result.errors.push(`Email ${messageId}: ${error instanceof Error ? error.message : 'Unknown error'}`)
        }
      }

      // Update sync status
      await this.updateSyncStatus(userId, new Date().toISOString())
      
      result.success = true
      result.duration = Date.now() - startTime

      // Log sync completion
      await this.logSyncComplete(userId, 'incremental', result)

      console.log('✅ Incremental sync completed:', result)
      return result
    } catch (error) {
      console.error('Incremental sync failed:', error)
      result.errors.push(error instanceof Error ? error.message : 'Unknown error')
      result.duration = Date.now() - startTime
      
      // Log sync failure
      await this.logSyncComplete(userId, 'incremental', result)
      
      return result
    }
  }

  /**
   * Search for messages matching query
   */
  private async searchMessages(accessToken: string, query: string): Promise<string[]> {
    const messageIds: string[] = []
    let pageToken: string | undefined = undefined
    let totalFetched = 0

    do {
      const url = new URL(`${GMAIL_API_BASE}/messages`)
      url.searchParams.append('q', query)
      url.searchParams.append('maxResults', Math.min(this.BATCH_SIZE, this.MAX_RESULTS - totalFetched).toString())
      if (pageToken) {
        url.searchParams.append('pageToken', pageToken)
      }

      const response = await fetch(url.toString(), {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      })

      if (!response.ok) {
        throw new Error(`Gmail API error: ${response.status} ${response.statusText}`)
      }

      const data = await response.json()
      
      if (data.messages) {
        messageIds.push(...data.messages.map((m: any) => m.id))
        totalFetched += data.messages.length
      }

      pageToken = data.nextPageToken

      // Stop if we've hit our max results limit
      if (totalFetched >= this.MAX_RESULTS) {
        console.log(`Reached max results limit (${this.MAX_RESULTS})`)
        break
      }
    } while (pageToken)

    return messageIds
  }

  /**
   * Fetch full message content
   */
  private async fetchMessage(accessToken: string, messageId: string): Promise<EmailMessage> {
    const url = `${GMAIL_API_BASE}/messages/${messageId}`
    
    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    })

    if (!response.ok) {
      throw new Error(`Failed to fetch message: ${response.status} ${response.statusText}`)
    }

    return response.json()
  }

  /**
   * Process email and extract booking information
   */
  private async processEmail(email: EmailMessage, userId: string): Promise<TravelBooking | null> {
    try {
      // Extract email metadata
      const headers = email.payload.headers || []
      const from = headers.find(h => h.name === 'From')?.value || ''
      const subject = headers.find(h => h.name === 'Subject')?.value || ''
      const date = headers.find(h => h.name === 'Date')?.value || ''

      // Extract email body
      const body = this.extractEmailBody(email)
      
      // Parse email using our parsers
      const booking = await parseEmail({
        from,
        subject,
        body,
        date,
        id: email.id
      })

      if (!booking) {
        return null
      }

      // Set the user ID
      booking.user_id = userId

      // Create confirmation hash for deduplication
      const confirmationHash = await this.hashConfirmation(booking.confirmation_number || email.id)

      // Check if booking already exists
      const exists = await this.bookingExists(confirmationHash)
      if (exists) {
        console.log(`Booking already exists: ${confirmationHash}`)
        return null
      }

      // Save to database
      await this.saveBooking(userId, booking, email.id, confirmationHash)
      
      return booking
    } catch (error) {
      console.error('Error processing email:', error)
      throw error
    }
  }

  /**
   * Extract email body from complex Gmail message structure
   */
  private extractEmailBody(email: EmailMessage): string {
    let body = ''

    // Try to get plain text body first
    if (email.payload.body?.data) {
      body = this.decodeBase64(email.payload.body.data)
    } else if (email.payload.parts) {
      // Look for text/plain or text/html parts
      for (const part of email.payload.parts) {
        if (part.mimeType === 'text/plain' && part.body?.data) {
          body = this.decodeBase64(part.body.data)
          break
        } else if (part.mimeType === 'text/html' && part.body?.data && !body) {
          // Fallback to HTML if no plain text
          body = this.decodeBase64(part.body.data)
          // Simple HTML stripping (in production, use a proper HTML parser)
          body = body.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim()
        }
      }
    }

    return body
  }

  /**
   * Decode base64 URL-safe encoded string
   */
  private decodeBase64(data: string): string {
    // Gmail uses URL-safe base64 encoding
    const base64 = data.replace(/-/g, '+').replace(/_/g, '/')
    return atob(base64)
  }

  /**
   * Create one-way hash of confirmation number for privacy
   */
  private async hashConfirmation(confirmation: string): Promise<string> {
    const encoder = new TextEncoder()
    const data = encoder.encode(confirmation)
    const hashBuffer = await crypto.subtle.digest('SHA-256', data)
    const hashArray = Array.from(new Uint8Array(hashBuffer))
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
    return hashHex.substring(0, 16) // Use first 16 chars for brevity
  }

  /**
   * Check if booking already exists
   */
  private async bookingExists(confirmationHash: string): Promise<boolean> {
    const { data } = await supabase
      .from('travel_history')
      .select('id')
      .eq('confirmation_hash', confirmationHash)
      .single()

    return !!data
  }

  /**
   * Save booking to database
   */
  private async saveBooking(
    userId: string, 
    booking: TravelBooking, 
    emailId: string,
    confirmationHash: string
  ): Promise<void> {
    const { error } = await supabase
      .from('travel_history')
      .insert({
        user_id: userId,
        type: booking.booking_type,
        provider: booking.provider,
        name: booking.title,
        location: booking.location_name || '',
        latitude: booking.location_lat,
        longitude: booking.location_lng,
        start_date: booking.start_date,
        end_date: booking.end_date,
        booking_date: booking.email_date || booking.parsed_at,
        total_cost: booking.total_price,
        currency: booking.currency,
        confirmation_hash: confirmationHash,
        confidence_score: booking.parser_confidence || 0.8,
        source: 'gmail_parser',
        email_id: emailId,
        created_at: new Date().toISOString()
      })

    if (error) {
      console.error('Failed to save booking:', error)
      throw error
    }
  }

  /**
   * Get last sync date for user
   */
  private async getLastSyncDate(userId: string): Promise<string | null> {
    const { data } = await supabase
      .from('gmail_connections')
      .select('last_sync_date')
      .eq('user_id', userId)
      .single()

    return data?.last_sync_date || null
  }

  /**
   * Update sync status
   */
  private async updateSyncStatus(userId: string, syncDate: string): Promise<void> {
    await supabase
      .from('gmail_connections')
      .update({
        last_sync_date: syncDate,
        last_sync_status: 'success',
        updated_at: new Date().toISOString()
      })
      .eq('user_id', userId)
  }

  /**
   * Log sync start
   */
  private async logSyncStart(userId: string, syncType: 'initial' | 'incremental' | 'retry'): Promise<string> {
    const { data } = await supabase
      .from('gmail_sync_log')
      .insert({
        user_id: userId,
        sync_type: syncType,
        sync_status: 'started',
        started_at: new Date().toISOString()
      })
      .select('id')
      .single()

    return data?.id || ''
  }

  /**
   * Log sync completion
   */
  private async logSyncComplete(userId: string, syncType: string, result: SyncResult): Promise<void> {
    await supabase
      .from('gmail_sync_log')
      .insert({
        user_id: userId,
        sync_type: syncType,
        sync_status: result.success ? 'completed' : 'failed',
        emails_fetched: result.emailsFetched,
        emails_parsed: result.emailsParsed,
        bookings_found: result.bookingsFound,
        duration_ms: result.duration,
        error_message: result.errors.length > 0 ? result.errors[0] : null,
        error_details: result.errors.length > 0 ? { errors: result.errors } : null,
        started_at: new Date(Date.now() - result.duration).toISOString(),
        completed_at: new Date().toISOString()
      })
  }

  /**
   * Utility to delay execution (for rate limiting)
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }
}

export const gmailSyncService = new GmailSyncService()