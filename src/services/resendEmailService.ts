import { Resend } from 'resend'

// Initialize Resend with API key
const resend = new Resend(import.meta.env.VITE_RESEND_API_KEY)

export interface EmailOptions {
  to: string
  subject: string
  html: string
  text?: string
}

class ResendEmailService {
  private from = 'Wanderplan <onboarding@resend.dev>' // Default sender for free tier
  
  async sendEmail(options: EmailOptions): Promise<{ success: boolean; error?: string }> {
    try {
      // Check if API key is configured
      if (!import.meta.env.VITE_RESEND_API_KEY) {
        console.warn('Resend API key not configured')
        return {
          success: false,
          error: 'Email service not configured'
        }
      }

      const { data, error } = await resend.emails.send({
        from: this.from,
        to: options.to,
        subject: options.subject,
        html: options.html,
        text: options.text
      })

      if (error) {
        console.error('Resend error:', error)
        return {
          success: false,
          error: error.message
        }
      }

      console.log('Email sent successfully:', data)
      return {
        success: true
      }
    } catch (error) {
      console.error('Failed to send email:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to send email'
      }
    }
  }

  // Set custom from address if using a verified domain
  setFromAddress(from: string) {
    this.from = from
  }
}

export const resendEmailService = new ResendEmailService()