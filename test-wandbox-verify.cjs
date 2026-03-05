const https = require('https');

const compilers = [
  'nodejs-20.17.0',
  'typescript-5.6.2',
  'cpython-3.13.8',
  'gcc-13.2.0',
  'gcc-13.2.0-c',
  'openjdk-jdk-22+36',
  'go-1.23.2',
  'rust-1.82.0',
  'php-8.3.12',
  'ruby-3.4.1',
  'bash',
  'mono-6.12.0.199'
];

const testCompiler = async (compiler) => {
  return new Promise((resolve) => {
    const data = JSON.stringify({
      compiler: compiler,
      code: 'print("Hello")' // Just a dummy code, we just want to see if it compiles or errors out with catatonit
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
      res.on('end', () => {
        try {
          const parsed = JSON.parse(resData);
          if (parsed.program_error && parsed.program_error.includes('catatonit')) {
            console.log(`❌ ${compiler} FAILED (catatonit error)`);
          } else if (parsed.compiler_error && parsed.compiler_error.includes('Unknown compiler')) {
            console.log(`❌ ${compiler} FAILED (Unknown compiler)`);
          } else {
            console.log(`✅ ${compiler} OK`);
          }
        } catch(e) {
          console.log(`❌ ${compiler} FAILED (Parse error)`);
        }
        resolve();
      });
    });
    req.write(data);
    req.end();
  });
};

const runAll = async () => {
  for (const c of compilers) {
    await testCompiler(c);
  }
};

runAll();
