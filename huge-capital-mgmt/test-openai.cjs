const SUPABASE_URL = 'https://oymwsfyspdvbazklqkpm.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im95bXdzZnlzcGR2YmF6a2xxa3BtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkzMDIyMzUsImV4cCI6MjA3NDg3ODIzNX0.EZUSSmzDwZkqhOvdjcDp6KoZd_Au3i5xRm5t7QlosmU';

async function testOpenAI() {
  console.log('Testing parse-deal-documents with OpenAI...\n');

  try {
    // Test with simple text content
    const testContent = `
Small Business Funding Application

Business Information:
Legal Business Name: Test Business LLC
EIN: 12-3456789
Address: 123 Main St
City: New York
State: NY
ZIP: 10001

Owner Information:
Name: John Smith
Email: john@example.com
Phone: (555) 123-4567

Financial Information:
Desired Loan Amount: $75,000
Average Monthly Sales: $35,000
Loan Type: MCA
    `;

    const response = await fetch(`${SUPABASE_URL}/functions/v1/parse-deal-documents`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      },
      body: JSON.stringify({
        files: [
          {
            name: 'application.txt',
            content: Buffer.from(testContent).toString('base64'),
            type: 'text/plain'
          }
        ]
      })
    });

    console.log('Response status:', response.status);

    const data = await response.json();
    console.log('\nResponse data:');
    console.log(JSON.stringify(data, null, 2));

    // Analyze the response
    if (data.deal) {
      console.log('\n📋 Analysis:');
      console.log('  Business Name:', data.deal.legal_business_name);
      console.log('  EIN:', data.deal.ein);
      console.log('  Loan Amount:', data.deal.desired_loan_amount);

      // Check what type of response we got
      if (data.deal.legal_business_name === 'Test Business LLC') {
        console.log('\n✅ SUCCESS: OpenAI extracted the correct data!');
        console.log('The edge function is now using OpenAI API successfully.');
      } else if (data.deal.legal_business_name?.includes('ERROR')) {
        console.log('\n❌ ERROR: Edge function returned error');
        console.log('Check if OpenAI API key is properly set');
      } else {
        console.log('\n📊 Data extracted:', data.deal.legal_business_name);
      }
    }

    // Check warnings
    if (data.warnings?.length > 0) {
      console.log('\n⚠️  Warnings:', data.warnings);
    }

  } catch (error) {
    console.error('Error:', error.message);
  }
}

testOpenAI();