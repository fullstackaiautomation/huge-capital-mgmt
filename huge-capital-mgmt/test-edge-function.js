const SUPABASE_URL = 'https://oymwsfyspdvbazklqkpm.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im95bXdzZnlzcGR2YmF6a2xxa3BtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkzMDIyMzUsImV4cCI6MjA3NDg3ODIzNX0.EZUSSmzDwZkqhOvdjcDp6KoZd_Au3i5xRm5t7QlosmU';

async function testEdgeFunction() {
  console.log('Testing parse-deal-documents edge function...\n');

  try {
    const response = await fetch(`${SUPABASE_URL}/functions/v1/parse-deal-documents`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      },
      body: JSON.stringify({
        files: [
          {
            name: 'test.txt',
            content: 'VGVzdCBjb250ZW50', // "Test content" in base64
            type: 'text/plain'
          }
        ]
      })
    });

    console.log('Response status:', response.status);
    const data = await response.json();
    console.log('\nResponse data:');
    console.log(JSON.stringify(data, null, 2));

    // Check what we got back
    if (data.deal) {
      console.log('\n✅ Got deal data:');
      console.log('  Business Name:', data.deal.legal_business_name);
      console.log('  Loan Type:', data.deal.loan_type);

      if (data.deal.legal_business_name === 'ERROR: Could not extract data') {
        console.log('\n❌ API key not configured or extraction failed');
      } else if (data.deal.legal_business_name?.includes('Acme') ||
                 data.deal.legal_business_name?.includes('test') ||
                 data.owners?.[0]?.full_name?.includes('Doe')) {
        console.log('\n⚠️  WARNING: This looks like dummy/test data!');
        console.log('   The edge function is returning mock data instead of calling Claude');
      }
    }

    // Check warnings
    if (data.warnings?.length > 0) {
      console.log('\nWarnings:', data.warnings);
    }

  } catch (error) {
    console.error('Error:', error.message);
  }
}

testEdgeFunction();