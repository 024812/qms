import eBayApi from '@hendt/ebay-api';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

async function debugAuth() {
  const appId = process.env.App_ID || '';
  const certId = process.env.Cert_ID || '';
  const devId = process.env.Dev_ID || '';

  if (!appId || !certId) {
    console.error('Error: App_ID or Cert_ID missing from .env.local');
    return;
  }

  console.log('App ID:', appId);
  console.log('Cert ID:', certId ? '***' + certId.slice(-4) : 'MISSING');

  const isSandbox = process.env.EBAY_ENVIRONMENT === 'sandbox';
  console.log('Environment:', isSandbox ? 'SANDBOX' : 'PRODUCTION');

  const client = new eBayApi({
    appId: appId,
    certId: certId,
    devId: devId,
    sandbox: isSandbox,
    siteId: eBayApi.SiteId.EBAY_US,
    marketplaceId: eBayApi.MarketplaceId.EBAY_US,
  });

  const scopesToTry = [
    ['https://api.ebay.com/oauth/api_scope'], // Underscore
    ['https://api.ebay.com/oauth/api_scope/buy.browse'], // Underscore
  ];

  for (const scope of scopesToTry) {
    try {
      console.log(`\n---------------------------------`);
      console.log(`Testing Scope: ${JSON.stringify(scope)}`);
      client.OAuth2.setScope(scope);
      const token = await client.OAuth2.getApplicationAccessToken();
      console.log('SUCCESS! Token received.');
      console.log('Token starts with:', token.substring(0, 15));
      return; // Exit if found
    } catch (error: any) {
      console.error('Auth Failed.');
      if (error.response) {
        console.error('Status:', error.response.status);
        console.error('Data:', JSON.stringify(error.response.data, null, 2));
      } else {
        console.error('Error:', error.message);
      }
    }
  }
  console.log('\nAll scopes failed.');
}

debugAuth();
