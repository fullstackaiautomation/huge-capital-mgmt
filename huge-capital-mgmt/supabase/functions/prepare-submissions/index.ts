import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

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

async function logAgentRun(
  supabase: any,
  entry: Record<string, any>
): Promise<string | null> {
  if (!supabase) return null;
  try {
    const { data, error } = await supabase
      .from('agent_run_logs')
      .insert(entry)
      .select('id')
      .single();
    if (error) {
      console.error('Failed to log agent run:', error);
      return null;
    }
    return data?.id ?? null;
  } catch (err) {
    console.error('Failed to log agent run:', err);
    return null;
  }
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

  const startTime = performance.now();
  let supabaseAdmin: any = null;
  let userId: string | null = null;
  let requestPayload: Record<string, any> | null = null;
  let requestSummary = '';
  let logId: string | null = null;

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

    const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    supabaseAdmin =
      SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY
        ? createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
        : null;

    const authHeader = req.headers.get('authorization') || req.headers.get('Authorization');
    if (supabaseAdmin && authHeader?.toLowerCase().startsWith('bearer ')) {
      try {
        const token = authHeader.replace(/^Bearer\s+/i, '');
        const {
          data: { user },
        } = await supabaseAdmin.auth.getUser(token);
        userId = user?.id ?? null;
      } catch (authError) {
        console.error('Failed to resolve auth user for logging:', authError);
      }
    }

    requestPayload = {
      deal: {
        legal_business_name: dealData?.legal_business_name,
        loan_type: dealData?.loan_type,
        desired_loan_amount: dealData?.desired_loan_amount,
      },
      selectedLenders: selectedLenders.map((l: any) => ({ id: l.id, name: l.name })),
      documentLinksCount: Array.isArray(dealDocumentLinks) ? dealDocumentLinks.length : 0,
    };

    requestSummary = `${dealData?.legal_business_name || 'Unknown deal'} (${selectedLenders.length} ${
      selectedLenders.length === 1 ? 'lender' : 'lenders'
    })`;

    if (!ANTHROPIC_API_KEY) {
      const duration = Math.round(performance.now() - startTime);
      logId =
        (await logAgentRun(supabaseAdmin, {
          agent_name: 'submission-agent',
          agent_stage: 'submission_package',
          invocation_source: 'edge_function',
          user_id: userId,
          request_payload: requestPayload,
          request_summary: requestSummary,
          response_payload: null,
          response_summary: 'Anthropic API key not configured',
          success: false,
          error_message: 'Anthropic API key not configured',
          duration_ms: duration,
        })) ?? logId;

      return new Response(
        JSON.stringify({ error: 'Anthropic API key not configured', logId }),
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

    const responseBody: PrepareSubmissionsResponse = {
      packages,
      totalPackages: packages.length,
      warnings: packages.length < selectedLenders.length ? ['Some submission packages failed to generate'] : [],
    };

    const duration = Math.round(performance.now() - startTime);
    const responseSummary = `Generated ${responseBody.totalPackages} submission package${
      responseBody.totalPackages === 1 ? '' : 's'
    }`;

    logId =
      (await logAgentRun(supabaseAdmin, {
        agent_name: 'submission-agent',
        agent_stage: 'submission_package',
        invocation_source: 'edge_function',
        user_id: userId,
        request_payload: requestPayload,
        request_summary: requestSummary,
        response_payload: responseBody,
        response_summary: responseSummary,
        success: true,
        duration_ms: duration,
      })) ?? logId;

    return new Response(
      JSON.stringify({ ...responseBody, logId }),
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

    const duration = Math.round(performance.now() - startTime);
    logId =
      (await logAgentRun(supabaseAdmin, {
        agent_name: 'submission-agent',
        agent_stage: 'submission_package',
        invocation_source: 'edge_function',
        user_id: userId,
        request_payload: requestPayload,
        request_summary: requestSummary,
        response_payload: null,
        response_summary: 'Error during submission package generation',
        success: false,
        error_message: error instanceof Error ? error.message : 'Submission preparation failed',
        duration_ms: duration,
      })) ?? logId;

    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : 'Submission preparation failed',
        logId,
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
