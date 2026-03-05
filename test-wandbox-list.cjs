const https = require('https');

https.get('https://wandbox.org/api/list.json', (res) => {
  let data = '';
  res.on('data', (chunk) => data += chunk);
  res.on('end', () => {
    const compilers = JSON.parse(data);
    const pythons = compilers.filter(c => c.language === 'Python').map(c => c.name);
    console.log(pythons);
  });
});
