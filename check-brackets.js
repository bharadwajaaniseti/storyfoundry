const fs = require('fs');

const content = fs.readFileSync('src/components/world-building/arcs-panel.tsx', 'utf8');
const lines = content.split('\n');

let parens = 0;
let braces = 0;
let brackets = 0;

for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  
  // Skip comments and strings (basic approach)
  let inString = false;
  let inComment = false;
  let stringChar = '';
  
  for (let j = 0; j < line.length; j++) {
    const char = line[j];
    const nextChar = line[j + 1];
    
    // Handle comments
    if (!inString && char === '/' && nextChar === '/') {
      inComment = true;
      break;
    }
    
    if (!inString && char === '/' && nextChar === '*') {
      inComment = true;
      continue;
    }
    
    if (inComment && char === '*' && nextChar === '/') {
      inComment = false;
      j++; // skip next char
      continue;
    }
    
    if (inComment) continue;
    
    // Handle strings
    if (!inString && (char === '"' || char === "'" || char === '`')) {
      inString = true;
      stringChar = char;
      continue;
    }
    
    if (inString && char === stringChar && line[j-1] !== '\\') {
      inString = false;
      continue;
    }
    
    if (inString) continue;
    
    // Count brackets
    if (char === '(') parens++;
    if (char === ')') parens--;
    if (char === '{') braces++;
    if (char === '}') braces--;
    if (char === '[') brackets++;
    if (char === ']') brackets--;
    
    // Report unbalanced at specific lines
    if (i >= 3900 && (parens < 0 || braces < 0 || brackets < 0)) {
      console.log(`Line ${i + 1}: Unbalanced - parens: ${parens}, braces: ${braces}, brackets: ${brackets}`);
      console.log(`Content: ${line.trim()}`);
    }
  }
  
  if (i >= 3900) {
    console.log(`Line ${i + 1}: parens: ${parens}, braces: ${braces}, brackets: ${brackets} | ${line.trim()}`);
  }
}

console.log(`Final counts - parens: ${parens}, braces: ${braces}, brackets: ${brackets}`);