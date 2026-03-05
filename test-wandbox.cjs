const https = require('https');

const data = JSON.stringify({
  compiler: 'cpython-head',
  code: 'print("Hello World")',
  save: false
});

const req = https.request('https://wandbox.org/api/compile.json', {
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
