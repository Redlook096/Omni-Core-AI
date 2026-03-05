const https = require('https');

https.get('https://wandbox.org/api/list.json', (res) => {
  let data = '';
  res.on('data', (chunk) => data += chunk);
  res.on('end', () => {
    const compilers = JSON.parse(data);
    const js = compilers.filter(c => c.language === 'JavaScript').map(c => c.name);
    const ts = compilers.filter(c => c.language === 'TypeScript').map(c => c.name);
    const cpp = compilers.filter(c => c.language === 'C++').map(c => c.name);
    const c = compilers.filter(c => c.language === 'C').map(c => c.name);
    const java = compilers.filter(c => c.language === 'Java').map(c => c.name);
    const go = compilers.filter(c => c.language === 'Go').map(c => c.name);
    const rust = compilers.filter(c => c.language === 'Rust').map(c => c.name);
    const php = compilers.filter(c => c.language === 'PHP').map(c => c.name);
    const ruby = compilers.filter(c => c.language === 'Ruby').map(c => c.name);
    const bash = compilers.filter(c => c.language === 'Bash script').map(c => c.name);
    const cs = compilers.filter(c => c.language === 'C#').map(c => c.name);
    
    console.log({
      js: js[0],
      ts: ts[0],
      cpp: cpp[0],
      c: c[0],
      java: java[0],
      go: go[0],
      rust: rust[0],
      php: php[0],
      ruby: ruby[0],
      bash: bash[0],
      cs: cs[0]
    });
  });
});
