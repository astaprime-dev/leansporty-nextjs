// Test script to verify Cloudflare Images API access
require('dotenv').config({ path: '.env.local' });

const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
const apiToken = process.env.CLOUDFLARE_API_TOKEN;

console.log('Testing Cloudflare Images API access...\n');
console.log('Account ID:', accountId ? '✓ Set' : '✗ Missing');
console.log('API Token:', apiToken ? '✓ Set' : '✗ Missing');
console.log('');

if (!accountId || !apiToken) {
  console.error('Error: Missing Cloudflare credentials');
  process.exit(1);
}

// Test API access by listing images
const testUrl = `https://api.cloudflare.com/client/v4/accounts/${accountId}/images/v1`;

fetch(testUrl, {
  method: 'GET',
  headers: {
    'Authorization': `Bearer ${apiToken}`,
  },
})
  .then(async (response) => {
    const data = await response.json();

    console.log('API Response Status:', response.status);
    console.log('');

    if (data.success) {
      console.log('✓ SUCCESS! Cloudflare Images API is accessible');
      console.log('Images found:', data.result?.images?.length || 0);
    } else {
      console.log('✗ FAILED! Cloudflare Images API error');
      console.log('');
      console.log('Error details:');
      console.log(JSON.stringify(data.errors, null, 2));
      console.log('');
      console.log('Common fixes:');
      console.log('1. Enable Cloudflare Images in your dashboard');
      console.log('2. Create new API token with "Cloudflare Images - Edit" permission');
      console.log('3. Update CLOUDFLARE_API_TOKEN in .env.local');
    }
  })
  .catch((error) => {
    console.error('✗ Request failed:', error.message);
  });
