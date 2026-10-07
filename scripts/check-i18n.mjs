import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '..');
const LOCALES_DIR = path.resolve(ROOT, 'src/shared/config/locales');
const SRC_DIR = path.resolve(ROOT, 'src');
const BASE_LOCALE = 'es-ES.json';
const OTHER_LOCALES = [
  'en-US.json',
  'de-DE.json',
  'fr-FR.json',
  'it-IT.json',
  'pt-PT.json'
];

console.log('🌐 [i18n:check] Verificando integridad y uso de idiomas en Wallet.ia...\n');

let hasError = false;

// 1. Cargar archivo base
const basePath = path.join(LOCALES_DIR, BASE_LOCALE);
if (!fs.existsSync(basePath)) {
  console.error(`❌ Archivo base ${BASE_LOCALE} no encontrado.`);
  process.exit(1);
}

const baseContent = JSON.parse(fs.readFileSync(basePath, 'utf8'));
const baseKeys = Object.keys(baseContent);
console.log(`ℹ️ Idioma base (${BASE_LOCALE}): ${baseKeys.length} claves registradas.\n`);

// 2. Comparar cada idioma contra la base
for (const file of OTHER_LOCALES) {
  const filePath = path.join(LOCALES_DIR, file);
  if (!fs.existsSync(filePath)) {
    console.error(`❌ Archivo ${file} no encontrado.`);
    hasError = true;
    continue;
  }

  const content = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  const keys = Object.keys(content);
  const keySet = new Set(keys);

  const missing = baseKeys.filter(k => !keySet.has(k));
  const extra = keys.filter(k => !(k in baseContent));

  if (missing.length > 0) {
    console.error(`❌ [${file}] Faltan ${missing.length} claves:`);
    missing.forEach(k => console.error(`   - "${k}"`));
    hasError = true;
  }

  if (extra.length > 0) {
    console.warn(`⚠️ [${file}] Tiene ${extra.length} claves extras no presentes en ${BASE_LOCALE}:`);
    extra.forEach(k => console.warn(`   + "${k}"`));
    hasError = true;
  }

  if (missing.length === 0 && extra.length === 0) {
    console.log(`✅ [${file}]: 100% sincronizado (${keys.length} claves).`);
  }
}

// 3. Comprobar claves no utilizadas en el código fuente
function getAllSourceFiles(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  for (const file of list) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      results = results.concat(getAllSourceFiles(fullPath));
    } else if (file.endsWith('.ts') || file.endsWith('.tsx') || file.endsWith('.html')) {
      results.push(fullPath);
    }
  }
  return results;
}

const sourceFiles = getAllSourceFiles(SRC_DIR).concat(path.join(ROOT, 'index.html'));
const sourceContents = sourceFiles.map(f => fs.readFileSync(f, 'utf8')).join('\n');

const unusedKeys = [];
for (const key of baseKeys) {
  if (key.startsWith('defaults.categories.') || key === 'defaults.account.main') {
    continue;
  }
  const isUsed = sourceContents.includes(`'${key}'`) ||
                 sourceContents.includes(`"${key}"`) ||
                 sourceContents.includes(`\`${key}\``) ||
                 sourceContents.includes(key);

  if (!isUsed) {
    unusedKeys.push(key);
  }
}

if (unusedKeys.length > 0) {
  console.warn(`\n⚠️ [i18n:check] Se encontraron ${unusedKeys.length} claves sin uso directo en el código:`);
  unusedKeys.forEach(k => console.warn(`   ? "${k}"`));
} else {
  console.log(`\n✅ [i18n:check] Todas las claves (${baseKeys.length}) están activamente en uso en el código fuente.`);
}

console.log('');
if (hasError) {
  console.error('❌ [i18n:check] Se detectaron inconsistencias en las claves de traducción.\n');
  process.exit(1);
} else {
  console.log('🎉 [i18n:check] Todos los idiomas (6) tienen paridad exacta de claves y están limpios.\n');
  process.exit(0);
}
