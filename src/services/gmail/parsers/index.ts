// Core parser framework
export { parserRegistry } from './base/ParserRegistry';
export type { IEmailParser } from './base/ParserInterface';
export { BaseEmailParser } from './base/ParserInterface';

// Provider-specific parsers
export { AirbnbParser } from './providers/airbnbParser';
export { BookingParser } from './providers/bookingParser';
export { AirlineParser } from './providers/airlineParser';
export { HotelChainParser } from './providers/hotelChainParser';
export { VacationRentalParser } from './providers/vacationRentalParser';
export { RestaurantParser } from './providers/restaurantParser';

// AI fallback parser
export { AIFallbackParser } from './aiParser';

// Initialize all parsers
import { parserRegistry } from './base/ParserRegistry';
import { AirbnbParser } from './providers/airbnbParser';
import { BookingParser } from './providers/bookingParser';
import { AirlineParser } from './providers/airlineParser';
import { HotelChainParser } from './providers/hotelChainParser';
import { VacationRentalParser } from './providers/vacationRentalParser';
import { RestaurantParser } from './providers/restaurantParser';
import { AIFallbackParser } from './aiParser';
import type { TravelBooking } from '../../../types/travelBooking';

// Gmail email format to parser format converter
export interface GmailEmailData {
  from: string;
  subject: string;
  body: string;
  date: string;
  id: string;
}

// Register all parsers on module load
export function initializeParsers() {
  console.log('🚀 Initializing email parsers...');
  
  // Register specific parsers (high priority)
  parserRegistry.register(new AirbnbParser());
  parserRegistry.register(new BookingParser());
  parserRegistry.register(new AirlineParser());
  
  // Register new flexible parsers
  parserRegistry.register(new HotelChainParser());
  parserRegistry.register(new VacationRentalParser());
  parserRegistry.register(new RestaurantParser());
  
  // Note: AI fallback parser should be created on-demand to avoid
  // initializing OpenAI unnecessarily
  
  console.log(`✅ Registered ${parserRegistry.getAllParsers().length} parsers`);
}

/**
 * Parse email from Gmail data format
 * This is the main entry point for parsing emails from Gmail
 */
export async function parseEmail(emailData: GmailEmailData): Promise<TravelBooking | null> {
  // Ensure parsers are initialized
  if (parserRegistry.getAllParsers().length === 0) {
    initializeParsers();
  }

  // Convert Gmail format to parser format
  const emailMessage = {
    id: emailData.id,
    subject: emailData.subject,
    from: emailData.from,
    to: '', // Not needed for parsing
    date: emailData.date,
    body_text: emailData.body,
    body_html: undefined,
    headers: {}
  };

  // Try each parser in priority order
  const parsers = parserRegistry.getAllParsers();
  
  for (const parser of parsers) {
    if (parser.canParse(emailMessage)) {
      try {
        console.log(`🔍 Parsing with ${parser.displayName}...`);
        const result = await parser.parse(emailMessage);
        
        if (result && result.confidence > 0.5) {
          // Convert ParsedEmailData to TravelBooking format
          const booking: TravelBooking = {
            id: emailData.id,
            user_id: '', // Will be set by the sync service
            provider: result.booking.provider || '',
            booking_type: result.booking.booking_type || 'activity',
            confirmation_number: result.booking.confirmation_number,
            booking_status: result.booking.booking_status || 'confirmed',
            title: result.booking.title || '',
            location_name: result.booking.location_name,
            location_address: result.booking.location_address,
            location_lat: result.booking.location_lat,
            location_lng: result.booking.location_lng,
            start_date: result.booking.start_date || '',
            end_date: result.booking.end_date,
            start_time: result.booking.start_time,
            end_time: result.booking.end_time,
            timezone: result.booking.timezone,
            total_price: result.booking.total_price,
            currency: result.booking.currency || 'USD',
            price_per_night: result.booking.price_per_night,
            details: result.booking.details,
            email_id: emailData.id,
            email_date: emailData.date,
            email_subject: emailData.subject,
            parsed_at: new Date().toISOString(),
            parser_version: result.booking.parser_version,
            parser_confidence: result.confidence,
            is_ai_parsed: parser.provider === 'ai_fallback',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          };
          
          console.log(`✅ Successfully parsed with ${parser.displayName} (confidence: ${result.confidence})`);
          return booking;
        }
      } catch (error) {
        console.error(`Failed to parse with ${parser.displayName}:`, error);
      }
    }
  }

  // Try AI fallback parser if no specific parser worked
  if (import.meta.env.VITE_OPENAI_API_KEY) {
    try {
      console.log('🤖 Attempting AI fallback parser...');
      const aiFallback = new AIFallbackParser();
      const result = await aiFallback.parse(emailMessage);
      
      if (result && result.confidence > 0.3) {
        const booking: TravelBooking = {
          id: emailData.id,
          user_id: '', // Will be set by the sync service
          provider: result.booking.provider || 'unknown',
          booking_type: result.booking.booking_type || 'activity',
          confirmation_number: result.booking.confirmation_number,
          booking_status: result.booking.booking_status || 'confirmed',
          title: result.booking.title || '',
          location_name: result.booking.location_name,
          location_address: result.booking.location_address,
          location_lat: result.booking.location_lat,
          location_lng: result.booking.location_lng,
          start_date: result.booking.start_date || '',
          end_date: result.booking.end_date,
          start_time: result.booking.start_time,
          end_time: result.booking.end_time,
          timezone: result.booking.timezone,
          total_price: result.booking.total_price,
          currency: result.booking.currency || 'USD',
          price_per_night: result.booking.price_per_night,
          details: result.booking.details,
          email_id: emailData.id,
          email_date: emailData.date,
          email_subject: emailData.subject,
          parsed_at: new Date().toISOString(),
          parser_version: result.booking.parser_version,
          parser_confidence: result.confidence,
          is_ai_parsed: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
        
        console.log(`✅ AI parser succeeded (confidence: ${result.confidence})`);
        return booking;
      }
    } catch (error) {
      console.error('AI fallback parser failed:', error);
    }
  }

  console.log(`❌ No parser could handle email: ${emailData.subject}`);
  return null;
}

// Auto-initialize if in development
if (import.meta.env.DEV) {
  initializeParsers();
}