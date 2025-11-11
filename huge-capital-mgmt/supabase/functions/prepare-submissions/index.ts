import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const ANTHROPIC_API_KEY = Deno.env.get('ANTHROPIC_API_KEY');

interface SubmissionPackage {
  lender_id: string;
  lender_name: string;
  email_template: {
    subject: string;
    body: string;
  };
  checklist: {
    item: string;
    required: boolean;
    completed: boolean;
  }[];
  documentLinks: {
    name: string;
    url: string;
  }[];
  mailtoLink: string;
}

interface PrepareSubmissionsResponse {
  packages: SubmissionPackage[];
  totalPackages: number;
  warnings: string[];
}

Deno.serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
    });
  }

  try {
    const { dealData, selectedLenders, dealDocumentLinks } = await req.json();

    if (!dealData || !selectedLenders || selectedLenders.length === 0) {
      return new Response(
        JSON.stringify({
          error: 'Deal data and selected lenders are required',
        }),
        { status: 400, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } }
      );
    }

    if (!ANTHROPIC_API_KEY) {
      return new Response(
        JSON.stringify({ error: 'Anthropic API key not configured' }),
        { status: 500, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } }
      );
    }

    const packages: SubmissionPackage[] = [];

    for (const lender of selectedLenders) {
      try {
        const submission = await generateSubmissionPackage(
          dealData,
          lender,
          dealDocumentLinks || [],
          ANTHROPIC_API_KEY
        );
        packages.push(submission);
      } catch (error) {
        console.error(`Error generating package for ${lender.name}:`, error);
      }
    }

    return new Response(
      JSON.stringify({
        packages,
        totalPackages: packages.length,
        warnings: packages.length < selectedLenders.length ? ['Some submission packages failed to generate'] : [],
      }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      }
    );
  } catch (error) {
    console.error('Submission preparation error:', error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : 'Submission preparation failed',
      }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      }
    );
  }
});

async function generateSubmissionPackage(
  dealData: any,
  lender: any,
  documentLinks: any[] = [],
  apiKey: string
): Promise<SubmissionPackage> {
  const systemPrompt = `You are an expert at preparing professional loan submission packages. Your task is to create:
1. A professional email template for lender submission
2. A submission checklist of required documents

RETURN ONLY VALID JSON in this format:
{
  "emailSubject": "string",
  "emailBody": "string - professional, concise, ~200-300 words",
  "checklist": [
    {
      "item": "Application completed",
      "required": true
    },
    ...
  ]
}`;

  const userPrompt = `Create submission package for:

DEAL:
- Business: ${dealData.legal_business_name}
- Loan Type: ${dealData.loan_type}
- Amount: $${dealData.desired_loan_amount}
- Purpose: ${dealData.reason_for_loan}

LENDER:
- Name: ${lender.name}
- Email: ${lender.email}

Create professional submission with:
1. Email subject and body
2. Checklist of required documents

Be specific about this deal and lender.`;

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 1500,
        system: systemPrompt,
        messages: [
          {
            role: 'user',
            content: userPrompt,
          },
        ],
      }),
    });

    if (!response.ok) {
      throw new Error(`Claude API error: ${response.statusText}`);
    }

    const data = await response.json();
    const content = data.content[0].text;

    // Extract JSON from response
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Invalid response format');
    }

    const parsed = JSON.parse(jsonMatch[0]);

    // Build checklist items
    const checklist = [
      {
        item: 'Application Form Completed',
        required: true,
        completed: false,
      },
      {
        item: '3 Months of Bank Statements',
        required: true,
        completed: false,
      },
      {
        item: 'Owner Government IDs',
        required: lender.requires_ids !== false,
        completed: false,
      },
      {
        item: 'Business License/Registration',
        required: true,
        completed: false,
      },
    ];

    if (dealData.loan_type === 'MCA') {
      checklist.push({
        item: 'Processing Agreements',
        required: true,
        completed: false,
      });
    }

    // Build document links
    const documents = documentLinks.map((link: any) => ({
      name: link.name || 'Document',
      url: link.url,
    }));

    // Create mailto link
    const mailtoSubject = encodeURIComponent(parsed.emailSubject || 'Deal Submission');
    const mailtoBody = encodeURIComponent(parsed.emailBody || '');
    const mailtoLink = `mailto:${lender.email}?subject=${mailtoSubject}&body=${mailtoBody}`;

    return {
      lender_id: lender.id,
      lender_name: lender.name,
      email_template: {
        subject: parsed.emailSubject || 'Deal Submission',
        body: parsed.emailBody || '',
      },
      checklist:
        parsed.checklist &&
        parsed.checklist.map((item: any) => ({
          item: item.item || '',
          required: item.required !== false,
          completed: false,
        })),
      documentLinks: documents,
      mailtoLink,
    };
  } catch (error) {
    console.error('Error generating submission package:', error);
    throw error;
  }
}
