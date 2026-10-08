const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '../../packages/core/src/types/interfaces');
const files = fs.readdirSync(root).filter((file) => file.endsWith('.ts'));
const failures = [];

for (const file of files) {
  const source = fs.readFileSync(path.join(root, file), 'utf8');
  const hasRuntimeExport = /export\s+(?:async\s+)?function\s+|export\s+const\s+\w+\s*=/.test(source);
  if (file === 'interfaceComposition.ts') continue;
  if (hasRuntimeExport) failures.push(file);
  if (/\b(?:infer|derive|resolve|classif(?:y|ication)|reason)\w*\s*\(/i.test(source)) {
    failures.push(`${file}:semantic-operation-token`);
  }
}

const operationCapability = path.resolve(__dirname, '../../packages/core/src/types/upstream/operationIdentityCapability.ts');
const capabilitySource = fs.readFileSync(operationCapability, 'utf8');
if (/export\s+(?:async\s+)?function\s+|export\s+const\s+\w+\s*=/.test(capabilitySource)) {
  failures.push('upstream/operationIdentityCapability.ts:runtime-implementation');
}

if (failures.length) {
  console.error(`Phase 1309 FAIL ${failures.length}`);
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log('Phase 1309 PASS 2/2');
console.log('- interface algebra is type-only (except explicit composition wiring)');
console.log('- operation identity capability contract is type-only; implementation lives in upstream authority');
