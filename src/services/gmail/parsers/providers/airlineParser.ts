import { BaseEmailParser } from '../base/ParserInterface';
import type { EmailMessage, ParsedEmailData, BookingDetails } from '../../../../types/travelBooking';

export class AirlineParser extends BaseEmailParser {
  readonly provider = 'airline';
  readonly displayName = 'Airline (Multi)';
  readonly priority = 85; // Slightly lower than specific parsers
  
  private readonly airlines = {
    'united.com': 'United Airlines',
    'unitedairlines': 'United Airlines', 
    'delta.com': 'Delta Air Lines',
    'deltaairlines': 'Delta Air Lines',
    'aa.com': 'American Airlines',
    'americanairlines': 'American Airlines',
    'southwest.com': 'Southwest Airlines',
    'jetblue.com': 'JetBlue',
    'alaskaair.com': 'Alaska Airlines',
    'spirit.com': 'Spirit Airlines',
    'frontier.com': 'Frontier Airlines',
    'lufthansa.com': 'Lufthansa',
    'airfrance': 'Air France',
    'klm.com': 'KLM',
    'britishairways': 'British Airways',
    'emirates.com': 'Emirates',
  };
  
  canParse(email: EmailMessage): boolean {
    // Check if from any airline domain
    const fromLower = email.from.toLowerCase();
    const isAirline = Object.keys(this.airlines).some(domain => fromLower.includes(domain));
    
    if (!isAirline) {
      return false;
    }
    
    // Check for flight confirmation keywords
    const flightKeywords = [
      'flight confirmation',
      'booking confirmation',
      'ticket',
      'itinerary',
      'boarding pass',
      'eticket',
      'your flight',
      'reservation'
    ];
    
    return this.hasKeywords(email.subject, flightKeywords);
  }
  
  async parse(email: EmailMessage): Promise<ParsedEmailData> {
    const startTime = Date.now();
    const content = this.getEmailContent(email);
    
    // Determine specific airline
    const airline = this.detectAirline(email.from);
    
    // Extract flight details
    const flights = this.extractFlights(content);
    const primaryFlight = flights[0] || {};
    
    // Extract confirmation details
    const confirmationNumber = this.extractConfirmationNumber(content);
    const price = this.extractPrice(content);
    
    // Build details object
    const details: BookingDetails = {
      airline,
      flight_number: primaryFlight.flightNumber,
      departure_airport: primaryFlight.departureAirport,
      arrival_airport: primaryFlight.arrivalAirport,
      seat_number: primaryFlight.seat,
      cabin_class: primaryFlight.cabinClass,
      all_flights: flights // Store all flights for round trips
    };
    
    // Create title
    const title = primaryFlight.flightNumber || 
                 `${airline} ${primaryFlight.departureAirport || 'Flight'} to ${primaryFlight.arrivalAirport || 'Destination'}`;
    
    return this.createResult({
      provider: airline.toLowerCase().replace(/\s+/g, '_'),
      booking_type: 'flight',
      title,
      confirmation_number: confirmationNumber,
      location_name: `${primaryFlight.departureAirport} to ${primaryFlight.arrivalAirport}`,
      start_date: primaryFlight.date,
      start_time: primaryFlight.departureTime,
      end_time: primaryFlight.arrivalTime,
      total_price: price.total,
      currency: price.currency || 'USD',
      details,
      email_id: email.id,
      email_date: email.date,
      email_subject: email.subject,
      booking_status: this.getBookingStatus(email.subject, content)
    }, startTime);
  }
  
  private detectAirline(from: string): string {
    const fromLower = from.toLowerCase();
    
    for (const [domain, name] of Object.entries(this.airlines)) {
      if (fromLower.includes(domain)) {
        return name;
      }
    }
    
    // Try to extract from email address
    const match = from.match(/@([^.]+)/);
    if (match && match[1]) {
      return match[1].charAt(0).toUpperCase() + match[1].slice(1) + ' Airlines';
    }
    
    return 'Airline';
  }
  
  private extractFlights(content: string): any[] {
    const flights = [];
    
    // Common flight patterns
    const flightPatterns = [
      // Flight number patterns
      /(?:flight|flt):?\s*([A-Z]{2,3}\s*\d{1,4})/gi,
      /([A-Z]{2,3})\s*(\d{3,4})(?:\s|$)/g,
    ];
    
    // Date patterns for flights
    const datePatterns = [
      /(?:departure|depart|date):?\s*([^,\n]+?)(?:\n|,|$)/gi,
      /(\w+\s+\d{1,2},?\s+\d{4})/g,
    ];
    
    // Airport patterns
    const airportPatterns = [
      /([A-Z]{3})\s*(?:to|→|-|>)\s*([A-Z]{3})/g,
      /from\s+([^(]+)\s*\(([A-Z]{3})\)/gi,
      /to\s+([^(]+)\s*\(([A-Z]{3})\)/gi,
    ];
    
    // Time patterns
    const timePatterns = [
      /depart:?\s*(\d{1,2}:\d{2}\s*(?:AM|PM)?)/gi,
      /arrive:?\s*(\d{1,2}:\d{2}\s*(?:AM|PM)?)/gi,
    ];
    
    // Try to extract structured flight segments
    const segmentPattern = /(?:flight|departure|segment)[\s\S]*?(?=(?:flight|departure|segment|passenger|total|$))/gi;
    const segments = content.match(segmentPattern) || [content];
    
    for (const segment of segments.slice(0, 4)) { // Max 4 flights
      const flight: any = {};
      
      // Extract flight number
      for (const pattern of flightPatterns) {
        const matches = [...segment.matchAll(pattern)];
        if (matches.length > 0) {
          const match = matches[0];
          flight.flightNumber = match[1] ? match[1].replace(/\s+/g, ' ').trim() : 
                               `${match[1]}${match[2]}`;
          break;
        }
      }
      
      // Extract airports
      const airportMatches = [...segment.matchAll(airportPatterns[0])];
      if (airportMatches.length > 0) {
        flight.departureAirport = airportMatches[0][1];
        flight.arrivalAirport = airportMatches[0][2];
      }
      
      // Extract date
      const dateMatch = segment.match(datePatterns[1]);
      if (dateMatch) {
        flight.date = this.parseDate(dateMatch[1]);
      }
      
      // Extract times
      const departTimeMatches = [...segment.matchAll(timePatterns[0])];
      if (departTimeMatches.length > 0) {
        flight.departureTime = this.parseTime(departTimeMatches[0][1]);
      }
      
      const arriveTimeMatches = [...segment.matchAll(timePatterns[1])];
      if (arriveTimeMatches.length > 0) {
        flight.arrivalTime = this.parseTime(arriveTimeMatches[0][1]);
      }
      
      // Extract seat
      const seatMatch = segment.match(/seat:?\s*([A-Z]?\d{1,3}[A-Z]?)/i);
      if (seatMatch) {
        flight.seat = seatMatch[1].toUpperCase();
      }
      
      // Extract cabin class
      const cabinPatterns = ['first', 'business', 'premium economy', 'economy', 'basic economy', 'main cabin'];
      const lowerSegment = segment.toLowerCase();
      for (const cabin of cabinPatterns) {
        if (lowerSegment.includes(cabin)) {
          flight.cabinClass = cabin.charAt(0).toUpperCase() + cabin.slice(1);
          break;
        }
      }
      
      // Only add if we have meaningful data
      if (flight.flightNumber || (flight.departureAirport && flight.arrivalAirport)) {
        flights.push(flight);
      }
    }
    
    return flights;
  }
  
  private extractConfirmationNumber(content: string): string | undefined {
    const patterns = [
      /confirmation\s*(?:code|number|#)?:?\s*([A-Z0-9]{5,})/i,
      /(?:record|booking)\s*locator:?\s*([A-Z0-9]{5,})/i,
      /reference\s*(?:number|#)?:?\s*([A-Z0-9]{5,})/i,
      /ticket\s*number:?\s*([\d-]+)/i,
    ];
    
    for (const pattern of patterns) {
      const match = content.match(pattern);
      if (match && match[1]) {
        return match[1].trim();
      }
    }
    
    return undefined;
  }
  
  /* Currently unused but kept for future use
  private extractPassenger(content: string): string | undefined {
    const patterns = [
      /passenger:?\s*([^\n,]+)/i,
      /traveler:?\s*([^\n,]+)/i,
      /name:?\s*([A-Z][a-z]+\s+[A-Z][a-z]+)/,
    ];
    
    for (const pattern of patterns) {
      const match = content.match(pattern);
      if (match && match[1]) {
        const name = match[1].trim();
        // Basic validation - should have at least two words
        if (name.split(/\s+/).length >= 2) {
          return name;
        }
      }
    }
    
    return undefined;
  }
  */
  
  private extractPrice(content: string): { total?: number; currency?: string } {
    const result: { total?: number; currency?: string } = {};
    
    // Look for total fare/price
    const pricePatterns = [
      /total\s*(?:fare|price|amount)?:?\s*\$?([\d,]+\.?\d*)/i,
      /fare:?\s*\$?([\d,]+\.?\d*)/i,
      /amount\s*(?:paid|due)?:?\s*\$?([\d,]+\.?\d*)/i,
    ];
    
    for (const pattern of pricePatterns) {
      const match = content.match(pattern);
      if (match && match[1]) {
        result.total = parseFloat(match[1].replace(/,/g, ''));
        break;
      }
    }
    
    // If no specific pattern, use generic parser
    if (!result.total) {
      result.total = this.parsePrice(content) || undefined;
    }
    
    // Extract currency
    const currencyMatch = content.match(/(USD|EUR|GBP|CAD|AUD|JPY|CNY)/);
    if (currencyMatch) {
      result.currency = currencyMatch[1];
    }
    
    return result;
  }
  
  private getBookingStatus(subject: string, content: string): 'confirmed' | 'cancelled' | 'pending' {
    const combined = `${subject} ${content}`.toLowerCase();
    
    if (combined.includes('cancel') || combined.includes('refund')) {
      return 'cancelled';
    }
    
    if (combined.includes('pending') || combined.includes('waitlist') || combined.includes('standby')) {
      return 'pending';
    }
    
    return 'confirmed';
  }
}