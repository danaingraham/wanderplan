import type { EmailMessage, ParsedEmailData } from '../../../../types/travelBooking';
import type { IEmailParser } from './ParserInterface';

/**
 * Registry for managing and selecting email parsers
 */
export class ParserRegistry {
  private parsers: Map<string, IEmailParser> = new Map();
  private parsersByPriority: IEmailParser[] = [];
  
  /**
   * Register a new parser
   */
  register(parser: IEmailParser): void {
    if (this.parsers.has(parser.provider)) {
      console.warn(`Parser ${parser.provider} is already registered, replacing...`);
    }
    
    this.parsers.set(parser.provider, parser);
    this.updatePriorityList();
    
    console.log(`✅ Registered parser: ${parser.displayName} (priority: ${parser.priority})`);
  }
  
  /**
   * Unregister a parser
   */
  unregister(provider: string): void {
    if (this.parsers.delete(provider)) {
      this.updatePriorityList();
      console.log(`🗑️ Unregistered parser: ${provider}`);
    }
  }
  
  /**
   * Get a specific parser by provider name
   */
  getParser(provider: string): IEmailParser | undefined {
    return this.parsers.get(provider);
  }
  
  /**
   * Get all registered parsers
   */
  getAllParsers(): IEmailParser[] {
    return Array.from(this.parsers.values());
  }
  
  /**
   * Find the best parser for an email
   */
  findBestParser(email: EmailMessage): IEmailParser | null {
    // Try parsers in priority order
    for (const parser of this.parsersByPriority) {
      try {
        if (parser.canParse(email)) {
          console.log(`🎯 Selected parser: ${parser.displayName} for email from ${email.from}`);
          return parser;
        }
      } catch (error) {
        console.error(`Error checking parser ${parser.provider}:`, error);
      }
    }
    
    return null;
  }
  
  /**
   * Parse an email using the best available parser
   */
  async parseEmail(email: EmailMessage, fallbackParser?: IEmailParser): Promise<ParsedEmailData | null> {
    
    // Try to find a specific parser
    const parser = this.findBestParser(email);
    
    if (parser) {
      try {
        const result = await parser.parse(email);
        console.log(`✅ Parsed with ${parser.displayName} (confidence: ${result.confidence.toFixed(2)})`);
        return result;
      } catch (error) {
        console.error(`❌ Parser ${parser.provider} failed:`, error);
      }
    }
    
    // Try fallback parser if provided
    if (fallbackParser) {
      try {
        console.log(`🔄 Trying fallback parser: ${fallbackParser.displayName}`);
        const result = await fallbackParser.parse(email);
        console.log(`✅ Parsed with fallback (confidence: ${result.confidence.toFixed(2)})`);
        return result;
      } catch (error) {
        console.error(`❌ Fallback parser failed:`, error);
      }
    }
    
    console.warn(`⚠️ No parser found for email from ${email.from}`);
    return null;
  }
  
  /**
   * Parse multiple emails in batch
   */
  async parseBatch(
    emails: EmailMessage[], 
    options?: {
      concurrency?: number;
      fallbackParser?: IEmailParser;
      onProgress?: (processed: number, total: number) => void;
    }
  ): Promise<(ParsedEmailData | null)[]> {
    const concurrency = options?.concurrency || 5;
    const results: (ParsedEmailData | null)[] = [];
    
    // Process in chunks for concurrency control
    for (let i = 0; i < emails.length; i += concurrency) {
      const chunk = emails.slice(i, i + concurrency);
      const chunkResults = await Promise.all(
        chunk.map(email => this.parseEmail(email, options?.fallbackParser))
      );
      
      results.push(...chunkResults);
      
      if (options?.onProgress) {
        options.onProgress(results.length, emails.length);
      }
    }
    
    return results;
  }
  
  /**
   * Get parsing statistics
   */
  getStatistics(results: (ParsedEmailData | null)[]): {
    total: number;
    successful: number;
    failed: number;
    byParser: Record<string, number>;
    avgConfidence: number;
    avgParsingTime: number;
  } {
    const stats = {
      total: results.length,
      successful: 0,
      failed: 0,
      byParser: {} as Record<string, number>,
      avgConfidence: 0,
      avgParsingTime: 0
    };
    
    let totalConfidence = 0;
    let totalTime = 0;
    
    for (const result of results) {
      if (result) {
        stats.successful++;
        stats.byParser[result.parser_used] = (stats.byParser[result.parser_used] || 0) + 1;
        totalConfidence += result.confidence;
        totalTime += result.parsing_time_ms;
      } else {
        stats.failed++;
      }
    }
    
    if (stats.successful > 0) {
      stats.avgConfidence = totalConfidence / stats.successful;
      stats.avgParsingTime = totalTime / stats.successful;
    }
    
    return stats;
  }
  
  /**
   * Update the priority-sorted list of parsers
   */
  private updatePriorityList(): void {
    this.parsersByPriority = Array.from(this.parsers.values())
      .sort((a, b) => b.priority - a.priority);
  }
}

// Create and export singleton instance
export const parserRegistry = new ParserRegistry();