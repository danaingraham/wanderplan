import { BaseEmailParser } from '../base/ParserInterface';
import type { EmailMessage, ParsedEmailData, BookingDetails } from '../../../../types/travelBooking';

export class BookingParser extends BaseEmailParser {
  readonly provider = 'booking.com';
  readonly displayName = 'Booking.com';
  readonly priority = 90; // High priority for specific parser
  
  canParse(email: EmailMessage): boolean {
    // Check if from Booking.com domain
    if (!this.isFromDomain(email, ['booking.com', 'booking.'])) {
      return false;
    }
    
    // Check for confirmation keywords in subject
    const confirmationKeywords = [
      'booking confirmation',
      'reservation confirmation',
      'confirmed',
      'your booking',
      'buchungsbestätigung',
      'confirmation de réservation'
    ];
    
    return this.hasKeywords(email.subject, confirmationKeywords);
  }
  
  async parse(email: EmailMessage): Promise<ParsedEmailData> {
    const startTime = Date.now();
    const content = this.getEmailContent(email);
    
    // Extract booking details
    const confirmationNumber = this.extractConfirmationNumber(content);
    const hotelName = this.extractHotelName(content, email.subject);
    const { checkIn, checkOut } = this.extractDates(content);
    const location = this.extractLocation(content);
    const price = this.extractPrice(content);
    const details = this.extractDetails(content);
    
    return this.createResult({
      provider: 'booking.com',
      booking_type: 'accommodation',
      title: hotelName,
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
      /confirmation\s+number:?\s*([\d.]+)/i,
      /booking\s+number:?\s*([\d.]+)/i,
      /reference\s+number:?\s*([\d.]+)/i,
      /confirmation\s+#:?\s*([\d.]+)/i,
    ];
    
    for (const pattern of patterns) {
      const match = content.match(pattern);
      if (match && match[1]) {
        return match[1].trim();
      }
    }
    
    return undefined;
  }
  
  private extractHotelName(content: string, subject: string): string {
    // Try subject first
    const subjectPatterns = [
      /confirmation\s+-\s+(.+?)$/i,
      /booking\s+at\s+(.+?)$/i,
      /reservation\s+for\s+(.+?)$/i,
    ];
    
    for (const pattern of subjectPatterns) {
      const match = subject.match(pattern);
      if (match && match[1]) {
        return match[1].trim();
      }
    }
    
    // Try content patterns
    const contentPatterns = [
      // Look for hotel name before address
      /^([^,\n]+(?:hotel|inn|resort|suites?|lodge|motel)[^,\n]*)/mi,
      // Look for line with hotel chain names
      /^((?:hilton|marriott|hyatt|sheraton|westin|radisson|holiday inn|best western|four seasons|ritz)[^,\n]*)/mi,
    ];
    
    for (const pattern of contentPatterns) {
      const match = content.match(pattern);
      if (match && match[1]) {
        return match[1].trim();
      }
    }
    
    // Look for standalone lines that might be hotel names
    const lines = content.split('\n');
    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed.length > 10 && trimmed.length < 100 &&
          !trimmed.includes('Check') &&
          !trimmed.includes('Total') &&
          !trimmed.includes('confirmation') &&
          !trimmed.includes('@')) {
        // Check if it contains hotel-related words
        const hotelWords = ['hotel', 'inn', 'resort', 'suites', 'lodge'];
        const lower = trimmed.toLowerCase();
        if (hotelWords.some(word => lower.includes(word))) {
          return trimmed;
        }
      }
    }
    
    return 'Hotel';
  }
  
  private extractDates(content: string): { checkIn?: string; checkOut?: string } {
    const result: { checkIn?: string; checkOut?: string } = {};
    
    // Booking.com specific date patterns
    const datePatterns = [
      /check-in:?\s*([^(,\n]+?)(?:\s*\(|,|\n)/i,
      /arrival:?\s*([^(,\n]+?)(?:\s*\(|,|\n)/i,
      /check-out:?\s*([^(,\n]+?)(?:\s*\(|,|\n)/i,
      /departure:?\s*([^(,\n]+?)(?:\s*\(|,|\n)/i,
    ];
    
    // Look for check-in
    for (const pattern of datePatterns.slice(0, 2)) {
      const match = content.match(pattern);
      if (match && match[1]) {
        const date = this.parseDate(match[1].trim());
        if (date) {
          result.checkIn = date;
          break;
        }
      }
    }
    
    // Look for check-out
    for (const pattern of datePatterns.slice(2)) {
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
    
    // Look for full address
    const addressPatterns = [
      /(\d+[^,\n]+(?:street|st|avenue|ave|road|rd|boulevard|blvd)[^,\n]*,\s*[^,\n]+,\s*[A-Z]{2}(?:\s+\d{5})?)/i,
      /(\d+[^,\n]+,\s*[^,\n]+,\s*[^,\n]+)/i,
    ];
    
    for (const pattern of addressPatterns) {
      const match = content.match(pattern);
      if (match && match[1]) {
        result.address = match[1].trim();
        
        // Extract city from address
        const parts = result.address.split(',');
        if (parts.length >= 2) {
          result.city = parts[parts.length - 2].trim();
        }
        break;
      }
    }
    
    // If no city found, look for city/state patterns
    if (!result.city) {
      const cityPatterns = [
        /([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*),?\s+([A-Z]{2})\b/,
        /in\s+([^,\n]+),\s*([A-Z]{2})\b/i,
      ];
      
      for (const pattern of cityPatterns) {
        const match = content.match(pattern);
        if (match && match[1]) {
          result.city = `${match[1].trim()}, ${match[2]}`;
          break;
        }
      }
    }
    
    return result;
  }
  
  private extractPrice(content: string): { total?: number; perNight?: number; currency?: string } {
    const result: { total?: number; perNight?: number; currency?: string } = {};
    
    // Look for total price
    const totalPatterns = [
      /total\s+price:?\s*([A-Z]{3})?\s*([\d,]+\.?\d*)/i,
      /total:?\s*([A-Z]{3})?\s*([\d,]+\.?\d*)/i,
      /([A-Z]{3})\s*([\d,]+\.?\d*)\s*(?:total|includes)/i,
    ];
    
    for (const pattern of totalPatterns) {
      const match = content.match(pattern);
      if (match) {
        if (match[1]) {
          result.currency = match[1];
        }
        if (match[2]) {
          result.total = parseFloat(match[2].replace(/,/g, ''));
        }
        if (result.total) break;
      }
    }
    
    // If no total found, use generic price parser
    if (!result.total) {
      result.total = this.parsePrice(content) || undefined;
    }
    
    // Look for nights count to calculate per night
    const nightsMatch = content.match(/(\d+)\s*nights?/i);
    if (nightsMatch && nightsMatch[1] && result.total) {
      const nights = parseInt(nightsMatch[1]);
      if (nights > 0) {
        result.perNight = Math.round((result.total / nights) * 100) / 100;
      }
    }
    
    // Currency detection
    if (!result.currency) {
      const currencyMatch = content.match(/(USD|EUR|GBP|CAD|AUD|JPY)/);
      if (currencyMatch) {
        result.currency = currencyMatch[1];
      }
    }
    
    return result;
  }
  
  private extractDetails(content: string): BookingDetails {
    const details: BookingDetails = {};
    
    // Extract room type
    const roomPatterns = [
      /room\s+type:?\s*([^\n]+)/i,
      /((?:king|queen|double|twin|single|suite|deluxe|standard)[^,\n]*room[^,\n]*)/i,
    ];
    
    for (const pattern of roomPatterns) {
      const match = content.match(pattern);
      if (match && match[1]) {
        details.room_type = match[1].trim();
        break;
      }
    }
    
    // Extract number of rooms
    const roomsMatch = content.match(/(\d+)\s*rooms?/i);
    if (roomsMatch && roomsMatch[1]) {
      details.num_rooms = parseInt(roomsMatch[1]);
    }
    
    // Extract guest count
    const guestMatch = content.match(/(\d+)\s*(?:guests?|adults?)/i);
    if (guestMatch && guestMatch[1]) {
      details.num_guests = parseInt(guestMatch[1]);
    }
    
    // Extract PIN code (Booking.com specific)
    const pinMatch = content.match(/PIN\s*(?:code)?:?\s*(\d+)/i);
    if (pinMatch && pinMatch[1]) {
      details.pin_code = pinMatch[1];
    }
    
    // Extract check-in/out times
    const checkInTimeMatch = content.match(/check-in.*?(?:from|after)\s*(\d{1,2}:\d{2})/i);
    if (checkInTimeMatch && checkInTimeMatch[1]) {
      details.check_in_time = checkInTimeMatch[1];
    }
    
    const checkOutTimeMatch = content.match(/check-out.*?(?:until|before)\s*(\d{1,2}:\d{2})/i);
    if (checkOutTimeMatch && checkOutTimeMatch[1]) {
      details.check_out_time = checkOutTimeMatch[1];
    }
    
    // Detect if includes breakfast/parking/wifi
    const amenities = [];
    if (/breakfast\s+included/i.test(content)) amenities.push('Breakfast');
    if (/(?:free\s+)?wifi/i.test(content)) amenities.push('WiFi');
    if (/(?:free\s+)?parking/i.test(content)) amenities.push('Parking');
    
    if (amenities.length > 0) {
      details.amenities = amenities;
    }
    
    return details;
  }
  
  private getBookingStatus(subject: string, content: string): 'confirmed' | 'cancelled' | 'pending' {
    const combined = `${subject} ${content}`.toLowerCase();
    
    if (combined.includes('cancel')) {
      return 'cancelled';
    }
    
    if (combined.includes('pending') || combined.includes('waiting') || combined.includes('processing')) {
      return 'pending';
    }
    
    return 'confirmed';
  }
}