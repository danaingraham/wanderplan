import { BaseEmailParser } from '../base/ParserInterface';
import type { EmailMessage, ParsedEmailData, BookingDetails } from '../../../../types/travelBooking';

export class AirbnbParser extends BaseEmailParser {
  readonly provider = 'airbnb';
  readonly displayName = 'Airbnb';
  readonly priority = 90; // High priority for specific parser
  
  canParse(email: EmailMessage): boolean {
    // Check if from Airbnb domain
    if (!this.isFromDomain(email, ['airbnb.com', 'airbnb.'])) {
      return false;
    }
    
    // Check for confirmation keywords in subject
    const confirmationKeywords = [
      'reservation confirmed',
      'booking confirmed',
      'confirmation',
      'reserved',
      'réservation confirmée',
      'buchungsbestätigung'
    ];
    
    return this.hasKeywords(email.subject, confirmationKeywords);
  }
  
  async parse(email: EmailMessage): Promise<ParsedEmailData> {
    const startTime = Date.now();
    const content = this.getEmailContent(email);
    
    // Extract confirmation number
    const confirmationNumber = this.extractConfirmationNumber(content);
    
    // Extract property title
    const title = this.extractPropertyTitle(content, email.subject);
    
    // Extract dates
    const { checkIn, checkOut } = this.extractDates(content);
    
    // Extract location
    const location = this.extractLocation(content);
    
    // Extract price
    const price = this.extractPrice(content);
    
    // Extract additional details
    const details = this.extractDetails(content);
    
    return this.createResult({
      provider: 'airbnb',
      booking_type: 'accommodation',
      title,
      confirmation_number: confirmationNumber,
      location_name: location.city,
      location_address: location.address,
      start_date: checkIn,
      end_date: checkOut,
      total_price: price.total,
      price_per_night: price.perNight,
      currency: price.currency || 'USD',
      details,
      email_id: email.id,
      email_date: email.date,
      email_subject: email.subject,
      booking_status: this.getBookingStatus(email.subject, content)
    }, startTime);
  }
  
  private extractConfirmationNumber(content: string): string | undefined {
    const patterns = [
      /confirmation\s+code:?\s*([A-Z0-9-]+)/i,
      /confirmation\s+#?:?\s*([A-Z0-9-]+)/i,
      /booking\s+code:?\s*([A-Z0-9-]+)/i,
      /reference:?\s*([A-Z0-9-]+)/i,
    ];
    
    for (const pattern of patterns) {
      const match = content.match(pattern);
      if (match && match[1]) {
        return match[1].trim();
      }
    }
    
    return undefined;
  }
  
  private extractPropertyTitle(content: string, subject: string): string {
    // Try to extract from content first
    const patterns = [
      // After "confirmed - " in subject
      /confirmed\s+-\s+(.+?)$/i,
      /reservation\s+for\s+(.+?)(?:\n|$)/i,
      // Look for property name patterns in content
      /^\s*(.+?)\s*\n.*?(?:check-in|address|location)/mi,
    ];
    
    // Check subject first
    for (const pattern of patterns.slice(0, 1)) {
      const match = subject.match(pattern);
      if (match && match[1]) {
        return match[1].trim();
      }
    }
    
    // Then check content
    const lines = content.split('\n');
    for (const line of lines) {
      if (line.length > 10 && line.length < 100 && 
          !line.includes('Check-') && 
          !line.includes('Total') &&
          !line.includes('confirmation')) {
        // Likely property name if it's a standalone line
        const cleaned = line.trim();
        if (cleaned && !/^[0-9]/.test(cleaned)) {
          return cleaned;
        }
      }
    }
    
    return 'Airbnb Property';
  }
  
  private extractDates(content: string): { checkIn?: string; checkOut?: string } {
    const result: { checkIn?: string; checkOut?: string } = {};
    
    // Check-in patterns
    const checkInPatterns = [
      /check-in:?\s*([^,\n]+)/i,
      /arrival:?\s*([^,\n]+)/i,
      /from:?\s*([^,\n]+?)(?:\s+to|\s+-)/i,
    ];
    
    for (const pattern of checkInPatterns) {
      const match = content.match(pattern);
      if (match && match[1]) {
        const date = this.parseDate(match[1].trim());
        if (date) {
          result.checkIn = date;
          break;
        }
      }
    }
    
    // Check-out patterns
    const checkOutPatterns = [
      /check-out:?\s*([^,\n]+)/i,
      /departure:?\s*([^,\n]+)/i,
      /(?:to|until):?\s*([^,\n]+?)(?:\n|$)/i,
    ];
    
    for (const pattern of checkOutPatterns) {
      const match = content.match(pattern);
      if (match && match[1]) {
        const date = this.parseDate(match[1].trim());
        if (date) {
          result.checkOut = date;
          break;
        }
      }
    }
    
    return result;
  }
  
  private extractLocation(content: string): { city?: string; address?: string } {
    const result: { city?: string; address?: string } = {};
    
    // Look for address patterns
    const addressPatterns = [
      /(\d+\s+[^,\n]+(?:street|st|avenue|ave|road|rd|boulevard|blvd)[^,\n]*,\s*[^,\n]+,\s*[A-Z]{2}\s+\d{5})/i,
      /(\d+\s+[^,\n]+,\s*[^,\n]+,\s*[A-Z]{2})/i,
    ];
    
    for (const pattern of addressPatterns) {
      const match = content.match(pattern);
      if (match && match[1]) {
        result.address = match[1].trim();
        
        // Extract city from address
        const cityMatch = result.address.match(/,\s*([^,]+),\s*[A-Z]{2}/);
        if (cityMatch && cityMatch[1]) {
          result.city = cityMatch[1].trim();
        }
        break;
      }
    }
    
    // If no address found, look for city mentions
    if (!result.city) {
      const cityPatterns = [
        /in\s+([^,\n]+(?:city|town))/i,
        /(?:downtown|central)\s+([^,\n]+)/i,
        /([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*),?\s+[A-Z]{2}\b/,
      ];
      
      for (const pattern of cityPatterns) {
        const match = content.match(pattern);
        if (match && match[1]) {
          result.city = match[1].trim();
          break;
        }
      }
    }
    
    return result;
  }
  
  private extractPrice(content: string): { total?: number; perNight?: number; currency?: string } {
    const result: { total?: number; perNight?: number; currency?: string } = {};
    
    // Extract total price
    const total = this.parsePrice(content);
    if (total) {
      result.total = total;
    }
    
    // Extract per night price
    const perNightPatterns = [
      /\$?([\d,]+\.?\d*)\s*(?:x|×)\s*\d+\s*night/i,
      /\$?([\d,]+\.?\d*)\s*per\s*night/i,
      /\$?([\d,]+\.?\d*)\/night/i,
    ];
    
    for (const pattern of perNightPatterns) {
      const match = content.match(pattern);
      if (match && match[1]) {
        result.perNight = parseFloat(match[1].replace(/,/g, ''));
        break;
      }
    }
    
    // Extract currency
    const currencyPatterns = [
      /(USD|EUR|GBP|CAD|AUD|JPY|CNY)/,
      /(\$|€|£|¥)/,
    ];
    
    for (const pattern of currencyPatterns) {
      const match = content.match(pattern);
      if (match && match[1]) {
        result.currency = match[1] === '$' ? 'USD' : 
                        match[1] === '€' ? 'EUR' :
                        match[1] === '£' ? 'GBP' :
                        match[1] === '¥' ? 'JPY' :
                        match[1];
        break;
      }
    }
    
    return result;
  }
  
  private extractDetails(content: string): BookingDetails {
    const details: BookingDetails = {};
    
    // Extract host name
    const hostMatch = content.match(/host:?\s*([^\n]+)/i);
    if (hostMatch && hostMatch[1]) {
      details.host_name = hostMatch[1].trim();
    }
    
    // Extract number of guests
    const guestMatch = content.match(/(\d+)\s*(?:guests?|adults?|people)/i);
    if (guestMatch && guestMatch[1]) {
      details.num_guests = parseInt(guestMatch[1]);
    }
    
    // Extract check-in/out times
    const checkInTimeMatch = content.match(/check-in\s+time:?\s*(?:after\s*)?(\d{1,2}:\d{2}\s*[AP]M)/i);
    if (checkInTimeMatch && checkInTimeMatch[1]) {
      details.check_in_time = this.parseTime(checkInTimeMatch[1]) || undefined;
    }
    
    const checkOutTimeMatch = content.match(/check-out\s+time:?\s*(?:before\s*)?(\d{1,2}:\d{2}\s*[AP]M)/i);
    if (checkOutTimeMatch && checkOutTimeMatch[1]) {
      details.check_out_time = this.parseTime(checkOutTimeMatch[1]) || undefined;
    }
    
    // Detect property type from title or content
    const propertyTypes = ['apartment', 'house', 'villa', 'studio', 'condo', 'loft', 'cottage', 'cabin'];
    const lowerContent = content.toLowerCase();
    for (const type of propertyTypes) {
      if (lowerContent.includes(type)) {
        details.property_type = type;
        break;
      }
    }
    
    return details;
  }
  
  private getBookingStatus(subject: string, content: string): 'confirmed' | 'cancelled' | 'pending' {
    const combined = `${subject} ${content}`.toLowerCase();
    
    if (combined.includes('cancel')) {
      return 'cancelled';
    }
    
    if (combined.includes('pending') || combined.includes('waiting')) {
      return 'pending';
    }
    
    return 'confirmed';
  }
}