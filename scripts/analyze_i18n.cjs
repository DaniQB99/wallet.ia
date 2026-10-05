const fs = require('fs');
const path = require('path');

const localesDir = path.join(__dirname, '..', 'src', 'shared', 'config', 'locales');
const files = fs.readdirSync(localesDir).filter(f => f.endsWith('.json'));

const referenceFile = 'es-ES.json';
const referenceData = JSON.parse(fs.readFileSync(path.join(localesDir, referenceFile), 'utf-8'));
const referenceKeys = Object.keys(referenceData);

const report = {
  missingKeys: {},
  identicalKeys: {},
  surplusKeys: {},
  emptyValues: {},
  interpolationIssues: {}
};

const getVariables = (text) => {
  const matches = text.match(/\{[^}]+\}/g) || [];
  return matches.sort().join(',');
};

const exclusions = ['OK', 'wallet.ia', 'EUR', 'USD'];

files.forEach(file => {
  if (file === referenceFile) return;
  const lang = file.replace('.json', '');
  const data = JSON.parse(fs.readFileSync(path.join(localesDir, file), 'utf-8'));
  const keys = Object.keys(data);
  
  report.missingKeys[lang] = referenceKeys.filter(k => !keys.includes(k));
  report.surplusKeys[lang] = keys.filter(k => !referenceKeys.includes(k));
  
  report.identicalKeys[lang] = [];
  report.emptyValues[lang] = [];
  report.interpolationIssues[lang] = [];
  
  keys.forEach(key => {
    const val = data[key];
    
    // Check empty or TODO
    if (!val || val.trim() === '' || val.includes('TODO')) {
      report.emptyValues[lang].push(key);
    }
    
    if (referenceKeys.includes(key)) {
      const refVal = referenceData[key];
      
      // Check identical
      if (val === refVal && !exclusions.includes(val) && val.length > 3) { // rudimentary exclusion
        report.identicalKeys[lang].push({ key, val });
      }
      
      // Check interpolation mismatch
      if (getVariables(val) !== getVariables(refVal)) {
        report.interpolationIssues[lang].push({
          key,
          ref: getVariables(refVal),
          lang: getVariables(val)
        });
      }
    }
  });
});

fs.writeFileSync('i18n_report.json', JSON.stringify(report, null, 2));
console.log('Report generated at i18n_report.json');
