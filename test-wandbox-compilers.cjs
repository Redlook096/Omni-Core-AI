const https = require('https');

const testWandbox = (compiler) => {
  const data = JSON.stringify({
    compiler: compiler,
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
    res.on('end', () => console.log(compiler, resData));
  });

  req.on('error', (err) => console.log(err));
  req.write(data);
  req.end();
};

testWandbox('cpython-3.13.8');
testWandbox('cpython-3.14.0');
testWandbox('nodejs-head');
testWandbox('nodejs-22.12.0');
