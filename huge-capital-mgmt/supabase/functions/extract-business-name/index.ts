import "jsr:@supabase/functions-js/edge-runtime.d.ts";

/**
 * Lightweight edge function to extract just the business name from application documents
 * Used before uploading to create properly named folders
 */

function base64ToUint8Array(base64: string): Uint8Array {
  const cleaned = base64.replace(/^data:.*;base64,/, '').replace(/[\r\n\s]/g, '');
  const binary = atob(cleaned);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

function base64UrlEncodeBytes(bytes: Uint8Array): string {
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i += 1) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

function pemToArrayBuffer(pem: string): ArrayBuffer {
  const cleaned = pem
    .replace('-----BEGIN PRIVATE KEY-----', '')
    .replace('-----END PRIVATE KEY-----', '')
    .replace(/\s+/g, '');
  const binary = atob(cleaned);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}

async function importGooglePrivateKey(privateKeyPem: string): Promise<CryptoKey> {
  return await crypto.subtle.importKey(
    'pkcs8',
    pemToArrayBuffer(privateKeyPem),
    {
      name: 'RSASSA-PKCS1-v1_5',
      hash: 'SHA-256',
    },
    false,
    ['sign'],
  );
}

function base64UrlEncodeObject(obj: Record<string, unknown>): string {
  const json = JSON.stringify(obj);
  return base64UrlEncodeBytes(new TextEncoder().encode(json));
}

async function createGoogleAccessToken(
  serviceAccount: any,
  scope: string,
  impersonatedUser?: string | null,
): Promise<{ token: string; expiresAt: number }> {
  const now = Math.floor(Date.now() / 1000);
  const header = {
    alg: 'RS256',
    typ: 'JWT',
  };

  const payload: Record<string, unknown> = {
    iss: serviceAccount.client_email,
    scope,
    aud: 'https://oauth2.googleapis.com/token',
    exp: now + 3600,
    iat: now,
  };

  if (impersonatedUser) {
    payload.sub = impersonatedUser;
  }

  const unsignedToken = `${base64UrlEncodeObject(header)}.${base64UrlEncodeObject(payload)}`;
  const privateKey = await importGooglePrivateKey(serviceAccount.private_key);
  const signature = await crypto.subtle.sign(
    'RSASSA-PKCS1-v1_5',
    privateKey,
    new TextEncoder().encode(unsignedToken),
  );
  const signedJwt = `${unsignedToken}.${base64UrlEncodeBytes(new Uint8Array(signature))}`;

  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion: signedJwt,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to obtain Google access token: ${errorText}`);
  }

  const tokenData = await response.json();
  return {
    token: tokenData.access_token,
    expiresAt: Date.now() + (tokenData.expires_in || 3600) * 1000,
  };
}

function tryParseServiceAccount(raw: string | null): any | null {
  if (!raw) return null;
  const trimmed = raw.trim();
  try {
    return JSON.parse(trimmed);
  } catch (error) {
    try {
      const decoded = new TextDecoder().decode(base64ToUint8Array(trimmed));
      return JSON.parse(decoded);
    } catch (innerError) {
      console.error('Failed to parse Google service account JSON:', innerError);
      throw error;
    }
  }
}

async function extractTextFromPdf(
  fileName: string,
  bytes: Uint8Array,
  openAiKey: string,
): Promise<string | null> {
  try {
    const uploadForm = new FormData();
    uploadForm.append('purpose', 'assistants');
    uploadForm.append('file', new Blob([bytes], { type: 'application/pdf' }), fileName);

    const uploadResponse = await fetch('https://api.openai.com/v1/files', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${openAiKey}`,
      },
      body: uploadForm,
    });

    if (!uploadResponse.ok) {
      const errorText = await uploadResponse.text();
      console.error('Failed to upload PDF to OpenAI:', errorText);
      return null;
    }

    const uploadedFile = await uploadResponse.json();
    const fileId = uploadedFile.id;

    const response = await fetch('https://api.openai.com/v1/responses', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${openAiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4.1-mini',
        input: [
          {
            role: 'system',
            content: [
              {
                type: 'input_text',
                text: 'You are a document parser that extracts the raw textual content from PDF files. Return only the literal text without commentary.',
              },
            ],
          },
          {
            role: 'user',
            content: [
              {
                type: 'input_text',
                text: `Extract the text from the attached PDF: ${fileName}`,
              },
              {
                type: 'input_file',
                file_id: fileId,
              },
            ],
          },
        ],
        max_output_tokens: 8000,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Failed to extract PDF text with OpenAI:', errorText);
      return null;
    }

    const responseData = await response.json();
    const textChunks: string[] = [];
    if (Array.isArray(responseData.output)) {
      for (const output of responseData.output) {
        if (Array.isArray(output.content)) {
          for (const contentItem of output.content) {
            if (contentItem.type === 'output_text' && contentItem.text) {
              textChunks.push(contentItem.text);
            }
          }
        }
      }
    }

    // Clean up uploaded file asynchronously
    fetch(`https://api.openai.com/v1/files/${fileId}`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${openAiKey}`,
      },
    }).catch((cleanupError) => console.error('Failed to delete OpenAI file:', cleanupError));

    return textChunks.join('\n').trim() || null;
  } catch (error) {
    console.error('Error extracting text from PDF:', error);
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
        'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-client-info, apikey',
      },
    });
  }

  try {
    const requestBody = await req.json();
    const file = requestBody.file;

    if (!file || !file.name || !file.content) {
      return new Response(
        JSON.stringify({
          error: 'File with name and content required',
          businessName: null
        }),
        {
          status: 400,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
          }
        }
      );
    }

    const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');
    const ANTHROPIC_API_KEY = Deno.env.get('ANTHROPIC_API_KEY');

    const fileName = file.name || 'Document';
    const mimeType = typeof file.type === 'string' ? file.type : 'application/octet-stream';
    const base64Content = typeof file.content === 'string' ? file.content : '';
    const bytes = base64Content ? base64ToUint8Array(base64Content) : new Uint8Array();

    // Lightweight prompt to extract ONLY business name
    const systemPrompt = `You are a business document analyzer. Extract ONLY the legal business name from the provided document.

Return a JSON object with this structure:
{
  "businessName": "The legal business name as it appears on the document"
}

If you cannot find a business name, return:
{
  "businessName": null
}`;

    const messageContent: any[] = [];

    // Process the file based on type
    if (mimeType.toLowerCase().includes('pdf') && OPENAI_API_KEY) {
      const extracted = await extractTextFromPdf(fileName, bytes, OPENAI_API_KEY);
      if (extracted) {
        messageContent.push({
          type: 'text',
          text: `Extract the business name from this document:\n\n${extracted.substring(0, 10000)}`
        });
      }
    } else if (mimeType.includes('image')) {
      messageContent.push({
        type: mimeType.includes('image') ? 'image_url' : 'text',
        ...(mimeType.includes('image')
          ? { image_url: { url: `data:${mimeType};base64,${base64Content}` } }
          : { text: `Extract the business name from this document.` }
        )
      });
    } else if (mimeType.includes('text') || mimeType.includes('csv')) {
      try {
        const decoded = atob(base64Content);
        messageContent.push({
          type: 'text',
          text: `Extract the business name from this document:\n\n${decoded.substring(0, 10000)}`
        });
      } catch {
        messageContent.push({
          type: 'text',
          text: 'Extract the business name from this document.'
        });
      }
    }

    if (messageContent.length === 0) {
      return new Response(
        JSON.stringify({ businessName: null, error: 'Unable to process file type' }),
        {
          status: 200,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
          }
        }
      );
    }

    // Try OpenAI first (faster and cheaper for this simple task)
    if (OPENAI_API_KEY) {
      try {
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${OPENAI_API_KEY}`,
          },
          body: JSON.stringify({
            model: 'gpt-4o-mini',
            max_tokens: 100,
            messages: [
              {
                role: 'system',
                content: systemPrompt
              },
              {
                role: 'user',
                content: messageContent
              }
            ],
            response_format: { type: "json_object" }
          }),
        });

        if (response.ok) {
          const data = await response.json();
          let content = data.choices[0].message.content;
          const parsed = JSON.parse(content);

          return new Response(
            JSON.stringify({ businessName: parsed.businessName || null }),
            {
              status: 200,
              headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
              }
            }
          );
        }
      } catch (error) {
        console.error('OpenAI extraction failed, trying Claude:', error);
      }
    }

    // Fallback to Claude
    if (ANTHROPIC_API_KEY) {
      try {
        const claudeContent: any[] = [];

        if (mimeType.includes('image')) {
          claudeContent.push({
            type: 'image',
            source: {
              type: 'base64',
              media_type: mimeType,
              data: base64Content
            }
          });
        }

        claudeContent.push({
          type: 'text',
          text: 'Extract the business name from this document and return it as JSON.'
        });

        const response = await fetch('https://api.anthropic.com/v1/messages', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': ANTHROPIC_API_KEY,
            'anthropic-version': '2023-06-01',
          },
          body: JSON.stringify({
            model: 'claude-3-haiku-20240307',
            max_tokens: 100,
            system: systemPrompt,
            messages: [
              {
                role: 'user',
                content: claudeContent,
              },
            ],
          }),
        });

        if (response.ok) {
          const data = await response.json();
          let content = data.content[0].text;

          // Extract JSON
          const jsonMatch = content.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            const parsed = JSON.parse(jsonMatch[0]);
            return new Response(
              JSON.stringify({ businessName: parsed.businessName || null }),
              {
                status: 200,
                headers: {
                  'Content-Type': 'application/json',
                  'Access-Control-Allow-Origin': '*'
                }
              }
            );
          }
        }
      } catch (error) {
        console.error('Claude extraction failed:', error);
      }
    }

    // If all methods fail, return null
    return new Response(
      JSON.stringify({ businessName: null, error: 'No AI service available' }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      }
    );
  } catch (error) {
    console.error('Business name extraction error:', error);
    return new Response(
      JSON.stringify({ businessName: null, error: error instanceof Error ? error.message : 'Unknown error' }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      }
    );
  }
});
