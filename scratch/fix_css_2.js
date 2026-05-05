const fs = require('fs');
const path = require('path');

const filePath = path.join(process.cwd(), 'src', 'app', 'globals.css');
let content = fs.readFileSync(filePath, 'utf8');
const lines = content.split(/\r?\n/);

// We want the media query to contain the hero h2 and p rules
// Let's rewrite the block around line 640-670
const startLine = 642; // .hero
const endLine = 665; // end of .hero p

const newBlock = `.hero {
  position: relative;
  background: linear-gradient(135deg, var(--brand) 0%, #3B82F6 100%);
  color: #fff;
  border-radius: var(--r-lg);
  padding: 20px;
  overflow: hidden;
  box-shadow: 0 12px 24px -10px rgba(37, 99, 235, .4);
}

@media (min-width: 768px) {
  .hero {
    padding: 24px;
    border-radius: var(--r-xl);
  }

  .hero h2 {
    font-size: 26px;
  }

  .hero p {
    font-size: 13px;
  }
}`;

lines.splice(startLine - 1, (endLine - startLine + 1), newBlock);
fs.writeFileSync(filePath, lines.join('\n'));
console.log('Fixed block!');
