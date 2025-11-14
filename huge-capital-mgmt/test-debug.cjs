const SUPABASE_URL = 'https://oymwsfyspdvbazklqkpm.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im95bXdzZnlzcGR2YmF6a2xxa3BtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkzMDIyMzUsImV4cCI6MjA3NDg3ODIzNX0.EZUSSmzDwZkqhOvdjcDp6KoZd_Au3i5xRm5t7QlosmU';

async function testDebug() {
  console.log('Testing parse-deal-documents to understand response behavior...\n');

  try {
    // Test with simple text content
    const testContent = `
Small Business Funding Application

Business Information:
Legal Business Name: FA Southstar LLC
DBA: Southstar
EIN: 88-3641241
Address: 2951 East Southstar Fort Suite 100
City: Scottdale
State: TX
ZIP: 78002

Owner Information:
Name: Mihutz Mezanets
Email: alex.lantsmanouskyi@gmail.com
Phone: (862) 401-9868

Financial Information:
Desired Loan Amount: $100,000
Average Monthly Sales: $50,000
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
    console.log('Response headers:', Object.fromEntries(response.headers));

    const data = await response.json();
    console.log('\nResponse data:');
    console.log(JSON.stringify(data, null, 2));

    // Analyze the response
    if (data.deal) {
      console.log('\n📋 Analysis:');
      console.log('  Business Name:', data.deal.legal_business_name);

      // Check what type of response we got
      if (data.deal.legal_business_name === 'FA Southstar LLC') {
        console.log('  ✅ SUCCESS: Real data extracted from document!');
      } else if (data.deal.legal_business_name === 'ABC Corp') {
        console.log('  🔄 MOCK DATA: Edge function returned hardcoded test data');
        console.log('  This means: Claude API was NOT called or failed');
      } else if (data.deal.legal_business_name === 'Acme Inc.') {
        console.log('  🔄 DIFFERENT MOCK DATA: "Acme Inc." appearing somewhere');
      } else if (data.deal.legal_business_name?.includes('ERROR')) {
        console.log('  ❌ ERROR: Edge function explicitly returned error');
      } else if (data.deal.legal_business_name?.includes('[Error:')) {
        console.log('  ❌ ERROR: Exception caught in edge function');
      } else {
        console.log('  ❓ UNKNOWN: Unexpected response');
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

testDebug();