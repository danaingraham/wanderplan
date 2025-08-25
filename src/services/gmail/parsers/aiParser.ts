import { BaseEmailParser } from './base/ParserInterface';
import type { EmailMessage, ParsedEmailData } from '../../../types/travelBooking';
// import { openaiService } from '../../openai'; // TODO: Add proper OpenAI integration

export class AIFallbackParser extends BaseEmailParser {
  readonly provider = 'ai_fallback';
  readonly displayName = 'AI Parser (OpenAI)';
  readonly priority = 10; // Low priority - use only as fallback
  
  canParse(email: EmailMessage): boolean {
    // AI parser can theoretically parse any email
    // But we only use it as a fallback, so check for travel-related keywords
    const travelKeywords = [
      'booking', 'reservation', 'confirmation', 'flight', 'hotel',
      'airbnb', 'rental', 'restaurant', 'ticket', 'itinerary',
      'check-in', 'check-out', 'departure', 'arrival', 'travel'
    ];
    
    const content = `${email.subject} ${email.from}`.toLowerCase();
    return travelKeywords.some(keyword => content.includes(keyword));
  }
  
  async parse(email: EmailMessage): Promise<ParsedEmailData> {
    const startTime = Date.now();
    
    try {
      const content = this.getEmailContent(email);
      const extractedData = await this.extractWithAI(email, content);
      
      return this.createResult(
        extractedData,
        startTime,
        this.calculateConfidence(extractedData)
      );
    } catch (error) {
      console.error('AI Parser failed:', error);
      
      // Return minimal result on error
      return this.createResult(
        {
          provider: 'unknown',
          booking_type: 'activity',
          title: email.subject,
          email_id: email.id,
          email_date: email.date,
          email_subject: email.subject,
          is_ai_parsed: true,
          booking_status: 'pending'
        },
        startTime,
        0.1
      );
    }
  }
  
  private async extractWithAI(
    email: EmailMessage, 
    content: string
  ): Promise<Partial<ParsedEmailData['booking']>> {
    const prompt = `Extract travel booking information from this email. Return ONLY valid JSON with these fields (use null for missing values):

{
  "provider": "company name (e.g., airbnb, united, booking.com)",
  "booking_type": "accommodation|flight|restaurant|activity|car_rental|train|cruise",
  "title": "property/flight/restaurant name",
  "confirmation_number": "booking reference",
  "location_name": "city, state/country",
  "location_address": "full address if available",
  "start_date": "YYYY-MM-DD format",
  "end_date": "YYYY-MM-DD format or null",
  "start_time": "HH:MM format or null",
  "end_time": "HH:MM format or null",
  "total_price": numeric value or null,
  "currency": "USD|EUR|GBP etc",
  "details": {
    "flight_number": "for flights",
    "seat_number": "for flights",
    "property_type": "for accommodations",
    "party_size": "for restaurants",
    "additional_info": "any other relevant details"
  }
}

Email Subject: ${email.subject}
Email From: ${email.from}
Email Date: ${email.date}

Email Content:
${content.substring(0, 3000)} // Limit content to avoid token limits
`;

    try {
      // TODO: Use the OpenAI service to extract data
      // For now, return a mock response
      const response = await this.mockOpenAIResponse(prompt);
      /*
      const response = await openaiService.createCompletion({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: 'You are a travel booking data extractor. Extract structured data from emails and return ONLY valid JSON. Be precise and accurate.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.1, // Low temperature for consistent extraction
        max_tokens: 500
      });
      */
      
      const responseText = response;
      
      // Try to parse the JSON response
      const extracted = this.parseJSONResponse(responseText);
      
      // Convert to our format
      return {
        provider: extracted.provider || 'unknown',
        booking_type: this.validateBookingType(extracted.booking_type),
        title: extracted.title || email.subject,
        confirmation_number: extracted.confirmation_number,
        location_name: extracted.location_name,
        location_address: extracted.location_address,
        start_date: this.validateDate(extracted.start_date),
        end_date: this.validateDate(extracted.end_date),
        start_time: this.validateTime(extracted.start_time),
        end_time: this.validateTime(extracted.end_time),
        total_price: this.validatePrice(extracted.total_price),
        currency: extracted.currency || 'USD',
        details: extracted.details || {},
        is_ai_parsed: true,
        email_id: email.id,
        email_date: email.date,
        email_subject: email.subject,
        booking_status: 'confirmed'
      };
    } catch (error) {
      console.error('AI extraction failed:', error);
      throw error;
    }
  }
  
  private parseJSONResponse(text: string): any {
    try {
      // Try to extract JSON from the response
      // Sometimes AI adds explanation text around the JSON
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      return JSON.parse(text);
    } catch (error) {
      console.error('Failed to parse AI response as JSON:', text);
      return {};
    }
  }
  
  private validateBookingType(type: any): ParsedEmailData['booking']['booking_type'] {
    const validTypes = ['accommodation', 'flight', 'restaurant', 'activity', 'car_rental', 'train', 'cruise'];
    if (validTypes.includes(type)) {
      return type;
    }
    return 'activity'; // Default fallback
  }
  
  private validateDate(dateStr: any): string | undefined {
    if (!dateStr) return undefined;
    
    try {
      const date = new Date(dateStr);
      if (!isNaN(date.getTime())) {
        return date.toISOString().split('T')[0];
      }
    } catch (error) {
      console.error('Invalid date:', dateStr);
    }
    
    return undefined;
  }
  
  private validateTime(timeStr: any): string | undefined {
    if (!timeStr) return undefined;
    
    // Check if it matches HH:MM format
    if (typeof timeStr === 'string' && /^\d{1,2}:\d{2}$/.test(timeStr)) {
      return timeStr;
    }
    
    return undefined;
  }
  
  private validatePrice(price: any): number | undefined {
    if (price === null || price === undefined) return undefined;
    
    const num = typeof price === 'string' ? 
      parseFloat(price.replace(/[^0-9.]/g, '')) : 
      parseFloat(price);
    
    return !isNaN(num) ? num : undefined;
  }
  
  private async mockOpenAIResponse(prompt: string): Promise<string> {
    // Mock response for testing - in production, use actual OpenAI
    console.log('AI Parser: Would send to OpenAI:', prompt.substring(0, 200) + '...');
    return '{}';
  }
  
  private calculateConfidence(data: Partial<ParsedEmailData['booking']>): number {
    let score = 0;
    let totalFields = 0;
    
    // Required fields (weighted more)
    const requiredFields = ['title', 'start_date', 'booking_type', 'provider'];
    const optionalFields = ['confirmation_number', 'location_name', 'total_price', 'end_date'];
    
    for (const field of requiredFields) {
      totalFields += 2; // Weight required fields double
      if (data[field as keyof typeof data]) {
        score += 2;
      }
    }
    
    for (const field of optionalFields) {
      totalFields += 1;
      if (data[field as keyof typeof data]) {
        score += 1;
      }
    }
    
    // AI parsed emails get a slight confidence penalty
    const confidence = (score / totalFields) * 0.7; // Max 0.7 for AI parsed
    
    return Math.min(Math.max(confidence, 0.1), 0.7); // Between 0.1 and 0.7
  }
}