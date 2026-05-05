const fs = require('fs');
const path = require('path');

const filePath = path.join(process.cwd(), 'src', 'app', 'globals.css');
let content = fs.readFileSync(filePath, 'utf8');

// Line 666 (1-indexed) is index 665
const lines = content.split(/\r?\n/);
if (lines[665] && lines[665].trim() === '}') {
  console.log('Found orphaned brace at line 666. Removing...');
  lines.splice(665, 1);
  fs.writeFileSync(filePath, lines.join('\n'));
  console.log('Fixed!');
} else {
  console.log('Brace not found at line 666 exactly. Content was:', lines[665]);
}
