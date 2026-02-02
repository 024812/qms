import dotenv from 'dotenv';
import OpenAI from 'openai';

// Load .env.local
dotenv.config({ path: '.env.local' });

async function verifyAzure() {
  console.log('--- Verifying Azure OpenAI ---');
  const apiKey = process.env.AZURE_OPENAI_API_KEY;
  const endpoint = process.env.AZURE_OPENAI_ENDPOINT;
  const deployment = process.env.AZURE_OPENAI_DEPLOYMENT;

  if (!apiKey || !endpoint || !deployment) {
    console.error('Missing Azure config in .env.local');
    return;
  }

  console.log(`Endpoint: ${endpoint}`);
  console.log(`Deployment: ${deployment}`);

  try {
    // Handle AI Studio Project URLs by stripping the path if present
    let effectiveEndpoint = endpoint;
    if (endpoint.includes('/api/projects')) {
      try {
        const url = new URL(endpoint);
        effectiveEndpoint = url.origin;
        console.log(`Normalized Endpoint: ${effectiveEndpoint}`);
      } catch {
        console.warn('Invalid Azure Endpoint URL, using as is:', endpoint);
      }
    }

    const client = new OpenAI({
      apiKey: apiKey,
      baseURL: `${effectiveEndpoint}/openai/deployments/${deployment}`,
      defaultQuery: { 'api-version': '2024-06-01' },
      defaultHeaders: { 'api-key': apiKey },
    });

    const response = await client.chat.completions.create({
      model: deployment,
      messages: [{ role: 'user', content: 'Hello, are you working?' }],
      max_tokens: 10,
    });

    console.log('Success! Response:', response.choices[0].message.content);
  } catch (error: any) {
    console.error('Azure Error:', error.message);
    if (error.cause) console.error('Cause:', error.cause);
  }
}

async function verifyEbay() {
  console.log('\n--- Verifying eBay API ---');
  // Basic connectivity check requires constructing the client similar to the service
  // For now, let's just check if keys are present as full eBay auth flow is complex to replicate in simple script
  // without duplicating the entire EbayApiClient class logic.
  const appId = process.env.App_ID;
  const certId = process.env.Cert_ID;
  const devId = process.env.Dev_ID;

  console.log(`App ID present: ${!!appId}`);
  console.log(`Cert ID present: ${!!certId}`);
  console.log(`Dev ID present: ${!!devId}`);

  if (appId && certId) {
    console.log('eBay credentials appear to be set in .env.local (checking App_ID variable name).');
  } else {
    console.error('Missing eBay credentials in .env.local');
  }
}

async function main() {
  await verifyAzure();
  await verifyEbay();
}

main();
