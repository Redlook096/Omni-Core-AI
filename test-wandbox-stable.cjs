const https = require('https');

https.get('https://wandbox.org/api/list.json', (res) => {
  let data = '';
  res.on('data', (chunk) => data += chunk);
  res.on('end', () => {
    const compilers = JSON.parse(data);
    
    const getStable = (lang) => {
      const available = compilers.filter(c => c.language === lang);
      return available.find(c => !c.name.includes('head'))?.name || available[0]?.name;
    };

    const map = {
      'javascript': getStable('JavaScript'),
      'typescript': getStable('TypeScript'),
      'python': getStable('Python'),
      'cpp': getStable('C++'),
      'c': getStable('C'),
      'java': getStable('Java'),
      'go': getStable('Go'),
      'rust': getStable('Rust'),
      'php': getStable('PHP'),
      'ruby': getStable('Ruby'),
      'bash': getStable('Bash script'),
      'csharp': getStable('C#')
    };
    
    console.log(JSON.stringify(map, null, 2));
  });
});
