const https = require('https');

https.get('https://emkc.org/api/v2/piston/runtimes', (res) => {
  let data = '';
  res.on('data', (chunk) => {
    data += chunk;
  });
  res.on('end', () => {
    console.log(JSON.parse(data).slice(0, 10));
  });
}).on('error', (err) => {
  console.log("Error: " + err.message);
});
