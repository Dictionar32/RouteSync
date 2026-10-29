'use strict';
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const read = relative => fs.readFileSync(path.join(root, relative), 'utf8');
const serializer = read('packages/cli/src/generators/ManifestSerializer.ts');
const generator = read('packages/cli/src/generators/ManifestGenerator.ts');
const generatorBarrel = read('packages/cli/src/generators/index.ts');
const cliBarrel = read('packages/cli/src/index.ts');
const collections = path.join(root, 'packages/core/src/types/upstream/collections.ts');
const pkg = JSON.parse(read('package.json'));
const checks = [
  ['serialization is an explicit complete/rejected ADT', /ManifestSerializationCompleteJudgment/.test(serializer) && /ManifestSerializationRejectedJudgment/.test(serializer) && /ManifestSerializationJudgment\s*=\s*\| ManifestSerializationCompleteJudgment\s*\| ManifestSerializationRejectedJudgment/.test(serializer)],
  ['each terminal exposes typed domain continuation', /interface ManifestSerializationCompleteJudgment[\s\S]*continueWith:/.test(serializer) && /interface ManifestSerializationRejectedJudgment[\s\S]*continueWith:/.test(serializer)],
  ['producer binds complete and rejected continuations to the judgment', /continueWith: handlers => handlers\.onComplete\(judgment\)/.test(serializer) && /continueWith: handlers => handlers\.onRejected\(judgment\)/.test(serializer)],
  ['serialization runtime remains interface-first and frozen', /export const manifestSerializationOperations:\s*ManifestSerializationOperationsInterface\s*=\s*Object\.freeze/.test(serializer)],
  ['serializer creates outcomes through typed terminal constructors', /return serializationComplete\(serialized\)/.test(serializer) && /return serializationRejected\(/.test(serializer)],
  ['persistence consumes serialization through continuation, not kind switch', /serialization\.continueWith<Promise<ManifestPersistenceJudgment>>\(/.test(generator) && !/switch\s*\(serialization\.kind\)/.test(generator)],
  ['serialization rejection remains distinct from write rejection', /manifest_persistence_serialization_rejected/.test(generator) && /manifest_persistence_write_rejected/.test(generator)],
  ['complete serialization directly owns the persistence continuation', /onComplete:\s*async judgment =>[\s\S]*fs\.writeJson\(outputPath, mergedManifest/.test(generator)],
  ['public barrels expose the ADT terminal and handler contracts', /ManifestSerializationCompleteJudgment/.test(generatorBarrel) && /ManifestSerializationRejectedJudgment/.test(generatorBarrel) && /ManifestSerializationHandlers/.test(cliBarrel)],
  ['upstream collections remains empty', fs.statSync(collections).size === 0],
  ['phase audit is registered in package scripts', pkg.scripts?.['audit:phase2849-manifest-serialization-continuations'] === 'node scripts/audits/audit-phase2849-manifest-serialization-continuations.cjs'],
];
let failed = false;
for (const [name, ok] of checks) { console.log(`${ok ? 'PASS' : 'FAIL'} ${name}`); if (!ok) failed = true; }
console.log(`Phase 2849 manifest serialization continuations audit: ${checks.filter(([, ok]) => ok).length}/${checks.length}`);
console.log('SCOPE: structural source assertions only; not a TypeScript build or end-to-end scan.');
if (failed) process.exitCode = 1;
