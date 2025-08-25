import { parserRegistry } from '../base/ParserRegistry';
import { AirbnbParser } from '../providers/airbnbParser';
import { BookingParser } from '../providers/bookingParser';
import { AirlineParser } from '../providers/airlineParser';
import { AIFallbackParser } from '../aiParser';
import { generateTestDataset, expectedResults } from './mockEmails';
import type { ParsedEmailData } from '../../../../types/travelBooking';

// Register all parsers
const airbnbParser = new AirbnbParser();
const bookingParser = new BookingParser();
const airlineParser = new AirlineParser();
const aiFallbackParser = new AIFallbackParser();

parserRegistry.register(airbnbParser);
parserRegistry.register(bookingParser);
parserRegistry.register(airlineParser);

// Test configuration
const TARGET_ACCURACY = {
  specific: 0.95, // 95% for specific parsers
  ai: 0.70,       // 70% for AI fallback
  overall: 0.85   // 85% overall
};

/**
 * Run accuracy tests for all parsers
 */
export async function runAccuracyTests() {
  console.log('🧪 Starting Parser Accuracy Tests...\n');
  
  const testEmails = generateTestDataset();
  const results: Record<string, any> = {
    total: testEmails.length,
    processed: 0,
    successful: 0,
    failed: 0,
    byParser: {},
    accuracy: {},
    timings: []
  };
  
  // Test each email
  for (const email of testEmails) {
    console.log(`Testing: ${email.subject}`);
    
    const startTime = Date.now();
    const result = await parserRegistry.parseEmail(email, aiFallbackParser);
    const endTime = Date.now();
    
    results.processed++;
    
    if (result) {
      results.successful++;
      
      // Track by parser
      const parser = result.parser_used;
      results.byParser[parser] = (results.byParser[parser] || 0) + 1;
      
      // Validate against expected results if available
      if (expectedResults[email.id as keyof typeof expectedResults]) {
        const accuracy = validateResult(result, expectedResults[email.id as keyof typeof expectedResults]);
        results.accuracy[email.id] = accuracy;
      }
      
      // Track timing
      results.timings.push(endTime - startTime);
      
      console.log(`✅ Parsed by ${parser} (confidence: ${result.confidence.toFixed(2)}, time: ${endTime - startTime}ms)`);
    } else {
      results.failed++;
      console.log('❌ Failed to parse');
    }
    
    console.log('');
  }
  
  // Calculate statistics
  printResults(results);
  
  return results;
}

/**
 * Validate parsed result against expected data
 */
function validateResult(actual: ParsedEmailData, expected: any): number {
  let matches = 0;
  let total = 0;
  
  const fieldsToCheck = [
    'provider', 'booking_type', 'title', 'location_name',
    'start_date', 'end_date', 'confirmation_number', 'total_price'
  ];
  
  for (const field of fieldsToCheck) {
    total++;
    if (actual.booking[field as keyof typeof actual.booking] === expected[field]) {
      matches++;
    } else if (field === 'title' || field === 'location_name') {
      // Allow fuzzy matching for text fields
      const actualValue = String(actual.booking[field as keyof typeof actual.booking] || '').toLowerCase();
      const expectedValue = String(expected[field] || '').toLowerCase();
      if (actualValue.includes(expectedValue) || expectedValue.includes(actualValue)) {
        matches += 0.5;
      }
    }
  }
  
  return matches / total;
}

/**
 * Print test results
 */
function printResults(results: Record<string, any>) {
  console.log('\n' + '='.repeat(60));
  console.log('📊 PARSER ACCURACY TEST RESULTS');
  console.log('='.repeat(60));
  
  console.log('\n📈 Overall Statistics:');
  console.log(`   Total Emails: ${results.total}`);
  console.log(`   Successfully Parsed: ${results.successful} (${((results.successful / results.total) * 100).toFixed(1)}%)`);
  console.log(`   Failed: ${results.failed} (${((results.failed / results.total) * 100).toFixed(1)}%)`);
  
  console.log('\n🎯 Parser Breakdown:');
  for (const [parser, count] of Object.entries(results.byParser)) {
    const percentage = ((count as number / results.successful) * 100).toFixed(1);
    console.log(`   ${parser}: ${count} emails (${percentage}%)`);
  }
  
  console.log('\n⏱️ Performance Metrics:');
  if (results.timings.length > 0) {
    const avgTime = results.timings.reduce((a: number, b: number) => a + b, 0) / results.timings.length;
    const maxTime = Math.max(...results.timings);
    const minTime = Math.min(...results.timings);
    
    console.log(`   Average parsing time: ${avgTime.toFixed(0)}ms`);
    console.log(`   Min time: ${minTime}ms`);
    console.log(`   Max time: ${maxTime}ms`);
  }
  
  console.log('\n✅ Accuracy Validation:');
  const accuracyScores = Object.values(results.accuracy) as number[];
  if (accuracyScores.length > 0) {
    const avgAccuracy = accuracyScores.reduce((a, b) => a + b, 0) / accuracyScores.length;
    console.log(`   Average field accuracy: ${(avgAccuracy * 100).toFixed(1)}%`);
    
    // Check against targets
    const overallSuccess = (results.successful / results.total);
    console.log('\n🎯 Target Achievement:');
    console.log(`   Overall Success Rate: ${(overallSuccess * 100).toFixed(1)}% (target: ${TARGET_ACCURACY.overall * 100}%)`);
    
    if (overallSuccess >= TARGET_ACCURACY.overall) {
      console.log('   ✅ PASSED: Overall accuracy target met!');
    } else {
      console.log('   ❌ FAILED: Below overall accuracy target');
    }
  }
  
  console.log('\n' + '='.repeat(60));
}

/**
 * Run specific parser tests
 */
export async function testSpecificParser(parserName: string) {
  const parser = parserRegistry.getParser(parserName);
  if (!parser) {
    console.error(`Parser ${parserName} not found`);
    return;
  }
  
  console.log(`\n🧪 Testing ${parser.displayName}...\n`);
  
  const testEmails = generateTestDataset();
  const relevantEmails = testEmails.filter(email => parser.canParse(email));
  
  console.log(`Found ${relevantEmails.length} emails that ${parser.displayName} can parse\n`);
  
  let successful = 0;
  const timings: number[] = [];
  
  for (const email of relevantEmails) {
    const startTime = Date.now();
    
    try {
      const result = await parser.parse(email);
      const endTime = Date.now();
      
      timings.push(endTime - startTime);
      successful++;
      
      console.log(`✅ ${email.subject}`);
      console.log(`   Provider: ${result.booking.provider}`);
      console.log(`   Type: ${result.booking.booking_type}`);
      console.log(`   Confidence: ${result.confidence.toFixed(2)}`);
      console.log(`   Time: ${endTime - startTime}ms`);
    } catch (error) {
      console.log(`❌ ${email.subject}`);
      console.log(`   Error: ${error}`);
    }
    
    console.log('');
  }
  
  // Print summary
  console.log('='.repeat(40));
  console.log(`Success Rate: ${successful}/${relevantEmails.length} (${(successful / relevantEmails.length * 100).toFixed(1)}%)`);
  
  if (timings.length > 0) {
    const avgTime = timings.reduce((a, b) => a + b, 0) / timings.length;
    console.log(`Average Time: ${avgTime.toFixed(0)}ms`);
  }
}

// Export for use in test runner
export { parserRegistry };