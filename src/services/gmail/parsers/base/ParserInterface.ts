import type { EmailMessage, ParsedEmailData } from '../../../../types/travelBooking';

/**
 * Base interface for all email parsers
 */
export interface IEmailParser {
  /**
   * Unique identifier for this parser
   */
  readonly provider: string;
  
  /**
   * Display name for the parser
   */
  readonly displayName: string;
  
  /**
   * Priority level for parser selection (higher = preferred)
   */
  readonly priority: number;
  
  /**
   * Check if this parser can handle the given email
   */
  canParse(email: EmailMessage): boolean;
  
  /**
   * Parse the email and extract booking information
   */
  parse(email: EmailMessage): Promise<ParsedEmailData>;
  
  /**
   * Get confidence score for a parsed result (0-1)
   */
  getConfidenceScore(email: EmailMessage, result: ParsedEmailData): number;
}

/**
 * Detection signal for flexible parsing
 */
export interface DetectionSignal {
  match: boolean;
  confidence: number;
  value?: any;
  source?: string;
}

export interface DetectionSignals {
  domain?: DetectionSignal;
  subject?: DetectionSignal;
  content?: DetectionSignal;
  structure?: DetectionSignal;
  senderHistory?: DetectionSignal;
  brand?: DetectionSignal;
  [key: string]: DetectionSignal | undefined;
}

/**
 * Abstract base class for email parsers with common functionality
 */
export abstract class BaseEmailParser implements IEmailParser {
  abstract readonly provider: string;
  abstract readonly displayName: string;
  readonly priority: number = 50; // Default medium priority
  
  /**
   * Get detection signals for flexible parsing
   */
  protected getDetectionSignals(email: EmailMessage): DetectionSignals {
    return {
      domain: this.checkDomainSignal(email),
      subject: this.checkSubjectSignal(email),
      content: this.checkContentSignal(email),
      structure: this.checkStructureSignal(email)
    };
  }

  /**
   * Check if we have minimum signals for parsing
   */
  protected hasMinimumSignals(signals: DetectionSignals, threshold = 2): boolean {
    const strongSignals = Object.values(signals)
      .filter(s => s && s.confidence > 0.5).length;
    return strongSignals >= threshold;
  }

  /**
   * Check domain signal (can be overridden by subclasses)
   */
  protected checkDomainSignal(_email: EmailMessage): DetectionSignal {
    return { match: false, confidence: 0 };
  }

  /**
   * Check subject signal (can be overridden by subclasses)
   */
  protected checkSubjectSignal(_email: EmailMessage): DetectionSignal {
    return { match: false, confidence: 0 };
  }

  /**
   * Check content signal (can be overridden by subclasses)
   */
  protected checkContentSignal(_email: EmailMessage): DetectionSignal {
    return { match: false, confidence: 0 };
  }

  /**
   * Check structure signal (can be overridden by subclasses)
   */
  protected checkStructureSignal(_email: EmailMessage): DetectionSignal {
    return { match: false, confidence: 0 };
  }

  /**
   * Check if email is from this provider's domain (legacy method)
   */
  protected isFromDomain(email: EmailMessage, domains: string[]): boolean {
    const from = email.from.toLowerCase();
    return domains.some(domain => from.includes(domain));
  }
  
  /**
   * Check if subject contains keywords
   */
  protected hasKeywords(text: string, keywords: string[]): boolean {
    const lowerText = text.toLowerCase();
    return keywords.some(keyword => lowerText.includes(keyword.toLowerCase()));
  }
  
  /**
   * Extract text content from email
   */
  protected getEmailContent(email: EmailMessage): string {
    // Prefer text over HTML for parsing
    if (email.body_text) {
      return email.body_text;
    }
    
    if (email.body_html) {
      // Basic HTML stripping (in production, use a proper HTML parser)
      return email.body_html
        .replace(/<[^>]*>/g, ' ')
        .replace(/&nbsp;/g, ' ')
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'")
        .replace(/\s+/g, ' ')
        .trim();
    }
    
    return '';
  }
  
  /**
   * Extract date from various formats
   */
  protected parseDate(dateStr: string): string | null {
    try {
      // Try parsing common date formats
      const patterns = [
        /(\w+)\s+(\d{1,2}),?\s+(\d{4})/i, // March 15, 2024
        /(\d{1,2})\/(\d{1,2})\/(\d{4})/,   // 03/15/2024
        /(\d{4})-(\d{2})-(\d{2})/,         // 2024-03-15
        /(\d{1,2})-(\w+)-(\d{4})/i,        // 15-Mar-2024
      ];
      
      for (const pattern of patterns) {
        const match = dateStr.match(pattern);
        if (match) {
          const date = new Date(dateStr);
          if (!isNaN(date.getTime())) {
            return date.toISOString().split('T')[0];
          }
        }
      }
      
      // Fallback to Date constructor
      const date = new Date(dateStr);
      if (!isNaN(date.getTime())) {
        return date.toISOString().split('T')[0];
      }
    } catch (error) {
      console.error('Error parsing date:', dateStr, error);
    }
    
    return null;
  }
  
  /**
   * Extract price from text
   */
  protected parsePrice(text: string): number | null {
    // Look for common price patterns
    const patterns = [
      /\$\s?([\d,]+\.?\d*)/,           // $450.00
      /USD\s?([\d,]+\.?\d*)/i,         // USD 450
      /([\d,]+\.?\d*)\s?USD/i,         // 450 USD
      /Total:?\s?\$?\s?([\d,]+\.?\d*)/i, // Total: 450
    ];
    
    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match && match[1]) {
        const price = parseFloat(match[1].replace(/,/g, ''));
        if (!isNaN(price)) {
          return price;
        }
      }
    }
    
    return null;
  }
  
  /**
   * Extract time from text (HH:MM format)
   */
  protected parseTime(text: string): string | null {
    const patterns = [
      /(\d{1,2}):(\d{2})\s?(AM|PM)/i,  // 3:00 PM
      /(\d{1,2}):(\d{2})/,              // 15:00
    ];
    
    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match) {
        let hours = parseInt(match[1]);
        const minutes = match[2];
        const period = match[3];
        
        // Convert to 24-hour format if needed
        if (period) {
          if (period.toUpperCase() === 'PM' && hours < 12) {
            hours += 12;
          } else if (period.toUpperCase() === 'AM' && hours === 12) {
            hours = 0;
          }
        }
        
        return `${hours.toString().padStart(2, '0')}:${minutes}`;
      }
    }
    
    return null;
  }
  
  /**
   * Default canParse implementation
   */
  abstract canParse(email: EmailMessage): boolean;
  
  /**
   * Parse implementation must be provided by subclass
   */
  abstract parse(email: EmailMessage): Promise<ParsedEmailData>;
  
  /**
   * Default confidence scoring
   */
  getConfidenceScore(_email: EmailMessage, result: ParsedEmailData): number {
    let score = 0;
    const booking = result.booking;
    
    // Check required fields
    if (booking.title) score += 0.2;
    if (booking.start_date) score += 0.2;
    if (booking.provider) score += 0.1;
    if (booking.booking_type) score += 0.1;
    
    // Check optional but important fields
    if (booking.confirmation_number) score += 0.1;
    if (booking.location_name) score += 0.1;
    if (booking.total_price) score += 0.1;
    if (booking.end_date || booking.start_time) score += 0.1;
    
    return Math.min(score, 1.0);
  }
  
  /**
   * Create a parsed result with timing
   */
  protected createResult(
    booking: ParsedEmailData['booking'],
    startTime: number,
    confidence?: number
  ): ParsedEmailData {
    const endTime = Date.now();
    const calculatedConfidence = confidence ?? 0.8;
    
    return {
      booking: {
        ...booking,
        provider: booking.provider || this.provider,
        parser_version: 'v1.0',
        parser_confidence: calculatedConfidence,
        parsed_at: new Date().toISOString()
      },
      confidence: calculatedConfidence,
      parser_used: this.provider,
      parsing_time_ms: endTime - startTime
    };
  }
}