const fs = require('node:fs');
const path = require('node:path');

const roots = [
  path.resolve(__dirname, '../../packages/sdk/src'),
  path.resolve(__dirname, '../../packages/react/src'),
  path.resolve(__dirname, '../../packages/cli/src/generators'),
];
const forbidden = [
  /method\s*===\s*['"]GET['"]/, 
  /method\s*===\s*['"]DELETE['"]/, 
  /method\s*!==\s*['"]GET['"]/, 
  /method\s*===\s*['"]POST['"]/, 
  /method\s*===\s*['"]PUT['"]/, 
  /method\s*===\s*['"]PATCH['"]/, 
];
const failures = [];

function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full);
    else if (entry.isFile() && entry.name.endsWith('.ts')) {
      const source = fs.readFileSync(full, 'utf8');
      for (const pattern of forbidden) {
        if (pattern.test(source)) failures.push(path.relative(path.resolve(__dirname, '../..'), full));
      }
    }
  }
}
for (const root of roots) walk(root);

if (failures.length) {
  console.error(`Phase 1310 FAIL ${failures.length}`);
  for (const failure of [...new Set(failures)]) console.error(`- ${failure}`);
  process.exit(1);
}
console.log('Phase 1310 PASS');
console.log('- downstream SDK/React/CLI generator surfaces contain no HTTP-method semantic classifier');
console.log('- schema fallback consumes closed upstream schemaRole; no hookKind-to-schema reclassification');
