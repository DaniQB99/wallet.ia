const fs = require('fs');
const path = require('path');

const localesDir = path.join(__dirname, '..', 'src', 'shared', 'config', 'locales');
const files = fs.readdirSync(localesDir).filter(f => f.endsWith('.json'));

const newKeys = {
  "en-US": { "exchangeRateInfo": "(at rate {rate})" },
  "es-ES": { "exchangeRateInfo": "(a tasa {rate})" },
  "fr-FR": { "exchangeRateInfo": "(au taux {rate})" },
  "de-DE": { "exchangeRateInfo": "(zu Kurs {rate})" },
  "it-IT": { "exchangeRateInfo": "(al tasso {rate})" },
  "pt-PT": { "exchangeRateInfo": "(à taxa {rate})" }
};

for (const file of files) {
  const lang = file.replace('.json', '');
  const filePath = path.join(localesDir, file);
  const content = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
  
  if (newKeys[lang]) {
    content['exchangeRateInfo'] = newKeys[lang]['exchangeRateInfo'];
    fs.writeFileSync(filePath, JSON.stringify(content, null, 2));
    console.log(`Updated ${file}`);
  }
}
