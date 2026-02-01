const https = require('https');

// Test the live API
const options = {
  hostname: 'flacko.ai',
  path: '/api/admin/subscribers',
  method: 'GET',
  headers: {
    'Content-Type': 'application/json'
  }
};

console.log('Testing live API at https://flacko.ai/api/admin/subscribers\n');

const req = https.request(options, (res) => {
  let data = '';
  
  console.log(`Status: ${res.statusCode}`);
  console.log(`Headers:`, JSON.stringify(res.headers, null, 2));
  
  res.on('data', (chunk) => {
    data += chunk;
  });
  
  res.on('end', () => {
    console.log('\nResponse body:');
    try {
      const parsed = JSON.parse(data);
      console.log(JSON.stringify(parsed, null, 2));
      if (parsed.users) {
        console.log(`\n✅ Found ${parsed.users.length} users`);
      }
    } catch (e) {
      console.log(data);
    }
  });
});

req.on('error', (e) => {
  console.error('Error:', e);
});

req.end();
