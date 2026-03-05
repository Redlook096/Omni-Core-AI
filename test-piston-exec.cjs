const https = require('https');

const data = JSON.stringify({
  language: 'python',
  version: '*',
  files: [{ content: 'print("Hello World")' }]
});

const req = https.request('https://emkc.org/api/v2/piston/execute', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': data.length
  }
}, (res) => {
  let resData = '';
  res.on('data', (chunk) => resData += chunk);
  res.on('end', () => console.log(resData));
});

req.on('error', (err) => console.log(err));
req.write(data);
req.end();
