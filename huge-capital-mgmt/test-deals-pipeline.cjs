const fs = require('fs');
const path = require('path');

// Test documents path
const docsPath = 'C:\\Users\\blkw\\OneDrive\\Documents\\Github\\Huge Capital\\huge-capital-mgmt\\Deals Page\\New Submission Documents\\Bank Statement Breakdown\\Cinematic Productions';

// Edge function URLs - using deployed Supabase functions
const SUPABASE_URL = 'https://oymwsfyspdvbazklqkpm.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im95bXdzZnlzcGR2YmF6a2xxa3BtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkzMDIyMzUsImV4cCI6MjA3NDg3ODIzNX0.EZUSSmzDwZkqhOvdjcDp6KoZd_Au3i5xRm5t7QlosmU';
const PARSE_DEAL_URL = `${SUPABASE_URL}/functions/v1/parse-deal-documents`;
const MATCH_LENDERS_URL = `${SUPABASE_URL}/functions/v1/match-deal-to-lenders`;

async function encodeFileToBase64(filePath) {
  const buffer = fs.readFileSync(filePath);
  return buffer.toString('base64');
}

async function testParseDealDocuments() {
  console.log('\n=== Testing Deal Info Agent with OpenAI (parse-deal-documents) ===\n');

  try {
    // Test with image only since PDFs aren't supported by vision APIs yet
    const imgFile = path.join(docsPath, 'Application.png');

    if (!fs.existsSync(imgFile)) {
      console.log('❌ Application.png not found at:', imgFile);
      return null;
    }

    const imgBase64 = await encodeFileToBase64(imgFile);

    const files = [
      {
        name: 'Application.png',
        content: imgBase64,
        type: 'image/png'
      }
    ];

    console.log('📤 Uploading files:');
    console.log(`  - Application.png (${(imgBase64.length / 1024).toFixed(2)}KB)`);
    console.log('\n🤖 Using OpenAI GPT-4o for extraction...');

    const response = await fetch(PARSE_DEAL_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      },
      body: JSON.stringify({
        files: files
      })
    });

    console.log(`\nResponse Status: ${response.status}`);

    const data = await response.json();

    // Handle both response formats
    const dealInfo = data.deal || data.deal_information;
    if (dealInfo && dealInfo.legal_business_name) {
      console.log('\n✅ SUCCESS! Document parsing worked!');
      console.log('\nExtracted Deal Information:');
      console.log(`  Business Name: ${dealInfo.legal_business_name}`);
      console.log(`  Business Type: ${dealInfo.business_type}`);
      console.log(`  Location: ${dealInfo.city}, ${dealInfo.state}`);
      console.log(`  Monthly Sales: $${dealInfo.average_monthly_sales?.toLocaleString() || 'N/A'}`);
      console.log(`  Loan Type: ${dealInfo.loan_type}`);
      console.log(`  Desired Amount: $${dealInfo.desired_loan_amount?.toLocaleString() || 'N/A'}`);

      const confidence = data.confidence?.deal || data.confidence_scores?.deal_confidence;
      console.log(`  Deal Confidence: ${confidence || 'N/A'}%`);

      console.log('\nOwners Extracted:');
      const owners = data.owners || [];
      owners.forEach((owner, i) => {
        console.log(`  ${i+1}. ${owner.full_name} (${owner.ownership_percent}%)`);
      });

      console.log('\nBank Statements:');
      const statements = data.statements || data.bank_statements || [];
      console.log(`  Months Available: ${statements.length}`);
      if (statements.length > 0) {
        statements.forEach((stmt, i) => {
          console.log(`  ${i+1}. ${stmt.statement_month}: ${stmt.bank_name} - $${stmt.credits?.toLocaleString() || 0} credits`);
        });
      }

      // Return normalized format for next function
      return {
        deal: dealInfo,
        owners: owners,
        statements: statements,
        fundingPositions: data.funding_positions || []
      };
    } else {
      console.log('\n❌ FAILED - No deal information extracted');
      console.log('Response:', JSON.stringify(data, null, 2));
      return null;
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
    return null;
  }
}

async function testMatchDealToLenders(dealData) {
  if (!dealData) {
    console.log('\n⏭️  Skipping lender matching - no deal data');
    return;
  }

  console.log('\n=== Testing Lending Expert Agent (match-deal-to-lenders) ===\n');

  try {
    const requestBody = {
      dealId: 'test-deal-' + Date.now(),
      deal: dealData,
      loanType: dealData.deal.loan_type || 'MCA',
      brokerPreferences: {}
    };

    console.log(`Matching deal for loan type: ${requestBody.loanType}`);

    const response = await fetch(MATCH_LENDERS_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      },
      body: JSON.stringify(requestBody)
    });

    console.log(`Response Status: ${response.status}`);

    const recommendations = await response.json();

    if (recommendations.recommendations && recommendations.recommendations.length > 0) {
      console.log('\n✅ SUCCESS! Lender matching worked!');
      console.log(`\nTotal Lenders Matched: ${recommendations.summary.totalLendersMatched}`);
      console.log(`Top Choice: ${recommendations.summary.topChoice}`);
      console.log(`Huge Capital Lenders: ${recommendations.summary.hugecapitalLenders}`);
      console.log(`IFS Lenders: ${recommendations.summary.ifsLenders}`);

      console.log('\nTop 3 Recommendations:');
      recommendations.recommendations.slice(0, 3).forEach((rec, i) => {
        const ifsLabel = rec.isIfs ? ' (IFS - BACKUP)' : ' (Huge Capital)';
        console.log(`\n${i+1}. ${rec.lenderName}${ifsLabel}`);
        console.log(`   Score: ${rec.matchScore}/100`);
        console.log(`   Approval Probability: ${rec.approvalProbability}`);
        console.log(`   Reasoning: ${rec.reasoning.substring(0, 100)}...`);
      });
    } else {
      console.log('\n❌ FAILED - No recommendations generated');
      console.log('Response:', JSON.stringify(recommendations, null, 2));
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

async function main() {
  console.log('╔════════════════════════════════════════════════════╗');
  console.log('║  Deals Pipeline - End-to-End Test                 ║');
  console.log('║  Testing with Cinematic Productions documents     ║');
  console.log('╚════════════════════════════════════════════════════╝');

  const dealData = await testParseDealDocuments();
  await testMatchDealToLenders(dealData);

  console.log('\n╔════════════════════════════════════════════════════╗');
  console.log('║  Test Complete                                     ║');
  console.log('╚════════════════════════════════════════════════════╝\n');
}

main();
