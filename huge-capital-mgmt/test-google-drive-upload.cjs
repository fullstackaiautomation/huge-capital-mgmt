const fs = require('fs');
const path = require('path');

// Test the complete pipeline: parse documents and upload to Google Drive
async function testGoogleDriveUpload() {
  console.log('🧪 Testing Google Drive Upload Integration...\n');

  const SUPABASE_URL = 'https://oymwsfyspdvbazklqkpm.supabase.co';
  const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im95bXdzZnlzcGR2YmF6a2xxa3BtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkzMDIyMzUsImV4cCI6MjA3NDg3ODIzNX0.EZUSSmzDwZkqhOvdjcDp6KoZd_Au3i5xRm5t7QlosmU';

  // Create a simple test document (text file)
  const testDocumentContent = `
BUSINESS LOAN APPLICATION

Legal Business Name: Test Coffee Shop LLC
DBA Name: Morning Brew Cafe
EIN: 12-3456789
Business Type: LLC

Address: 123 Main Street
City: Austin
State: TX
Zip: 78701

Phone: (512) 555-1234
Website: www.morningbrewcafe.com

Owner Information:
Full Name: John Smith
Email: john@morningbrewcafe.com
Phone: (512) 555-1234
Ownership: 100%
Date of Birth: 01/15/1985

Loan Information:
Desired Loan Amount: $50,000
Loan Type: Business LOC
Reason: Equipment purchase and working capital

Average Monthly Sales: $25,000
Average Monthly Card Sales: $20,000
Business Start Date: 01/01/2020
`.trim();

  // Convert to base64
  const base64Content = Buffer.from(testDocumentContent).toString('base64');

  console.log('📄 Test Document Created');
  console.log('   Business: Test Coffee Shop LLC');
  console.log('   Owner: John Smith');
  console.log('   Loan Amount: $50,000\n');

  // Call the edge function
  console.log('🚀 Calling parse-deal-documents edge function...');

  try {
    const response = await fetch(
      `${SUPABASE_URL}/functions/v1/parse-deal-documents`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({
          files: [
            {
              name: 'Test_Application.txt',
              type: 'text/plain',
              content: base64Content,
            },
          ],
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Edge function error:', response.status, errorText);
      return;
    }

    const result = await response.json();

    console.log('\n✅ Document Parsed Successfully!\n');

    // Display extracted deal information
    console.log('📋 Extracted Deal Information:');
    console.log('   Business Name:', result.deal?.legal_business_name || 'Not found');
    console.log('   DBA:', result.deal?.dba_name || 'Not found');
    console.log('   EIN:', result.deal?.ein || 'Not found');
    console.log('   Address:', `${result.deal?.address || ''}, ${result.deal?.city || ''}, ${result.deal?.state || ''} ${result.deal?.zip || ''}`);
    console.log('   Loan Amount:', result.deal?.desired_loan_amount ? `$${result.deal.desired_loan_amount.toLocaleString()}` : 'Not found');
    console.log('   Loan Type:', result.deal?.loan_type || 'Not found');

    // Display owner information
    if (result.owners && result.owners.length > 0) {
      console.log('\n👤 Owner Information:');
      result.owners.forEach((owner, idx) => {
        console.log(`   Owner ${idx + 1}:`, owner.full_name || 'Not found');
        console.log('   Email:', owner.email || 'Not found');
        console.log('   Ownership:', owner.ownership_percent ? `${owner.ownership_percent}%` : 'Not found');
      });
    }

    // Check for Google Drive upload
    console.log('\n📁 Google Drive Upload Status:');
    if (result.documentsFolder) {
      console.log('   ✅ Documents uploaded to Google Drive!');
      console.log('   Folder Name:', result.documentsFolder.name);
      console.log('   Folder ID:', result.documentsFolder.id);
      console.log('   View Link:', result.documentsFolder.webViewLink);
      console.log('\n   📎 Uploaded Files:');
      result.documentsFolder.files.forEach(file => {
        console.log(`      • ${file.name} (${file.mimeType})`);
        console.log(`        Link: ${file.webViewLink}`);
      });
    } else {
      console.log('   ⚠️  Documents were NOT uploaded to Google Drive');
      if (result.warnings && result.warnings.length > 0) {
        console.log('\n   Warnings:');
        result.warnings.forEach(warning => {
          console.log(`      • ${warning}`);
        });
      }
    }

    // Display confidence scores
    if (result.confidence) {
      console.log('\n📊 Confidence Scores:');
      console.log('   Deal Info:', `${result.confidence.deal || 0}%`);
      if (result.confidence.owners && result.confidence.owners.length > 0) {
        console.log('   Owners:', result.confidence.owners.map(s => `${s}%`).join(', '));
      }
    }

    // Display missing fields
    if (result.missingFields && result.missingFields.length > 0) {
      console.log('\n⚠️  Missing Fields:', result.missingFields.join(', '));
    }

    console.log('\n✨ Test Complete!\n');

    // Return the result for further inspection
    return result;

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error(error);
  }
}

// Run the test
testGoogleDriveUpload()
  .then(result => {
    if (result && result.documentsFolder) {
      console.log('🎉 SUCCESS: Documents were uploaded to Google Drive!');
      console.log('🔗 Open the folder:', result.documentsFolder.webViewLink);
    } else {
      console.log('⚠️  WARNING: Documents were not uploaded to Google Drive');
      console.log('Check the warnings above for more information');
    }
  })
  .catch(err => {
    console.error('💥 Fatal error:', err);
    process.exit(1);
  });