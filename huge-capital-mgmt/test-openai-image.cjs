const fs = require('fs');
const path = require('path');

const SUPABASE_URL = 'https://oymwsfyspdvbazklqkpm.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im95bXdzZnlzcGR2YmF6a2xxa3BtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkzMDIyMzUsImV4cCI6MjA3NDg3ODIzNX0.EZUSSmzDwZkqhOvdjcDp6KoZd_Au3i5xRm5t7QlosmU';

async function testOpenAIWithImage() {
  console.log('Testing parse-deal-documents with OpenAI (image)...\n');

  try {
    // Check if we have the Application.png file
    const imagePath = path.join(__dirname, 'Deals Page/New Submission Documents/Bank Statement Breakdown/Cinematic Productions/Application.png');

    if (fs.existsSync(imagePath)) {
      console.log('✅ Found Application.png, testing with real image...\n');

      // Read the image file
      const imageBuffer = fs.readFileSync(imagePath);
      const imageBase64 = imageBuffer.toString('base64');

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
              content: imageBase64,
              type: 'image/png'
            }
          ]
        })
      });

      console.log('Response status:', response.status);

      const data = await response.json();
      console.log('\nExtracted Data:');

      if (data.deal) {
        console.log('  Business Name:', data.deal.legal_business_name);
        console.log('  DBA:', data.deal.dba_name);
        console.log('  EIN:', data.deal.ein);
        console.log('  Address:', data.deal.address);
        console.log('  City:', data.deal.city);
        console.log('  State:', data.deal.state);
        console.log('  Loan Amount:', data.deal.desired_loan_amount);
        console.log('  Loan Type:', data.deal.loan_type);
      }

      if (data.owners && data.owners.length > 0) {
        console.log('\n  Owners:');
        data.owners.forEach(owner => {
          console.log(`    - ${owner.full_name} (${owner.email || 'no email'})`);
        });
      }

      if (data.confidence) {
        console.log('\n  Confidence Scores:');
        console.log('    Deal:', data.confidence.deal + '%');
        if (data.confidence.owners && data.confidence.owners.length > 0) {
          console.log('    Owners:', data.confidence.owners[0] + '%');
        }
      }

      // Check if real data was extracted
      if (data.deal && data.deal.legal_business_name && !data.deal.legal_business_name.includes('ERROR')) {
        console.log('\n✅ SUCCESS: OpenAI extracted data from the image!');
      } else {
        console.log('\n❌ ERROR: Failed to extract data from image');
      }

    } else {
      console.log('⚠️  Application.png not found, testing with simulated image data...\n');

      // Create a simple test "image" with text
      const testContent = Buffer.from(`
        Small Business Funding Application
        Legal Business Name: Image Test LLC
        EIN: 98-7654321
        Desired Loan Amount: $50,000
        Owner: Jane Doe
      `).toString('base64');

      const response = await fetch(`${SUPABASE_URL}/functions/v1/parse-deal-documents`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({
          files: [
            {
              name: 'test-image.txt',
              content: testContent,
              type: 'text/plain'
            }
          ]
        })
      });

      const data = await response.json();
      console.log('Response:', JSON.stringify(data, null, 2));
    }

  } catch (error) {
    console.error('Error:', error.message);
  }
}

testOpenAIWithImage();