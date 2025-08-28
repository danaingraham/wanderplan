import { BaseEmailParser } from '../base/ParserInterface';
import type { DetectionSignals, DetectionSignal } from '../base/ParserInterface';
import type { EmailMessage, ParsedEmailData, BookingDetails } from '../../../../types/travelBooking';

export class RestaurantParser extends BaseEmailParser {
  readonly provider = 'restaurant';
  readonly displayName = 'Restaurant Reservations';
  readonly priority = 85;

  private readonly providers = {
    opentable: {
      domains: ['opentable.com'],
      names: ['OpenTable'],
      patterns: [/opentable/i]
    },
    resy: {
      domains: ['resy.com'],
      names: ['Resy'],
      patterns: [/resy/i]
    },
    yelp: {
      domains: ['yelp.com', 'yelpreservations.com'],
      names: ['Yelp'],
      patterns: [/yelp/i]
    },
    sevenrooms: {
      domains: ['sevenrooms.com'],
      names: ['SevenRooms'],
      patterns: [/sevenrooms/i]
    },
    tock: {
      domains: ['tock.com', 'exploretock.com'],
      names: ['Tock'],
      patterns: [/tock/i]
    },
    quandoo: {
      domains: ['quandoo.com'],
      names: ['Quandoo'],
      patterns: [/quandoo/i]
    }
  };

  // Restaurant indicators for future use
  // private readonly restaurantIndicators = [
  //   'reservation', 'dining', 'restaurant', 'table', 'party size',
  //   'guests', 'diner', 'meal', 'brunch', 'lunch', 'dinner'
  // ];

  canParse(email: EmailMessage): boolean {
    const signals = this.detectRestaurantSignals(email);
    return this.hasMinimumSignals(signals);
  }

  private detectRestaurantSignals(email: EmailMessage): DetectionSignals {
    return {
      domain: this.checkRestaurantDomains(email.from),
      provider: this.checkProviderMentions(email),
      subject: this.checkRestaurantSubject(email.subject),
      structure: this.checkRestaurantStructure(email),
      timing: this.checkMealTiming(email)
    };
  }

  private checkRestaurantDomains(from: string): DetectionSignal {
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
    
    // Check for restaurant-related domains
    if (/restaurant|dining|reservations/i.test(fromLower)) {
      return { 
        match: true, 
        confidence: 0.6, 
        source: 'restaurant-domain'
      };
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

  private checkRestaurantSubject(subject: string): DetectionSignal {
    const patterns = [
      /reservation\s+confirmed/i,
      /dining\s+reservation/i,
      /table\s+(?:for|reserved)/i,
      /your\s+reservation\s+at/i,
      /confirmed:\s+.*restaurant/i
    ];
    
    for (const pattern of patterns) {
      if (pattern.test(subject)) {
        return { 
          match: true, 
          confidence: 0.85,
          source: `subject:${pattern}`
        };
      }
    }
    
    return { match: false, confidence: 0 };
  }

  private checkRestaurantStructure(email: EmailMessage): DetectionSignal {
    const content = this.getEmailContent(email);
    const hasRestaurant = /restaurant|dining|cuisine/i.test(content);
    const hasPartySize = /party\s+(?:of|size)|guests?|diners?/i.test(content);
    const hasTime = /\d{1,2}:\d{2}\s*(?:am|pm)?/i.test(content);
    const hasDate = this.hasDatePattern(content);
    const hasReservation = /reservation|booking|confirmed/i.test(content);
    
    const elements = [hasRestaurant, hasPartySize, hasTime, hasDate, hasReservation]
      .filter(Boolean).length;
    
    if (elements >= 3) {
      return { 
        match: true, 
        confidence: 0.6 + (elements * 0.08),
        value: elements,
        source: 'structure:restaurant'
      };
    }
    
    return { match: false, confidence: 0 };
  }

  private checkMealTiming(email: EmailMessage): DetectionSignal {
    const content = this.getEmailContent(email);
    const timeMatch = content.match(/\b(\d{1,2}):(\d{2})\s*(?:([ap])\.?m\.?)?/i);
    
    if (timeMatch) {
      let hour = parseInt(timeMatch[1]);
      const period = timeMatch[3];
      
      if (period) {
        if (period.toLowerCase() === 'p' && hour < 12) hour += 12;
        if (period.toLowerCase() === 'a' && hour === 12) hour = 0;
      }
      
      // Check if time falls within typical meal hours
      const isBreakfast = hour >= 6 && hour < 11;
      const isBrunch = hour >= 10 && hour < 14;
      const isLunch = hour >= 11 && hour < 15;
      const isDinner = hour >= 17 && hour < 23;
      const isLateNight = hour >= 22 || hour < 2;
      
      if (isBreakfast || isBrunch || isLunch || isDinner || isLateNight) {
        return { 
          match: true, 
          confidence: 0.7,
          value: { hour, isBreakfast, isBrunch, isLunch, isDinner, isLateNight },
          source: 'meal-timing'
        };
      }
    }
    
    return { match: false, confidence: 0 };
  }

  private hasDatePattern(content: string): boolean {
    const patterns = [
      /\d{1,2}\/\d{1,2}\/\d{2,4}/,
      /\d{4}-\d{2}-\d{2}/,
      /\w+\s+\d{1,2},?\s+\d{4}/i
    ];
    
    return patterns.some(pattern => pattern.test(content));
  }

  async parse(email: EmailMessage): Promise<ParsedEmailData> {
    const startTime = Date.now();
    const content = this.getEmailContent(email);
    const signals = this.detectRestaurantSignals(email);
    
    const provider = signals.provider?.value || signals.domain?.value || 'restaurant';
    
    const restaurantName = this.extractRestaurantName(content, email.subject);
    const reservationDate = this.extractDate(content);
    const reservationTime = this.extractTime(content);
    const partySize = this.extractPartySize(content);
    const location = this.extractLocation(content);
    const confirmationNumber = this.extractConfirmationNumber(content);
    const details = this.extractRestaurantDetails(content);
    
    return this.createResult({
      provider,
      booking_type: 'restaurant',
      title: restaurantName,
      confirmation_number: confirmationNumber,
      location_name: location.city,
      location_address: location.address,
      start_date: reservationDate,
      start_time: reservationTime,
      details: {
        ...details,
        party_size: partySize,
        cuisine_type: this.extractCuisineType(content)
      },
      email_id: email.id,
      email_date: email.date,
      email_subject: email.subject,
      booking_status: 'confirmed'
    }, startTime);
  }

  private extractRestaurantName(content: string, subject: string): string {
    // Try subject first
    const subjectPatterns = [
      /reservation\s+at\s+(.+?)$/i,
      /confirmed:\s+(.+?)$/i,
      /table\s+at\s+(.+?)$/i
    ];
    
    for (const pattern of subjectPatterns) {
      const match = subject.match(pattern);
      if (match) {
        return match[1].trim();
      }
    }
    
    // Try content
    const contentPatterns = [
      /restaurant:?\s*([^\n]+)/i,
      /at\s+([A-Z][^,\n]+?)(?:\s+on\s+|\s+at\s+|\n)/,
      /venue:?\s*([^\n]+)/i
    ];
    
    for (const pattern of contentPatterns) {
      const match = content.match(pattern);
      if (match) {
        return match[1].trim();
      }
    }
    
    return 'Restaurant';
  }

  private extractDate(content: string): string | undefined {
    const date = this.parseDate(content);
    return date || undefined;
  }

  private extractTime(content: string): string | undefined {
    const time = this.parseTime(content);
    return time || undefined;
  }

  private extractPartySize(content: string): number | undefined {
    const patterns = [
      /party\s+(?:of|size):?\s*(\d+)/i,
      /(\d+)\s*(?:guests?|diners?|people)/i,
      /table\s+for\s+(\d+)/i,
      /reservation\s+for\s+(\d+)/i
    ];
    
    for (const pattern of patterns) {
      const match = content.match(pattern);
      if (match) {
        return parseInt(match[1]);
      }
    }
    
    return undefined;
  }

  private extractLocation(content: string): { city?: string; address?: string } {
    const result: any = {};
    
    // Address patterns
    const addressPatterns = [
      /address:?\s*([^\n]+)/i,
      /location:?\s*([^\n]+)/i,
      /(\d+\s+[^,\n]+(?:street|st|avenue|ave|road|rd)[^,\n]*)/i
    ];
    
    for (const pattern of addressPatterns) {
      const match = content.match(pattern);
      if (match) {
        result.address = match[1].trim();
        break;
      }
    }
    
    // City extraction
    if (result.address) {
      const cityMatch = result.address.match(/,\s*([^,]+),\s*[A-Z]{2}/);
      if (cityMatch) {
        result.city = cityMatch[1].trim();
      }
    }
    
    return result;
  }

  private extractConfirmationNumber(content: string): string | undefined {
    const patterns = [
      /confirmation\s*(?:number|code|#)?:?\s*([A-Z0-9-]+)/i,
      /reservation\s*(?:number|code|id|#)?:?\s*([A-Z0-9-]+)/i,
      /reference:?\s*([A-Z0-9-]+)/i
    ];
    
    for (const pattern of patterns) {
      const match = content.match(pattern);
      if (match) {
        return match[1].trim();
      }
    }
    
    return undefined;
  }

  private extractCuisineType(content: string): string | undefined {
    const cuisineTypes = [
      'italian', 'french', 'japanese', 'chinese', 'mexican', 'thai',
      'indian', 'american', 'mediterranean', 'spanish', 'korean',
      'vietnamese', 'greek', 'steakhouse', 'seafood', 'sushi'
    ];
    
    const contentLower = content.toLowerCase();
    for (const cuisine of cuisineTypes) {
      if (contentLower.includes(cuisine)) {
        return cuisine.charAt(0).toUpperCase() + cuisine.slice(1);
      }
    }
    
    return undefined;
  }

  private extractRestaurantDetails(content: string): BookingDetails {
    const details: BookingDetails = {};
    
    // Special requests
    const requestPattern = /(?:special\s+)?requests?:?\s*([^\n]+)/i;
    const requestMatch = content.match(requestPattern);
    if (requestMatch) {
      details.special_requests = requestMatch[1].trim();
    }
    
    // Meal period
    const mealPattern = /\b(breakfast|brunch|lunch|dinner|supper)\b/i;
    const mealMatch = content.match(mealPattern);
    if (mealMatch) {
      details.meal_period = mealMatch[1].toLowerCase();
    }
    
    return details;
  }
}