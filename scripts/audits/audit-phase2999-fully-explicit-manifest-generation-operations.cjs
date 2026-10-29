#!/usr/bin/env node
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const read = relative => fs.readFileSync(path.join(root, relative), 'utf8');
const checks = [
  ['generation complete/rejected judgments expose continueWith', () => /ManifestGenerationCompleteJudgment[\s\S]*?continueWith/.test(read('packages/cli/src/generators/ManifestGenerator.ts')) && /ManifestGenerationRejectedJudgment[\s\S]*?continueWith/.test(read('packages/cli/src/generators/ManifestGenerator.ts'))],
  ['generation judgment factory is interface typed and frozen', () => /manifestGenerationJudgmentFactory:\s*ManifestGenerationJudgmentFactoryInterface\s*=\s*Object\.freeze/.test(read('packages/cli/src/generators/ManifestGenerator.ts'))],
  ['contract projection has domain operation interface', () => /manifestContractsFromRoutesOperation:\s*ManifestContractsFromRoutesOperationInterface\s*=\s*Object\.freeze/.test(read('packages/cli/src/generators/ManifestGenerator.ts'))],
  ['runtime generation operation is interface typed and frozen', () => /manifestRuntimeGenerationOperation:\s*ManifestRuntimeGenerationOperationInterface\s*=\s*Object\.freeze/.test(read('packages/cli/src/generators/ManifestGenerator.ts'))],
  ['from-options operation delegates to runtime generation', () => /manifestGenerationFromOptionsOperation[\s\S]*?manifestRuntimeGenerationOperation\.generate/.test(read('packages/cli/src/generators/ManifestGenerator.ts'))],
  ['persistence operation is interface typed and frozen', () => /manifestRuntimePersistenceOperation:\s*ManifestRuntimePersistenceOperationInterface\s*=\s*Object\.freeze/.test(read('packages/cli/src/generators/ManifestGenerator.ts'))],
  ['persistence follows validation ADT continuation, not kind dispatch', () => /const validation = manifestContractValidationOperations\.validate\(manifest\);[\s\S]*?return validation\.continueWith/.test(read('packages/cli/src/generators/ManifestGenerator.ts')) && !/if\s*\(validation\.kind/.test(read('packages/cli/src/generators/ManifestGenerator.ts'))],
  ['persistence follows serialization ADT continuation', () => /manifestSerializationOperations\.serialize\(judgment\.manifest\)[\s\S]*?serialization\.continueWith/.test(read('packages/cli/src/generators/ManifestGenerator.ts'))],
  ['public generator delegates to typed operations', () => /manifestGeneratorOperations:\s*ManifestGeneratorOperationsInterface\s*=\s*Object\.freeze\([\s\S]*?manifestRuntimeGenerationOperation\.generate[\s\S]*?manifestGenerationFromOptionsOperation\.generate[\s\S]*?manifestRuntimePersistenceOperation\.save/.test(read('packages/cli/src/generators/ManifestGenerator.ts'))],
  ['serializer preserves route binding evidence', () => /binding:\s*RouteSemanticFlow\['binding'\]/.test(read('packages/cli/src/generators/ManifestSerializer.ts')) && /binding:\s*route\.binding/.test(read('packages/cli/src/generators/ManifestSerializer.ts'))],
  ['new domain operations are re-exported by generator barrel', () => /manifestRuntimeGenerationOperation/.test(read('packages/cli/src/generators/index.ts')) && /ManifestGenerationJudgmentFactoryInterface/.test(read('packages/cli/src/generators/index.ts'))],
  ['upstream collections remains intentionally empty', () => read('packages/core/src/types/upstream/collections.ts').trim() === ''],
  ['removed relation foundation modules remain absent', () => ['packages/core/src/semantic/relations/relationMembership.ts','packages/core/src/semantic/relations/relationalSequence.ts','packages/core/src/semantic/relations/semanticRelations.ts'].every(file => !fs.existsSync(path.join(root, file)))],
  ['no export function in traced runtime files', () => ['packages/core/src/compiler/scanner/upstream/routeDeclarationComposition.ts','packages/core/src/compiler/scanner/wiring/routeManifestLowerer.ts','packages/cli/src/generators/ManifestGenerator.ts','packages/cli/src/generators/ManifestSerializer.ts'].every(file => !/\bexport\s+function\b/.test(read(file)))],
];
let passed = 0;
for (const [name, run] of checks) {
  let ok = false;
  try { ok = Boolean(run()); } catch {}
  process.stdout.write(`${ok ? 'PASS' : 'FAIL'} ${name}\n`);
  if (ok) passed += 1;
}
process.stdout.write(`RESULT ${passed}/${checks.length}\n`);
if (passed !== checks.length) process.exitCode = 1;
