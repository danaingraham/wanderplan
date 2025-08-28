import { BaseEmailParser } from '../base/ParserInterface';
import type { DetectionSignals, DetectionSignal } from '../base/ParserInterface';
import type { EmailMessage, ParsedEmailData, BookingDetails } from '../../../../types/travelBooking';

export class HotelChainParser extends BaseEmailParser {
  readonly provider = 'hotel_chains';
  readonly displayName = 'Hotel Chains (Multi-Brand)';
  readonly priority = 85; // Slightly lower than specific parsers

  private readonly hotelGroups = {
    marriott: {
      domains: ['marriott.com', 'email-marriott.com', 'marriottbonvoy.com', 'marriott-email.com'],
      brands: ['Marriott', 'Ritz-Carlton', 'Ritz Carlton', 'St. Regis', 'St Regis', 'W Hotels', 
               'Westin', 'Sheraton', 'JW Marriott', 'Autograph Collection', 'Renaissance',
               'Le Méridien', 'Tribute Portfolio', 'Design Hotels', 'Gaylord Hotels',
               'Courtyard', 'Fairfield Inn', 'SpringHill Suites', 'Residence Inn', 'TownePlace Suites'],
      patterns: [/marriott/i, /bonvoy/i, /ritz.?carlton/i, /st\.?\s?regis/i, /westin/i, /sheraton/i],
      confirmationPattern: /\d{8,}/
    },
    hilton: {
      domains: ['hilton.com', 'hiltonhhonors.com', 'hiltonhonors.com', 'hilton-email.com'],
      brands: ['Hilton', 'Waldorf Astoria', 'Conrad', 'Canopy', 'Signia', 'DoubleTree', 
               'Embassy Suites', 'Hampton Inn', 'Hampton by Hilton', 'Hilton Garden Inn',
               'Homewood Suites', 'Home2 Suites', 'Tru by Hilton', 'Tapestry Collection',
               'Curio Collection', 'LXR Hotels'],
      patterns: [/hilton/i, /waldorf/i, /doubletree/i, /hampton\s+inn/i, /embassy\s+suites/i],
      confirmationPattern: /\d{9,}/
    },
    ihg: {
      domains: ['ihg.com', 'ihgrewardsclub.com', 'ichotelsgroup.com', 'ihg-email.com'],
      brands: ['InterContinental', 'Kimpton', 'Hotel Indigo', 'EVEN Hotels', 'HUALUXE',
               'Crowne Plaza', 'Holiday Inn', 'Holiday Inn Express', 'Holiday Inn Club Vacations',
               'avid hotels', 'Staybridge Suites', 'Candlewood Suites', 'Atwell Suites',
               'Voco', 'Regent Hotels'],
      patterns: [/\bihg\b/i, /holiday\s+inn/i, /crowne\s+plaza/i, /intercontinental/i, /kimpton/i],
      confirmationPattern: /\d{8,}/
    },
    hyatt: {
      domains: ['hyatt.com', 'worldofhyatt.com'],
      brands: ['Park Hyatt', 'Grand Hyatt', 'Hyatt Regency', 'Hyatt', 'Hyatt Centric', 
               'Hyatt House', 'Hyatt Place', 'Hyatt Ziva', 'Hyatt Zilara', 'Andaz',
               'Alila', 'Thompson Hotels', 'Caption by Hyatt', 'The Unbound Collection'],
      patterns: [/hyatt/i, /andaz/i, /alila/i, /thompson\s+hotel/i],
      confirmationPattern: /\d{8,}/
    },
    accor: {
      domains: ['accor.com', 'accorhotels.com', 'all.accor.com'],
      brands: ['Raffles', 'Fairmont', 'Sofitel', 'MGallery', 'Pullman', 'Swissôtel',
               'Novotel', 'Mercure', 'ibis', 'ibis Styles', 'ibis budget'],
      patterns: [/accor/i, /sofitel/i, /novotel/i, /mercure/i, /\bibis\b/i, /fairmont/i, /raffles/i],
      confirmationPattern: /\d{8,}/
    },
    fourseasons: {
      domains: ['fourseasons.com'],
      brands: ['Four Seasons'],
      patterns: [/four\s+seasons/i],
      confirmationPattern: /\d{6,}/
    },
    mandarin: {
      domains: ['mandarinoriental.com', 'mohg.com'],
      brands: ['Mandarin Oriental'],
      patterns: [/mandarin\s+oriental/i],
      confirmationPattern: /\d{6,}/
    },
    oneandonly: {
      domains: ['oneandonlyresorts.com'],
      brands: ['One&Only', 'One and Only', 'One & Only'],
      patterns: [/one\s*&?\s*only/i],
      confirmationPattern: /\d{6,}/
    },
    auberge: {
      domains: ['aubergeresorts.com'],
      brands: ['Auberge', 'Auberge Resorts'],
      patterns: [/auberge/i],
      confirmationPattern: /\d{6,}/
    }
  };

  canParse(email: EmailMessage): boolean {
    const signals = this.detectHotelSignals(email);
    
    // Log potential new hotel domain if brand detected but not domain
    if (!signals.domain?.match && signals.brand?.confidence && signals.brand.confidence > 0.8) {
      console.log(`📧 Potential new hotel domain detected: ${email.from} (${signals.brand.value})`);
    }
    
    return this.hasMinimumSignals(signals);
  }

  private detectHotelSignals(email: EmailMessage): DetectionSignals {
    const domainSignal = this.checkHotelDomains(email.from);
    const brandSignal = this.checkBrandMentions(email);
    const subjectSignal = this.checkHotelSubjectPatterns(email.subject);
    const structureSignal = this.checkHotelBookingStructure(email);
    const confirmationSignal = this.checkConfirmationNumber(email);

    return {
      domain: domainSignal,
      brand: brandSignal,
      subject: subjectSignal,
      structure: structureSignal,
      confirmation: confirmationSignal
    };
  }

  private checkHotelDomains(from: string): DetectionSignal {
    const fromLower = from.toLowerCase();
    
    // Check exact domain matches
    for (const [brand, config] of Object.entries(this.hotelGroups)) {
      for (const domain of config.domains) {
        if (fromLower.includes(domain)) {
          return { 
            match: true, 
            confidence: 1.0, 
            value: brand,
            source: `domain:${domain}`
          };
        }
      }
    }
    
    // Check for partial matches (e.g., "marriott-hotel.com")
    for (const [brand, config] of Object.entries(this.hotelGroups)) {
      for (const pattern of config.patterns) {
        if (pattern.test(fromLower)) {
          return { 
            match: true, 
            confidence: 0.7, 
            value: brand,
            source: `pattern:${pattern}`
          };
        }
      }
    }
    
    return { match: false, confidence: 0 };
  }

  private checkBrandMentions(email: EmailMessage): DetectionSignal {
    const content = this.getEmailContent(email);
    const allText = `${email.subject} ${content}`.toLowerCase();
    
    for (const [brand, config] of Object.entries(this.hotelGroups)) {
      for (const brandName of config.brands) {
        if (allText.includes(brandName.toLowerCase())) {
          // Higher confidence if in subject
          const confidence = email.subject.toLowerCase().includes(brandName.toLowerCase()) ? 0.95 : 0.85;
          return { 
            match: true, 
            confidence,
            value: brand,
            source: `brand:${brandName}`
          };
        }
      }
    }
    
    return { match: false, confidence: 0 };
  }

  private checkHotelSubjectPatterns(subject: string): DetectionSignal {
    const patterns = [
      /reservation\s+confirmation/i,
      /booking\s+confirmation/i,
      /hotel\s+reservation/i,
      /your\s+stay\s+at/i,
      /reservation\s+for/i,
      /confirmed\s+reservation/i,
      /booking\s+details/i
    ];
    
    for (const pattern of patterns) {
      if (pattern.test(subject)) {
        return { 
          match: true, 
          confidence: 0.8,
          source: `subject:${pattern}`
        };
      }
    }
    
    return { match: false, confidence: 0 };
  }

  private checkHotelBookingStructure(email: EmailMessage): DetectionSignal {
    const content = this.getEmailContent(email);
    const hasCheckIn = /check[\s-]?in/i.test(content);
    const hasCheckOut = /check[\s-]?out/i.test(content);
    const hasRoomType = /room|suite|villa|residence/i.test(content);
    const hasGuests = /guest|adult|child|occupancy/i.test(content);
    const hasNights = /night|stay/i.test(content);
    
    const structureElements = [hasCheckIn, hasCheckOut, hasRoomType, hasGuests, hasNights].filter(Boolean).length;
    
    if (structureElements >= 3) {
      return { 
        match: true, 
        confidence: 0.7 + (structureElements * 0.05),
        value: structureElements,
        source: 'structure:hotel'
      };
    }
    
    return { match: false, confidence: 0 };
  }

  private checkConfirmationNumber(email: EmailMessage): DetectionSignal {
    const content = this.getEmailContent(email);
    const patterns = [
      /confirmation\s*(?:number|code|#)?:?\s*([A-Z0-9]{6,})/i,
      /reservation\s*(?:number|code|#)?:?\s*([A-Z0-9]{6,})/i,
      /booking\s*(?:number|reference|#)?:?\s*([A-Z0-9]{6,})/i
    ];
    
    for (const pattern of patterns) {
      const match = content.match(pattern);
      if (match) {
        return { 
          match: true, 
          confidence: 0.9,
          value: match[1],
          source: 'confirmation'
        };
      }
    }
    
    return { match: false, confidence: 0 };
  }

  async parse(email: EmailMessage): Promise<ParsedEmailData> {
    const startTime = Date.now();
    const content = this.getEmailContent(email);
    const signals = this.detectHotelSignals(email);
    
    // Determine specific hotel brand
    const hotelBrand = signals.brand?.value || signals.domain?.value || 'unknown';
    const hotelGroup = this.hotelGroups[hotelBrand as keyof typeof this.hotelGroups];
    
    // Extract booking details
    const hotelName = this.extractHotelName(content, email.subject, hotelGroup);
    const { checkIn, checkOut } = this.extractDates(content);
    const location = this.extractLocation(content);
    const confirmationNumber = this.extractConfirmationNumber(content, hotelGroup);
    const price = this.extractPrice(content);
    const details = this.extractHotelDetails(content);
    
    return this.createResult({
      provider: hotelBrand,
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
      booking_status: 'confirmed',
      parser_confidence: signals.brand?.confidence || signals.domain?.confidence || 0.7
    }, startTime);
  }

  private extractHotelName(content: string, subject: string, hotelGroup: any): string {
    // Try to extract from subject first
    if (hotelGroup) {
      for (const brand of hotelGroup.brands) {
        const pattern = new RegExp(`${brand}\\s+([^,\\n]+)`, 'i');
        const match = subject.match(pattern) || content.match(pattern);
        if (match) {
          return `${brand} ${match[1].trim()}`;
        }
      }
    }
    
    // Look for property name patterns
    const patterns = [
      /property:?\s*([^\n]+)/i,
      /hotel:?\s*([^\n]+)/i,
      /staying\s+at\s+([^\n]+)/i,
      /reservation\s+at\s+([^\n]+)/i
    ];
    
    for (const pattern of patterns) {
      const match = content.match(pattern);
      if (match) {
        return match[1].trim();
      }
    }
    
    // Use subject as fallback
    return subject.replace(/reservation|confirmation|booking/gi, '').trim() || 'Hotel';
  }

  private extractDates(content: string): { checkIn?: string; checkOut?: string } {
    const result: { checkIn?: string; checkOut?: string } = {};
    
    const datePatterns = [
      /check[\s-]?in:?\s*([^(,\n]+?)(?:\s*\(|,|\n)/i,
      /arrival:?\s*([^(,\n]+?)(?:\s*\(|,|\n)/i,
      /check[\s-]?out:?\s*([^(,\n]+?)(?:\s*\(|,|\n)/i,
      /departure:?\s*([^(,\n]+?)(?:\s*\(|,|\n)/i
    ];
    
    // Check-in
    for (const pattern of datePatterns.slice(0, 2)) {
      const match = content.match(pattern);
      if (match) {
        const date = this.parseDate(match[1].trim());
        if (date) {
          result.checkIn = date;
          break;
        }
      }
    }
    
    // Check-out
    for (const pattern of datePatterns.slice(2)) {
      const match = content.match(pattern);
      if (match) {
        const date = this.parseDate(match[1].trim());
        if (date) {
          result.checkOut = date;
          break;
        }
      }
    }
    
    return result;
  }

  private extractLocation(content: string): { city?: string; address?: string; country?: string } {
    const result: { city?: string; address?: string; country?: string } = {};
    
    // Extract address
    const addressPatterns = [
      /address:?\s*([^\n]+)/i,
      /location:?\s*([^\n]+)/i,
      /(\d+\s+[^,\n]+(?:street|st|avenue|ave|road|rd|boulevard|blvd)[^,\n]*)/i
    ];
    
    for (const pattern of addressPatterns) {
      const match = content.match(pattern);
      if (match) {
        result.address = match[1].trim();
        break;
      }
    }
    
    // Extract city
    const cityPatterns = [
      /city:?\s*([^,\n]+)/i,
      /in\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*),?\s+[A-Z]{2}/,
      /,\s*([^,]+),\s*[A-Z]{2}\s+\d{5}/
    ];
    
    for (const pattern of cityPatterns) {
      const match = content.match(pattern);
      if (match) {
        result.city = match[1].trim();
        break;
      }
    }
    
    return result;
  }

  private extractConfirmationNumber(content: string, hotelGroup: any): string | undefined {
    // Try brand-specific pattern first
    if (hotelGroup?.confirmationPattern) {
      const match = content.match(hotelGroup.confirmationPattern);
      if (match) {
        return match[0];
      }
    }
    
    // Generic patterns
    const patterns = [
      /confirmation\s*(?:number|code|#)?:?\s*([A-Z0-9]{6,})/i,
      /reservation\s*(?:number|code|#)?:?\s*([A-Z0-9]{6,})/i,
      /booking\s*(?:number|reference|#)?:?\s*([A-Z0-9]{6,})/i
    ];
    
    for (const pattern of patterns) {
      const match = content.match(pattern);
      if (match) {
        return match[1].trim();
      }
    }
    
    return undefined;
  }

  private extractPrice(content: string): { total?: number; perNight?: number; currency?: string } {
    const result: { total?: number; perNight?: number; currency?: string } = {};
    
    // Extract total price
    const total = this.parsePrice(content);
    if (total) {
      result.total = total;
    }
    
    // Extract per night price
    const perNightPattern = /(?:per\s+night|nightly\s+rate)[:\s]*\$?\s*([\d,]+\.?\d*)/i;
    const perNightMatch = content.match(perNightPattern);
    if (perNightMatch) {
      result.perNight = parseFloat(perNightMatch[1].replace(/,/g, ''));
    }
    
    // Extract currency
    const currencyPattern = /\b(USD|EUR|GBP|CAD|AUD|JPY|CNY)\b/;
    const currencyMatch = content.match(currencyPattern);
    if (currencyMatch) {
      result.currency = currencyMatch[1];
    }
    
    return result;
  }

  private extractHotelDetails(content: string): BookingDetails {
    const details: BookingDetails = {};
    
    // Room type
    const roomPattern = /room\s+type:?\s*([^\n]+)/i;
    const roomMatch = content.match(roomPattern);
    if (roomMatch) {
      details.room_type = roomMatch[1].trim();
    }
    
    // Number of guests
    const guestPattern = /(\d+)\s*(?:guest|adult)/i;
    const guestMatch = content.match(guestPattern);
    if (guestMatch) {
      details.num_guests = parseInt(guestMatch[1]);
    }
    
    // Number of rooms
    const roomsPattern = /(\d+)\s*room/i;
    const roomsMatch = content.match(roomsPattern);
    if (roomsMatch) {
      details.num_rooms = parseInt(roomsMatch[1]);
    }
    
    // Check-in/out times
    const checkInTimePattern = /check[\s-]?in\s+time:?\s*([\d:]+\s*(?:am|pm)?)/i;
    const checkInTimeMatch = content.match(checkInTimePattern);
    if (checkInTimeMatch) {
      details.check_in_time = this.parseTime(checkInTimeMatch[1]) || undefined;
    }
    
    const checkOutTimePattern = /check[\s-]?out\s+time:?\s*([\d:]+\s*(?:am|pm)?)/i;
    const checkOutTimeMatch = content.match(checkOutTimePattern);
    if (checkOutTimeMatch) {
      details.check_out_time = this.parseTime(checkOutTimeMatch[1]) || undefined;
    }
    
    return details;
  }
}