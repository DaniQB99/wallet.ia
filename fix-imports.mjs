import fs from 'fs';
import path from 'path';

function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    if (stat && stat.isDirectory()) {
      results = results.concat(walk(filePath));
    } else {
      if (filePath.endsWith('.ts') || filePath.endsWith('.tsx') || filePath.endsWith('.css')) {
        results.push(filePath);
      }
    }
  });
  return results;
}

const files = walk('./src');

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  let changed = false;

  // Fix messed up ts-morph relative paths containing src/
  // Example: '../../services/src/shared/api/supabase' -> '@/shared/api/supabase'
  // Regex looks for anything starting with a quote, then relative path dots/slashes, then src/, and captures the rest.
  const regex = /(['"])(?:\.\.\/|\.\/)+.*?src\/(.*?)(['"])/g;
  if (regex.test(content)) {
    content = content.replace(regex, '$1@/$2$3');
    changed = true;
  }

  // Also catch generic relative imports that could just use @/ if we want, but let's just fix the broken ones first.
  // Another issue might be imports that were not modified but refer to old paths.
  // Let's run a broad replacement for old paths.
  // Old: '../components/layout/Sidebar' -> '@/widgets/layout/Sidebar'
  // Actually, since ts-morph updated the paths but incorrectly relative to src, fixing the `src/` part should be enough!
  
  if (changed) {
    fs.writeFileSync(file, content, 'utf8');
    console.log('Fixed imports in', file);
  }
});
console.log('Import fix complete.');
