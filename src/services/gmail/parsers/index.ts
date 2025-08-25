// Core parser framework
export { parserRegistry } from './base/ParserRegistry';
export type { IEmailParser } from './base/ParserInterface';
export { BaseEmailParser } from './base/ParserInterface';

// Provider-specific parsers
export { AirbnbParser } from './providers/airbnbParser';
export { BookingParser } from './providers/bookingParser';
export { AirlineParser } from './providers/airlineParser';

// AI fallback parser
export { AIFallbackParser } from './aiParser';

// Initialize all parsers
import { parserRegistry } from './base/ParserRegistry';
import { AirbnbParser } from './providers/airbnbParser';
import { BookingParser } from './providers/bookingParser';
import { AirlineParser } from './providers/airlineParser';

// Register all parsers on module load
export function initializeParsers() {
  console.log('🚀 Initializing email parsers...');
  
  // Register specific parsers (high priority)
  parserRegistry.register(new AirbnbParser());
  parserRegistry.register(new BookingParser());
  parserRegistry.register(new AirlineParser());
  
  // Note: AI fallback parser should be created on-demand to avoid
  // initializing OpenAI unnecessarily
  
  console.log(`✅ Registered ${parserRegistry.getAllParsers().length} parsers`);
}

// Auto-initialize if in development
if (import.meta.env.DEV) {
  initializeParsers();
}