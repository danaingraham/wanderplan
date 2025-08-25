import type { EmailMessage } from '../../../../types/travelBooking';

// Sample email templates for testing parsers
export const mockEmails = {
  airbnb: {
    confirmation: (): EmailMessage => ({
      id: 'msg_airbnb_001',
      subject: 'Reservation confirmed - Modern Apartment in Austin',
      from: 'no-reply@airbnb.com',
      to: 'user@example.com',
      date: '2024-01-15T10:30:00Z',
      body_text: `
        Your reservation is confirmed
        
        Check-in: March 15, 2024
        Check-out: March 18, 2024
        
        Modern Apartment in Downtown Austin
        123 Main Street, Austin, TX 78701
        
        Confirmation code: HMXK-ABCD-2024
        
        Total: $450.00 USD
        ($150.00 x 3 nights)
        
        Host: Sarah Johnson
        
        Check-in time: After 3:00 PM
        Check-out time: 11:00 AM
        
        Guests: 2 adults
      `,
      body_html: `
        <div>
          <h1>Your reservation is confirmed</h1>
          <div class="reservation-details">
            <p><strong>Check-in:</strong> March 15, 2024</p>
            <p><strong>Check-out:</strong> March 18, 2024</p>
            <h2>Modern Apartment in Downtown Austin</h2>
            <p>123 Main Street, Austin, TX 78701</p>
            <p><strong>Confirmation code:</strong> HMXK-ABCD-2024</p>
            <div class="pricing">
              <p><strong>Total:</strong> $450.00 USD</p>
              <p>($150.00 x 3 nights)</p>
            </div>
            <p><strong>Host:</strong> Sarah Johnson</p>
            <p><strong>Check-in time:</strong> After 3:00 PM</p>
            <p><strong>Check-out time:</strong> 11:00 AM</p>
            <p><strong>Guests:</strong> 2 adults</p>
          </div>
        </div>
      `
    }),
    
    cancellation: (): EmailMessage => ({
      id: 'msg_airbnb_002',
      subject: 'Reservation cancelled - Beach House in Malibu',
      from: 'no-reply@airbnb.com',
      to: 'user@example.com',
      date: '2024-01-20T14:00:00Z',
      body_text: `
        Your reservation has been cancelled
        
        Beach House in Malibu
        Cancelled reservation for Apr 10-13, 2024
        
        Confirmation code: CANCEL-XYZ-2024
        
        Refund amount: $600.00 USD
      `
    })
  },
  
  booking: {
    confirmation: (): EmailMessage => ({
      id: 'msg_booking_001',
      subject: 'Booking Confirmation - Hilton Garden Inn New York',
      from: 'customer.service@booking.com',
      to: 'user@example.com',
      date: '2024-02-01T09:15:00Z',
      body_text: `
        Booking Confirmation
        
        Confirmation number: 123.456.789
        PIN code: 1234
        
        Hilton Garden Inn New York/Manhattan-Chelsea
        121 West 28th Street, New York, NY 10001
        
        Check-in: Friday, April 5, 2024 (from 15:00)
        Check-out: Sunday, April 7, 2024 (until 12:00)
        
        2 nights, 1 room
        Guest: John Doe
        
        Total price: USD 540.00
        Includes taxes and charges
        
        Room type: King Room - Non-Smoking
      `,
      body_html: `
        <div class="booking-confirmation">
          <h2>Booking Confirmation</h2>
          <p><strong>Confirmation number:</strong> 123.456.789</p>
          <p><strong>PIN code:</strong> 1234</p>
          <h3>Hilton Garden Inn New York/Manhattan-Chelsea</h3>
          <p>121 West 28th Street, New York, NY 10001</p>
          <table>
            <tr><td>Check-in:</td><td>Friday, April 5, 2024 (from 15:00)</td></tr>
            <tr><td>Check-out:</td><td>Sunday, April 7, 2024 (until 12:00)</td></tr>
            <tr><td>Nights:</td><td>2</td></tr>
            <tr><td>Rooms:</td><td>1</td></tr>
            <tr><td>Guest:</td><td>John Doe</td></tr>
            <tr><td>Total price:</td><td>USD 540.00</td></tr>
            <tr><td>Room type:</td><td>King Room - Non-Smoking</td></tr>
          </table>
        </div>
      `
    })
  },
  
  united: {
    confirmation: (): EmailMessage => ({
      id: 'msg_united_001',
      subject: 'Your United flight confirmation - SFO to JFK',
      from: 'unitedairlines@united.com',
      to: 'user@example.com',
      date: '2024-01-25T16:45:00Z',
      body_text: `
        Flight Confirmation
        
        Confirmation Code: ABC123
        
        FLIGHT DETAILS
        
        Departure: May 10, 2024
        UA 256
        San Francisco (SFO) to New York (JFK)
        Depart: 8:00 AM
        Arrive: 4:30 PM
        Seat: 12A
        Economy
        
        Return: May 15, 2024
        UA 789
        New York (JFK) to San Francisco (SFO)
        Depart: 6:00 PM
        Arrive: 9:30 PM
        Seat: 15B
        Economy
        
        Passenger: Jane Smith
        
        Total fare: $450.00
      `,
      body_html: `
        <div>
          <h1>Flight Confirmation</h1>
          <p><strong>Confirmation Code:</strong> ABC123</p>
          <h2>FLIGHT DETAILS</h2>
          <div class="flight-segment">
            <h3>Departure: May 10, 2024</h3>
            <p><strong>Flight:</strong> UA 256</p>
            <p>San Francisco (SFO) → New York (JFK)</p>
            <p><strong>Depart:</strong> 8:00 AM | <strong>Arrive:</strong> 4:30 PM</p>
            <p><strong>Seat:</strong> 12A | <strong>Class:</strong> Economy</p>
          </div>
          <div class="flight-segment">
            <h3>Return: May 15, 2024</h3>
            <p><strong>Flight:</strong> UA 789</p>
            <p>New York (JFK) → San Francisco (SFO)</p>
            <p><strong>Depart:</strong> 6:00 PM | <strong>Arrive:</strong> 9:30 PM</p>
            <p><strong>Seat:</strong> 15B | <strong>Class:</strong> Economy</p>
          </div>
          <p><strong>Passenger:</strong> Jane Smith</p>
          <p><strong>Total fare:</strong> $450.00</p>
        </div>
      `
    })
  },
  
  delta: {
    confirmation: (): EmailMessage => ({
      id: 'msg_delta_001',
      subject: 'Delta Air Lines - Ticket Receipt & eTicket Confirmation',
      from: 'deltaairlines@delta.com',
      to: 'user@example.com',
      date: '2024-02-05T11:20:00Z',
      body_text: `
        Confirmation Number: DEF456
        Ticket Number: 006-1234567890
        
        ITINERARY
        
        June 1, 2024
        DL 123
        Los Angeles (LAX) - Boston (BOS)
        Departure: 10:15 AM
        Arrival: 6:45 PM
        Seat: 24C
        Main Cabin
        
        Passenger: Robert Johnson
        
        Total: $325.00 USD
      `
    })
  },
  
  opentable: {
    confirmation: (): EmailMessage => ({
      id: 'msg_opentable_001',
      subject: 'Your reservation at The French Laundry is confirmed',
      from: 'reservations@opentable.com',
      to: 'user@example.com',
      date: '2024-01-30T19:00:00Z',
      body_text: `
        Reservation Confirmed
        
        The French Laundry
        6640 Washington St, Yountville, CA 94599
        
        Date: Saturday, March 30, 2024
        Time: 7:00 PM
        Party size: 2 people
        
        Confirmation #: OT-789456
        
        Special requests: Anniversary dinner
      `,
      body_html: `
        <div class="reservation">
          <h1>Reservation Confirmed</h1>
          <h2>The French Laundry</h2>
          <p>6640 Washington St, Yountville, CA 94599</p>
          <div class="details">
            <p><strong>Date:</strong> Saturday, March 30, 2024</p>
            <p><strong>Time:</strong> 7:00 PM</p>
            <p><strong>Party size:</strong> 2 people</p>
            <p><strong>Confirmation #:</strong> OT-789456</p>
            <p><strong>Special requests:</strong> Anniversary dinner</p>
          </div>
        </div>
      `
    })
  },
  
  expedia: {
    confirmation: (): EmailMessage => ({
      id: 'msg_expedia_001',
      subject: 'Trip to Las Vegas - Itinerary Confirmation',
      from: 'support@expedia.com',
      to: 'user@example.com',
      date: '2024-02-10T08:30:00Z',
      body_text: `
        Itinerary Number: 72584963214
        
        LAS VEGAS TRIP
        July 15-18, 2024
        
        HOTEL:
        Bellagio Las Vegas
        3600 S Las Vegas Blvd, Las Vegas, NV 89109
        Check-in: July 15, 2024
        Check-out: July 18, 2024
        Confirmation: EXP-HOTEL-123
        Total: $750.00
        
        FLIGHT:
        Southwest Airlines
        July 15: Phoenix (PHX) to Las Vegas (LAS)
        Flight: WN 456, Depart: 2:00 PM, Arrive: 2:45 PM
        
        July 18: Las Vegas (LAS) to Phoenix (PHX)
        Flight: WN 789, Depart: 5:00 PM, Arrive: 6:30 PM
        
        Total Package: $950.00
      `
    })
  },
  
  marriott: {
    confirmation: (): EmailMessage => ({
      id: 'msg_marriott_001',
      subject: 'Reservation Confirmation - JW Marriott Los Angeles',
      from: 'marriott@marriott.com',
      to: 'user@example.com',
      date: '2024-02-15T13:00:00Z',
      body_text: `
        Confirmation Number: 85274136
        
        JW Marriott Los Angeles L.A. LIVE
        900 West Olympic Boulevard, Los Angeles, CA 90015
        
        Arrival: August 20, 2024
        Departure: August 23, 2024
        
        Room Type: Deluxe King
        Guests: 2 Adults
        
        Rate: $299.00 USD per night
        Total Stay: $897.00 USD (includes taxes)
      `
    })
  }
};

// Helper function to generate variations for testing
export function generateEmailVariations(
  baseEmail: EmailMessage, 
  variations: Partial<EmailMessage>[]
): EmailMessage[] {
  return variations.map(variation => ({
    ...baseEmail,
    ...variation,
    id: `${baseEmail.id}_var_${Math.random().toString(36).substr(2, 9)}`
  }));
}

// Generate test dataset with variations
export function generateTestDataset(): EmailMessage[] {
  const dataset: EmailMessage[] = [];
  
  // Airbnb variations
  const airbnbBase = mockEmails.airbnb.confirmation();
  dataset.push(airbnbBase);
  dataset.push(...generateEmailVariations(airbnbBase, [
    { subject: 'Booking confirmed - Cozy Studio in Brooklyn' },
    { subject: 'Réservation confirmée - Appartement Paris' },
    { body_text: airbnbBase.body_text?.replace('March 15, 2024', 'December 25, 2024') }
  ]));
  
  // Booking.com variations
  const bookingBase = mockEmails.booking.confirmation();
  dataset.push(bookingBase);
  dataset.push(...generateEmailVariations(bookingBase, [
    { subject: 'Confirmation - Four Seasons Hotel Tokyo' },
    { subject: 'Buchungsbestätigung - Hotel Berlin' }
  ]));
  
  // Flight variations
  dataset.push(mockEmails.united.confirmation());
  dataset.push(mockEmails.delta.confirmation());
  
  // Restaurant variations
  dataset.push(mockEmails.opentable.confirmation());
  
  // Package deal
  dataset.push(mockEmails.expedia.confirmation());
  
  // Hotel chains
  dataset.push(mockEmails.marriott.confirmation());
  
  return dataset;
}

// Export test expectations for validation
export const expectedResults = {
  'msg_airbnb_001': {
    provider: 'airbnb',
    booking_type: 'accommodation',
    title: 'Modern Apartment in Downtown Austin',
    location_name: 'Austin, TX',
    start_date: '2024-03-15',
    end_date: '2024-03-18',
    total_price: 450.00,
    confirmation_number: 'HMXK-ABCD-2024'
  },
  'msg_booking_001': {
    provider: 'booking.com',
    booking_type: 'accommodation',
    title: 'Hilton Garden Inn New York/Manhattan-Chelsea',
    location_name: 'New York, NY',
    start_date: '2024-04-05',
    end_date: '2024-04-07',
    total_price: 540.00,
    confirmation_number: '123.456.789'
  },
  'msg_united_001': {
    provider: 'united',
    booking_type: 'flight',
    title: 'UA 256',
    location_name: 'SFO to JFK',
    start_date: '2024-05-10',
    start_time: '08:00',
    total_price: 450.00,
    confirmation_number: 'ABC123'
  },
  'msg_opentable_001': {
    provider: 'opentable',
    booking_type: 'restaurant',
    title: 'The French Laundry',
    location_name: 'Yountville, CA',
    start_date: '2024-03-30',
    start_time: '19:00',
    confirmation_number: 'OT-789456'
  }
};