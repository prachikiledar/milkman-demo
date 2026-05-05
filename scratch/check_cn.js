
import fs from 'fs';
import path from 'path';

function walk(dir, callback) {
  fs.readdirSync(dir).forEach( f => {
    let dirPath = path.join(dir, f);
    let isDirectory = fs.statSync(dirPath).isDirectory();
    isDirectory ? walk(dirPath, callback) : callback(path.join(dir, f));
  });
}

const srcDir = 'd:/Projects/milkman-demo/src';

walk(srcDir, (filePath) => {
  if (filePath.endsWith('.tsx') || filePath.endsWith('.ts')) {
    const content = fs.readFileSync(filePath, 'utf8');
    if (content.includes('cn(')) {
        const hasImport = /import\s+{[^}]*\bcn\b[^}]*}\s+from\s+['"]@\/lib\/utils['"]/.test(content) || /import\s+cn\s+from/.test(content);
        const hasDefinition = /function\s+cn\b/.test(content);
        if (!hasImport && !hasDefinition) {
            console.log(`Missing cn import in: ${filePath}`);
        }
    }
  }
});
