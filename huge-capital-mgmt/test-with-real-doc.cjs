const fs = require('fs');
const path = require('path');

const SUPABASE_URL = 'https://oymwsfyspdvbazklqkpm.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im95bXdzZnlzcGR2YmF6a2xxa3BtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkzMDIyMzUsImV4cCI6MjA3NDg3ODIzNX0.EZUSSmzDwZkqhOvdjcDp6KoZd_Au3i5xRm5t7QlosmU';

async function testWithRealDocument() {
  console.log('Testing parse-deal-documents with REAL document...\n');

  try {
    // Read the real application document
    const docPath = path.join(__dirname, 'Deals Page', 'New Submission Documents', 'Bank Statement Breakdown', 'Cinematic Productions', 'Application.png');
    const fileBuffer = fs.readFileSync(docPath);
    const base64Content = fileBuffer.toString('base64');

    console.log('Document loaded:', docPath);
    console.log('Document size:', Math.round(base64Content.length / 1024), 'KB (base64)\n');

    const response = await fetch(`${SUPABASE_URL}/functions/v1/parse-deal-documents`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      },
      body: JSON.stringify({
        files: [
          {
            name: 'Application.png',
            content: base64Content,
            type: 'image/png'
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
      console.log('  EIN:', data.deal.ein);
      console.log('  Address:', data.deal.address);
      console.log('  City:', data.deal.city);
      console.log('  State:', data.deal.state);
      console.log('  Loan Type:', data.deal.loan_type);
      console.log('  Desired Amount:', data.deal.desired_loan_amount);

      // Check if it's real data from the document
      if (data.deal.legal_business_name?.includes('Southstar') ||
          data.deal.legal_business_name?.includes('FA Southstar') ||
          data.deal.ein === '883641241') {
        console.log('\n✅ SUCCESS! Real data extracted from document!');
      } else if (data.deal.legal_business_name?.includes('Acme')) {
        console.log('\n⚠️  WARNING: Got dummy data instead of real extraction');
      } else if (data.deal.legal_business_name?.includes('Error')) {
        console.log('\n❌ ERROR: Failed to extract data');
      }
    }

    // Check owners
    if (data.owners?.length > 0) {
      console.log('\n👤 Owners found:', data.owners.length);
      data.owners.forEach((owner, i) => {
        console.log(`  Owner ${i + 1}: ${owner.full_name}`);
        if (owner.full_name?.includes('Mihutz Mezanets')) {
          console.log('    ✅ Real owner name extracted!');
        }
      });
    }

    // Check warnings
    if (data.warnings?.length > 0) {
      console.log('\n⚠️ Warnings:', data.warnings);
    }

  } catch (error) {
    console.error('Error:', error.message);
  }
}

testWithRealDocument();