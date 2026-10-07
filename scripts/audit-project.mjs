import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '..');
const SRC_DIR = path.resolve(ROOT, 'src');

console.log('🔍 [AUDIT] Iniciando auditoría completa de limpieza y salud del proyecto...\n');

let issuesCount = 0;

// 1. Auditoría de idiomas (i18n)
console.log('1️⃣  Auditoría de Internacionalización (i18n):');
try {
  execSync('node scripts/check-i18n.mjs', { cwd: ROOT, stdio: 'inherit' });
} catch (e) {
  issuesCount++;
  console.error('❌ Error en verificación de i18n.');
}

// 2. Detección de archivos huérfanos / no importados en src/
console.log('\n2️⃣  Búsqueda de archivos huérfanos en src/:');
function getAllSourceFiles(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  for (const file of list) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      results = results.concat(getAllSourceFiles(fullPath));
    } else if (file.endsWith('.ts') || file.endsWith('.tsx')) {
      results.push(fullPath);
    }
  }
  return results;
}

const allFiles = getAllSourceFiles(SRC_DIR);
const entryPoints = new Set([
  path.resolve(SRC_DIR, 'main.tsx'),
  path.resolve(SRC_DIR, 'app/App.tsx'),
  path.resolve(SRC_DIR, 'shared/types/database.ts'),
  path.resolve(SRC_DIR, 'shared/config/locales/index.ts')
]);

const fileContents = allFiles.map(f => ({
  file: f,
  relFile: path.relative(ROOT, f),
  baseName: path.basename(f, path.extname(f)),
  content: fs.readFileSync(f, 'utf8')
}));

const indexHtml = fs.readFileSync(path.resolve(ROOT, 'index.html'), 'utf8');
const unimportedFiles = [];

for (const target of fileContents) {
  if (entryPoints.has(target.file)) continue;

  const baseName = target.baseName;
  const relNoExt = path.relative(SRC_DIR, target.file).replace(/\\/g, '/').replace(/\.tsx?$/, '');

  let isReferenced = indexHtml.includes(baseName);
  if (!isReferenced) {
    for (const source of fileContents) {
      if (source.file === target.file) continue;
      if (source.content.includes(baseName) || source.content.includes(relNoExt)) {
        isReferenced = true;
        break;
      }
    }
  }

  if (!isReferenced) {
    unimportedFiles.push(target.relFile);
  }
}

if (unimportedFiles.length > 0) {
  console.warn(`⚠️ Se encontraron ${unimportedFiles.length} archivos potencialmente no importados en src/:`);
  unimportedFiles.forEach(f => console.warn(`   - ${f}`));
  issuesCount++;
} else {
  console.log('✅ Cero archivos huérfanos detectados en src/. Todos los módulos están interconectados.');
}

// 3. Revisión de scripts temporales
console.log('\n3️⃣  Revisión de scripts en scripts/:');
const scriptsDir = path.resolve(ROOT, 'scripts');
const registeredScripts = new Set(['check-i18n.mjs', 'audit-project.mjs']);
const unknownScripts = fs.readdirSync(scriptsDir).filter(f => !registeredScripts.has(f));

if (unknownScripts.length > 0) {
  console.warn(`⚠️ Se encontraron scripts temporales o no registrados en scripts/:`);
  unknownScripts.forEach(s => console.warn(`   - scripts/${s}`));
  issuesCount++;
} else {
  console.log('✅ Directorio scripts/ limpio (únicamente scripts oficiales del pipeline).');
}

console.log('\n--------------------------------------------------');
if (issuesCount === 0) {
  console.log('✨ [AUDIT PASSED] El proyecto está 100% limpio y listo para commit.\n');
  process.exit(0);
} else {
  console.warn(`⚠️ [AUDIT WARNINGS] Se encontraron ${issuesCount} observaciones a revisar.\n`);
  process.exit(1);
}
