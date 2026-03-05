const https = require('https');

const runCode = async (lang, code) => {
  const wandboxLangMap = {
    'javascript': 'JavaScript',
    'js': 'JavaScript',
    'typescript': 'TypeScript',
    'ts': 'TypeScript',
    'python': 'Python',
    'py': 'Python',
    'cpp': 'C++',
    'c++': 'C++',
    'c': 'C',
    'java': 'Java',
    'go': 'Go',
    'rust': 'Rust',
    'php': 'PHP',
    'ruby': 'Ruby',
    'bash': 'Bash script',
    'sh': 'Bash script',
    'csharp': 'C#',
    'cs': 'C#'
  };
  
  const targetLanguage = wandboxLangMap[lang];
  
  if (!targetLanguage) {
    console.log(`Error: Language '${lang}' is not supported by the execution engine.\n`);
    return;
  }

  // Fetch available compilers from Wandbox
  const listResponse = await fetch('https://wandbox.org/api/list.json');
  const compilers = await listResponse.json();
  
  // Find the first compiler that matches the target language
  // We prefer non-head versions if possible, or just take the first one
  const availableCompilers = compilers.filter(c => c.language === targetLanguage);
  
  if (availableCompilers.length === 0) {
    console.log(`Error: No compiler found for language '${targetLanguage}'.\n`);
    return;
  }

  // Prefer a stable version over 'head' if available, otherwise use the first one
  let compiler = availableCompilers.find(c => !c.name.includes('head'))?.name || availableCompilers[0].name;

  console.log(`Using compiler: ${compiler}`);

  // Use Wandbox API for code execution
  const response = await fetch('https://wandbox.org/api/compile.json', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      compiler: compiler,
      code: code,
      save: false
    }),
  });

  const data = await response.json();
  
  if (data.status === '0') {
    console.log(data.program_message || data.program_output || 'Program exited with no output.');
  } else {
    console.log(data.compiler_error || data.compiler_message || data.program_error || 'Error executing code.');
  }
};

runCode('python', 'print("Hello World from Python")');
runCode('js', 'console.log("Hello World from JS")');
runCode('cpp', '#include <iostream>\nint main() { std::cout << "Hello World from C++" << std::endl; return 0; }');
