import { BaseEmailParser } from '../base/ParserInterface';
import type { DetectionSignals, DetectionSignal } from '../base/ParserInterface';
import type { EmailMessage, ParsedEmailData, BookingDetails } from '../../../../types/travelBooking';

export class VacationRentalParser extends BaseEmailParser {
  readonly provider = 'vacation_rental';
  readonly displayName = 'Vacation Rentals (VRBO, HomeAway, etc.)';
  readonly priority = 85;

  private readonly providers = {
    vrbo: {
      domains: ['vrbo.com', 'homeaway.com'],
      names: ['VRBO', 'HomeAway'],
      patterns: [/vrbo/i, /homeaway/i],
      confirmationPattern: /\d{7,}/
    },
    vacasa: {
      domains: ['vacasa.com'],
      names: ['Vacasa'],
      patterns: [/vacasa/i],
      confirmationPattern: /\d{6,}/
    },
    tripadvisor: {
      domains: ['tripadvisor.com', 'tripadvisorrentals.com'],
      names: ['TripAdvisor Rentals', 'FlipKey'],
      patterns: [/tripadvisor.*rental/i, /flipkey/i],
      confirmationPattern: /\d{6,}/
    },
    flipkey: {
      domains: ['flipkey.com'],
      names: ['FlipKey'],
      patterns: [/flipkey/i],
      confirmationPattern: /\d{6,}/
    }
  };

  // Rental indicators for future use
  // private readonly rentalIndicators = [
  //   'property', 'house', 'villa', 'apartment', 'condo', 'cottage', 'cabin',
  //   'check-in instructions', 'house rules', 'owner', 'host', 'property manager',
  //   'security deposit', 'cleaning fee', 'vacation rental'
  // ];

  canParse(email: EmailMessage): boolean {
    const signals = this.detectRentalSignals(email);
    
    // Log potential new vacation rental domain
    if (!signals.domain?.match && signals.propertyType?.confidence && signals.propertyType.confidence > 0.7) {
      console.log(`📧 Potential vacation rental email: ${email.from}`);
    }
    
    return this.hasMinimumSignals(signals);
  }

  private detectRentalSignals(email: EmailMessage): DetectionSignals {
    return {
      domain: this.checkRentalDomains(email.from),
      provider: this.checkProviderMentions(email),
      subject: this.checkRentalSubjectPatterns(email.subject),
      propertyType: this.checkPropertyType(email),
      structure: this.checkRentalStructure(email),
      fees: this.checkRentalFees(email)
    };
  }

  private checkRentalDomains(from: string): DetectionSignal {
    const fromLower = from.toLowerCase();
    
    for (const [provider, config] of Object.entries(this.providers)) {
      for (const domain of config.domains) {
        if (fromLower.includes(domain)) {
          return { 
            match: true, 
            confidence: 1.0, 
            value: provider,
            source: `domain:${domain}`
          };
        }
      }
    }
    
    // Check patterns in domain
    for (const [provider, config] of Object.entries(this.providers)) {
      for (const pattern of config.patterns) {
        if (pattern.test(fromLower)) {
          return { 
            match: true, 
            confidence: 0.6, 
            value: provider,
            source: `pattern:${pattern}`
          };
        }
      }
    }
    
    return { match: false, confidence: 0 };
  }

  private checkProviderMentions(email: EmailMessage): DetectionSignal {
    const content = this.getEmailContent(email);
    const allText = `${email.subject} ${content}`.toLowerCase();
    
    for (const [provider, config] of Object.entries(this.providers)) {
      for (const name of config.names) {
        if (allText.includes(name.toLowerCase())) {
          return { 
            match: true, 
            confidence: 0.9,
            value: provider,
            source: `provider:${name}`
          };
        }
      }
    }
    
    return { match: false, confidence: 0 };
  }

  private checkRentalSubjectPatterns(subject: string): DetectionSignal {
    const patterns = [
      /booking\s+confirmed/i,
      /reservation\s+confirmed/i,
      /property\s+booking/i,
      /vacation\s+rental/i,
      /your\s+stay\s+at/i,
      /booking\s+request\s+accepted/i,
      /rental\s+confirmation/i
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

  private checkPropertyType(email: EmailMessage): DetectionSignal {
    const content = this.getEmailContent(email);
    const propertyTypes = ['house', 'villa', 'apartment', 'condo', 'cottage', 'cabin', 'chalet', 'townhouse'];
    const foundTypes: string[] = [];
    
    for (const type of propertyTypes) {
      const pattern = new RegExp(`\\b${type}\\b`, 'i');
      if (pattern.test(content)) {
        foundTypes.push(type);
      }
    }
    
    if (foundTypes.length > 0) {
      return { 
        match: true, 
        confidence: 0.7 + (foundTypes.length * 0.1),
        value: foundTypes,
        source: 'property-type'
      };
    }
    
    return { match: false, confidence: 0 };
  }

  private checkRentalStructure(email: EmailMessage): DetectionSignal {
    const content = this.getEmailContent(email);
    const hasCheckIn = /check[\s-]?in/i.test(content);
    const hasCheckOut = /check[\s-]?out/i.test(content);
    const hasProperty = /property|house|villa|apartment|condo/i.test(content);
    const hasHost = /host|owner|property\s+manager/i.test(content);
    const hasInstructions = /instruction|direction|access|key|code/i.test(content);
    const hasRules = /house\s+rules|property\s+rules|rules/i.test(content);
    
    const elements = [hasCheckIn, hasCheckOut, hasProperty, hasHost, hasInstructions, hasRules]
      .filter(Boolean).length;
    
    if (elements >= 3) {
      return { 
        match: true, 
        confidence: 0.6 + (elements * 0.08),
        value: elements,
        source: 'structure:rental'
      };
    }
    
    return { match: false, confidence: 0 };
  }

  private checkRentalFees(email: EmailMessage): DetectionSignal {
    const content = this.getEmailContent(email);
    const hasSecurityDeposit = /security\s+deposit|damage\s+deposit/i.test(content);
    const hasCleaningFee = /cleaning\s+fee/i.test(content);
    const hasServiceFee = /service\s+fee/i.test(content);
    const hasNightlyRate = /per\s+night|nightly\s+rate/i.test(content);
    
    const feeIndicators = [hasSecurityDeposit, hasCleaningFee, hasServiceFee, hasNightlyRate]
      .filter(Boolean).length;
    
    if (feeIndicators >= 2) {
      return { 
        match: true, 
        confidence: 0.7 + (feeIndicators * 0.05),
        value: feeIndicators,
        source: 'fees:rental'
      };
    }
    
    return { match: false, confidence: 0 };
  }

  async parse(email: EmailMessage): Promise<ParsedEmailData> {
    const startTime = Date.now();
    const content = this.getEmailContent(email);
    const signals = this.detectRentalSignals(email);
    
    // Determine provider
    const provider = signals.provider?.value || signals.domain?.value || 'vacation_rental';
    
    // Extract booking details
    const propertyName = this.extractPropertyName(content, email.subject);
    const propertyType = this.extractPropertyType(content);
    const { checkIn, checkOut } = this.extractDates(content);
    const location = this.extractLocation(content);
    const confirmationNumber = this.extractConfirmationNumber(content);
    const host = this.extractHostInfo(content);
    const pricing = this.extractPricing(content);
    const details = this.extractRentalDetails(content, propertyType);
    
    return this.createResult({
      provider,
      booking_type: 'accommodation',
      title: propertyName,
      confirmation_number: confirmationNumber,
      location_name: location.city,
      location_address: location.address,
      location_lat: location.lat,
      location_lng: location.lng,
      start_date: checkIn,
      end_date: checkOut,
      total_price: pricing.total,
      price_per_night: pricing.perNight,
      currency: pricing.currency || 'USD',
      details: {
        ...details,
        property_type: propertyType,
        host_name: host.name,
        host_email: host.email,
        security_deposit: pricing.securityDeposit,
        cleaning_fee: pricing.cleaningFee
      },
      email_id: email.id,
      email_date: email.date,
      email_subject: email.subject,
      booking_status: 'confirmed',
      parser_confidence: signals.provider?.confidence || signals.domain?.confidence || 0.7
    }, startTime);
  }

  private extractPropertyName(content: string, subject: string): string {
    // Try subject first
    const subjectPatterns = [
      /booking\s+(?:for|at)\s+(.+?)$/i,
      /reservation\s+(?:for|at)\s+(.+?)$/i,
      /confirmed:\s+(.+?)$/i
    ];
    
    for (const pattern of subjectPatterns) {
      const match = subject.match(pattern);
      if (match) {
        return match[1].trim();
      }
    }
    
    // Try content patterns
    const contentPatterns = [
      /property\s+name:?\s*([^\n]+)/i,
      /property:?\s*([^\n]+)/i,
      /listing\s+title:?\s*([^\n]+)/i,
      /staying\s+at\s+"?([^"\n]+)"?/i
    ];
    
    for (const pattern of contentPatterns) {
      const match = content.match(pattern);
      if (match) {
        return match[1].trim();
      }
    }
    
    // Extract from first line that looks like a property name
    const lines = content.split('\n');
    for (const line of lines) {
      if (line.length > 10 && line.length < 100 && 
          !line.includes('@') && !line.includes('$') &&
          /[A-Z]/.test(line) && !/dear|hello|hi\s/i.test(line)) {
        return line.trim();
      }
    }
    
    return 'Vacation Rental';
  }

  private extractPropertyType(content: string): string {
    const types = [
      { pattern: /\b(house|home)\b/i, value: 'house' },
      { pattern: /\bvilla\b/i, value: 'villa' },
      { pattern: /\bapartment\b/i, value: 'apartment' },
      { pattern: /\bcondo(minium)?\b/i, value: 'condo' },
      { pattern: /\bcottage\b/i, value: 'cottage' },
      { pattern: /\bcabin\b/i, value: 'cabin' },
      { pattern: /\bchalet\b/i, value: 'chalet' },
      { pattern: /\btownhouse\b/i, value: 'townhouse' },
      { pattern: /\bloft\b/i, value: 'loft' }
    ];
    
    for (const type of types) {
      if (type.pattern.test(content)) {
        return type.value;
      }
    }
    
    return 'property';
  }

  private extractDates(content: string): { checkIn?: string; checkOut?: string } {
    const result: { checkIn?: string; checkOut?: string } = {};
    
    const datePatterns = [
      /check[\s-]?in:?\s*([^(,\n]+?)(?:\s*at\s+[\d:]+|,|\n)/i,
      /arrival:?\s*([^(,\n]+?)(?:\s*at\s+[\d:]+|,|\n)/i,
      /check[\s-]?out:?\s*([^(,\n]+?)(?:\s*by\s+[\d:]+|,|\n)/i,
      /departure:?\s*([^(,\n]+?)(?:\s*by\s+[\d:]+|,|\n)/i
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

  private extractLocation(content: string): { 
    city?: string; 
    address?: string; 
    lat?: number; 
    lng?: number 
  } {
    const result: any = {};
    
    // Extract address
    const addressPatterns = [
      /property\s+address:?\s*([^\n]+)/i,
      /address:?\s*([^\n]+)/i,
      /location:?\s*([^\n]+)/i,
      /(\d+\s+[^,\n]+(?:street|st|avenue|ave|road|rd|drive|dr|lane|ln|way|court|ct)[^,\n]*)/i
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
      /in\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*),?\s+[A-Z]{2}/
    ];
    
    for (const pattern of cityPatterns) {
      const match = content.match(pattern);
      if (match) {
        result.city = match[1].trim();
        break;
      }
    }
    
    // Extract coordinates if available
    const coordPattern = /(-?\d+\.\d+),?\s*(-?\d+\.\d+)/;
    const coordMatch = content.match(coordPattern);
    if (coordMatch) {
      result.lat = parseFloat(coordMatch[1]);
      result.lng = parseFloat(coordMatch[2]);
    }
    
    return result;
  }

  private extractConfirmationNumber(content: string): string | undefined {
    const patterns = [
      /confirmation\s*(?:number|code|#)?:?\s*([A-Z0-9-]{6,})/i,
      /reservation\s*(?:number|code|#)?:?\s*([A-Z0-9-]{6,})/i,
      /booking\s*(?:number|id|reference|#)?:?\s*([A-Z0-9-]{6,})/i,
      /property\s*id:?\s*([A-Z0-9-]{6,})/i
    ];
    
    for (const pattern of patterns) {
      const match = content.match(pattern);
      if (match) {
        return match[1].trim();
      }
    }
    
    return undefined;
  }

  private extractHostInfo(content: string): { name?: string; email?: string; phone?: string } {
    const result: any = {};
    
    // Host name
    const namePatterns = [
      /host(?:ed\s+by)?:?\s*([A-Za-z\s]+?)(?:\n|,|$)/i,
      /owner:?\s*([A-Za-z\s]+?)(?:\n|,|$)/i,
      /property\s+manager:?\s*([A-Za-z\s]+?)(?:\n|,|$)/i
    ];
    
    for (const pattern of namePatterns) {
      const match = content.match(pattern);
      if (match) {
        result.name = match[1].trim();
        break;
      }
    }
    
    // Host email (be careful not to extract guest email)
    const emailPattern = /host\s+email:?\s*([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/i;
    const emailMatch = content.match(emailPattern);
    if (emailMatch) {
      result.email = emailMatch[1];
    }
    
    // Host phone
    const phonePattern = /host\s+phone:?\s*([\d\s()+-]+)/i;
    const phoneMatch = content.match(phonePattern);
    if (phoneMatch) {
      result.phone = phoneMatch[1].trim();
    }
    
    return result;
  }

  private extractPricing(content: string): { 
    total?: number; 
    perNight?: number; 
    securityDeposit?: number;
    cleaningFee?: number;
    currency?: string 
  } {
    const result: any = {};
    
    // Total price
    const totalPattern = /total(?:\s+cost|\s+price)?:?\s*\$?\s*([\d,]+\.?\d*)/i;
    const totalMatch = content.match(totalPattern);
    if (totalMatch) {
      result.total = parseFloat(totalMatch[1].replace(/,/g, ''));
    }
    
    // Per night price
    const perNightPattern = /(?:per\s+night|nightly\s+rate):?\s*\$?\s*([\d,]+\.?\d*)/i;
    const perNightMatch = content.match(perNightPattern);
    if (perNightMatch) {
      result.perNight = parseFloat(perNightMatch[1].replace(/,/g, ''));
    }
    
    // Security deposit
    const depositPattern = /(?:security|damage)\s+deposit:?\s*\$?\s*([\d,]+\.?\d*)/i;
    const depositMatch = content.match(depositPattern);
    if (depositMatch) {
      result.securityDeposit = parseFloat(depositMatch[1].replace(/,/g, ''));
    }
    
    // Cleaning fee
    const cleaningPattern = /cleaning\s+fee:?\s*\$?\s*([\d,]+\.?\d*)/i;
    const cleaningMatch = content.match(cleaningPattern);
    if (cleaningMatch) {
      result.cleaningFee = parseFloat(cleaningMatch[1].replace(/,/g, ''));
    }
    
    // Currency
    const currencyPattern = /\b(USD|EUR|GBP|CAD|AUD|MXN)\b/;
    const currencyMatch = content.match(currencyPattern);
    if (currencyMatch) {
      result.currency = currencyMatch[1];
    }
    
    return result;
  }

  private extractRentalDetails(content: string, propertyType: string): BookingDetails {
    const details: BookingDetails = {
      property_type: propertyType
    };
    
    // Number of guests
    const guestPattern = /(?:sleeps|accommodates|guests?):?\s*(\d+)/i;
    const guestMatch = content.match(guestPattern);
    if (guestMatch) {
      details.num_guests = parseInt(guestMatch[1]);
    }
    
    // Number of bedrooms
    const bedroomPattern = /(\d+)\s*(?:bedroom|br|bed)/i;
    const bedroomMatch = content.match(bedroomPattern);
    if (bedroomMatch) {
      details.num_rooms = parseInt(bedroomMatch[1]);
    }
    
    // Check-in/out times
    const checkInTimePattern = /check[\s-]?in\s+(?:time|after|from):?\s*([\d:]+\s*(?:am|pm)?)/i;
    const checkInTimeMatch = content.match(checkInTimePattern);
    if (checkInTimeMatch) {
      details.check_in_time = this.parseTime(checkInTimeMatch[1]) || undefined;
    }
    
    const checkOutTimePattern = /check[\s-]?out\s+(?:time|by|before):?\s*([\d:]+\s*(?:am|pm)?)/i;
    const checkOutTimeMatch = content.match(checkOutTimePattern);
    if (checkOutTimeMatch) {
      details.check_out_time = this.parseTime(checkOutTimeMatch[1]) || undefined;
    }
    
    // Extract amenities
    const amenityKeywords = ['wifi', 'pool', 'parking', 'kitchen', 'washer', 'dryer', 'air conditioning', 'heating'];
    const foundAmenities: string[] = [];
    
    for (const amenity of amenityKeywords) {
      if (new RegExp(`\\b${amenity}\\b`, 'i').test(content)) {
        foundAmenities.push(amenity);
      }
    }
    
    if (foundAmenities.length > 0) {
      details.amenities = foundAmenities;
    }
    
    return details;
  }
}