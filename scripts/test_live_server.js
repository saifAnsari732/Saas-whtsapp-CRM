const https = require('https');

function checkEndpoint(urlPath) {
  return new Promise((resolve) => {
    https.get(`https://chatflyr.kisandigital.org${urlPath}`, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        resolve({ status: res.statusCode, data });
      });
    }).on('error', (err) => {
      resolve({ status: 500, error: err.message });
    });
  });
}

async function testLiveServer() {
  console.log('Testing live server endpoints...');
  const resLogin = await checkEndpoint('/login');
  console.log('/login status:', resLogin.status);

  const resConfig = await checkEndpoint('/api/whatsapp/config');
  console.log('/api/whatsapp/config status:', resConfig.status, 'body:', resConfig.data);
}

testLiveServer().catch(console.error);
