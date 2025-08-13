import { resendEmailService } from './resendEmailService'

export interface EmailTemplate {
  subject: string
  html: string
  text: string
}

export interface PasswordResetData {
  email: string
  resetToken: string
  resetUrl: string
  userName: string
}

class EmailService {
  private generateResetToken(): string {
    return Math.random().toString(36).substring(2, 15) + 
           Math.random().toString(36).substring(2, 15) +
           Date.now().toString(36)
  }

  private getPasswordResetTemplate(data: PasswordResetData): EmailTemplate {
    const { resetUrl, userName } = data
    
    return {
      subject: 'Reset Your Wanderplan Password',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <title>Reset Your Password</title>
        </head>
        <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
          <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
              <h1 style="color: white; margin: 0; font-size: 28px;">🌟 Wanderplan</h1>
              <p style="color: #f0f0f0; margin: 10px 0 0 0;">Your Travel Planning Companion</p>
            </div>
            
            <div style="background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px;">
              <h2 style="color: #333; margin-top: 0;">Hi ${userName}!</h2>
              
              <p>We received a request to reset your Wanderplan password. If you didn't make this request, you can safely ignore this email.</p>
              
              <p>To reset your password, click the button below:</p>
              
              <div style="text-align: center; margin: 30px 0;">
                <a href="${resetUrl}" 
                   style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
                          color: white; 
                          padding: 15px 30px; 
                          text-decoration: none; 
                          border-radius: 8px; 
                          font-weight: bold;
                          display: inline-block;">
                  Reset My Password
                </a>
              </div>
              
              <p style="color: #666; font-size: 14px;">
                This link will expire in 1 hour for security reasons.
              </p>
              
              <p style="color: #666; font-size: 14px;">
                If the button doesn't work, you can copy and paste this link into your browser:
                <br>
                <code style="background: #e9ecef; padding: 5px; border-radius: 4px; word-break: break-all;">${resetUrl}</code>
              </p>
              
              <hr style="border: none; border-top: 1px solid #e9ecef; margin: 30px 0;">
              
              <p style="color: #666; font-size: 12px; margin-bottom: 0;">
                This email was sent by Wanderplan. If you didn't request a password reset, please contact our support team.
              </p>
            </div>
          </div>
        </body>
        </html>
      `,
      text: `
        Hi ${userName}!
        
        We received a request to reset your Wanderplan password.
        
        To reset your password, visit this link:
        ${resetUrl}
        
        This link will expire in 1 hour for security reasons.
        
        If you didn't request this reset, you can safely ignore this email.
        
        --
        The Wanderplan Team
      `
    }
  }

  async sendPasswordResetEmail(email: string, userName: string): Promise<{ success: boolean; resetToken?: string; error?: string }> {
    try {
      const resetToken = this.generateResetToken()
      const resetUrl = `${window.location.origin}/reset-password?token=${resetToken}&email=${encodeURIComponent(email)}`
      
      // Generate email template
      const template = this.getPasswordResetTemplate({
        email,
        resetToken,
        resetUrl,
        userName
      })

      // Store reset token data (in production, this should be in a database)
      const resetTokenData = {
        token: resetToken,
        email,
        expires: Date.now() + (60 * 60 * 1000), // 1 hour
        used: false
      }

      // Store reset token in localStorage (in production, store in backend)
      const existingTokens = JSON.parse(localStorage.getItem('wanderplan_reset_tokens') || '[]')
      const updatedTokens = [...existingTokens, resetTokenData].filter(t => t.expires > Date.now()) // Clean expired tokens
      localStorage.setItem('wanderplan_reset_tokens', JSON.stringify(updatedTokens))

      // Try to send email via Resend
      if (import.meta.env.VITE_RESEND_API_KEY) {
        const result = await resendEmailService.sendEmail({
          to: email,
          subject: template.subject,
          html: template.html,
          text: template.text
        })

        if (!result.success) {
          console.error('📧 Failed to send email via Resend:', result.error)
          // Fall back to console logging in development
          if (import.meta.env.DEV) {
            console.log('🔗 Password reset link (DEV MODE):', resetUrl)
            return {
              success: true,
              resetToken
            }
          }
          return {
            success: false,
            error: result.error || 'Failed to send email'
          }
        }

        console.log('📧 Password reset email sent to:', email)
        return {
          success: true,
          resetToken
        }
      } else {
        // No email service configured, log to console in development
        console.warn('📧 Resend API key not configured')
        if (import.meta.env.DEV) {
          console.log('🔗 Password reset link (DEV MODE):', resetUrl)
          return {
            success: true,
            resetToken
          }
        }
        return {
          success: false,
          error: 'Email service not configured. Please contact support.'
        }
      }
    } catch (error) {
      console.error('📧 Failed to send password reset email:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      }
    }
  }

  validateResetToken(token: string, email: string): { valid: boolean; error?: string } {
    try {
      const resetTokens = JSON.parse(localStorage.getItem('wanderplan_reset_tokens') || '[]')
      const tokenData = resetTokens.find((t: any) => t.token === token && t.email === email)

      if (!tokenData) {
        return { valid: false, error: 'Invalid reset token' }
      }

      if (tokenData.used) {
        return { valid: false, error: 'Reset token has already been used' }
      }

      if (tokenData.expires < Date.now()) {
        return { valid: false, error: 'Reset token has expired' }
      }

      return { valid: true }
    } catch (error) {
      return { valid: false, error: 'Error validating reset token' }
    }
  }

  markResetTokenAsUsed(token: string, email: string): void {
    try {
      const resetTokens = JSON.parse(localStorage.getItem('wanderplan_reset_tokens') || '[]')
      const updatedTokens = resetTokens.map((t: any) => 
        t.token === token && t.email === email 
          ? { ...t, used: true }
          : t
      )
      localStorage.setItem('wanderplan_reset_tokens', JSON.stringify(updatedTokens))
    } catch (error) {
      console.error('Error marking reset token as used:', error)
    }
  }
}

export const emailService = new EmailService()