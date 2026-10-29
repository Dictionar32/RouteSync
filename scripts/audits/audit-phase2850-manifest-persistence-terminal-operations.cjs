'use strict';
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const read = relative => fs.readFileSync(path.join(root, relative), 'utf8');
const generator = read('packages/cli/src/generators/ManifestGenerator.ts');
const serializer = read('packages/cli/src/generators/ManifestSerializer.ts');
const validator = read('packages/cli/src/generators/ManifestContractValidator.ts');
const scan = read('packages/cli/src/commands/scan.ts');
const sync = read('packages/cli/src/commands/sync.ts');
const collections = path.join(root, 'packages/core/src/types/upstream/collections.ts');
const pkg = JSON.parse(read('package.json'));
const checks = [
  ['persistence terminal ADT has four explicit typed variants', /interface ManifestPersistenceCompleteJudgment/.test(generator) && /interface ManifestPersistenceContractRejectedJudgment/.test(generator) && /interface ManifestPersistenceSerializationRejectedJudgment/.test(generator) && /interface ManifestPersistenceWriteRejectedJudgment/.test(generator)],
  ['each persistence terminal exposes domain continuation', (generator.match(/readonly continueWith: <Result>\(handlers: ManifestPersistenceHandlers<Result>\) => Result/g) || []).length === 4],
  ['terminal constructors bind continuations to matching handler', /handlers\.onComplete\(judgment\)/.test(generator) && /handlers\.onContractRejected\(judgment\)/.test(generator) && /handlers\.onSerializationRejected\(judgment\)/.test(generator) && /handlers\.onWriteRejected\(judgment\)/.test(generator)],
  ['persistence runtime constructs outcomes through terminal constructors', /return persistenceComplete\(outputPath\)/.test(generator) && /persistenceContractRejected\(judgment\.violations\)/.test(generator) && /persistenceSerializationRejected\(judgment\.message\)/.test(generator) && /return persistenceWriteRejected\(/.test(generator)],
  ['scan command consumes persistence through continuation', /persistenceJudgment\.continueWith\(/.test(scan) && !/switch\s*\(persistenceJudgment\.kind\)/.test(scan)],
  ['sync command consumes persistence through continuation', /persistenceJudgment\.continueWith\(/.test(sync) && !/switch\s*\(persistenceJudgment\.kind\)/.test(sync)],
  ['serialization helper declarations are const-bound typed operations', /const serializeRoute:\s*\(route: RouteSemanticFlow\) => SerializableManifestRoute/.test(serializer) && /const serializeContract:\s*\(contract: EndpointContract\) => SerializableManifestContract/.test(serializer) && !/function\s+serialize(Route|Contract)\s*\(/.test(serializer)],
  ['validator helper declarations are const-bound typed operations', /const requireValue:\s*\(value: unknown, label: string\) => void/.test(validator) && /const validateResponse:\s*\(/.test(validator) && !/function\s+(requireValue|validateResponse)\s*\(/.test(validator)],
  ['persistence terminal contracts are exported from public barrels', /ManifestPersistenceHandlers/.test(read('packages/cli/src/generators/index.ts')) && /ManifestPersistenceWriteRejectedJudgment/.test(read('packages/cli/src/index.ts'))],
  ['upstream collections remains empty', fs.statSync(collections).size === 0],
  ['phase audit is registered in package scripts', pkg.scripts?.['audit:phase2850-manifest-persistence-terminal-operations'] === 'node scripts/audits/audit-phase2850-manifest-persistence-terminal-operations.cjs'],
];
let failed = false;
for (const [name, ok] of checks) { console.log(`${ok ? 'PASS' : 'FAIL'} ${name}`); if (!ok) failed = true; }
console.log(`Phase 2850 manifest persistence terminal operations audit: ${checks.filter(([, ok]) => ok).length}/${checks.length}`);
console.log('SCOPE: structural source assertions only; not a TypeScript build or end-to-end scan.');
if (failed) process.exitCode = 1;
