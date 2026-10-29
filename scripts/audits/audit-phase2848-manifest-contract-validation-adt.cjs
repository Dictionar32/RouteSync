'use strict';
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const read = relative => fs.readFileSync(path.join(root, relative), 'utf8');
const validator = read('packages/cli/src/generators/ManifestContractValidator.ts');
const scan = read('packages/cli/src/commands/scan.ts');
const generator = read('packages/cli/src/generators/ManifestGenerator.ts');
const generatorBarrel = read('packages/cli/src/generators/index.ts');
const cliBarrel = read('packages/cli/src/index.ts');
const collections = path.join(root, 'packages/core/src/types/upstream/collections.ts');
const pkg = JSON.parse(read('package.json'));
const checks = [
  ['validation outcome remains a closed validated/rejected ADT', /ManifestContractValidatedJudgment/.test(validator) && /ManifestContractRejectedJudgment/.test(validator) && /ManifestContractValidationJudgment\s*=\s*\| ManifestContractValidatedJudgment\s*\| ManifestContractRejectedJudgment/.test(validator)],
  ['both terminal ADT arms own typed continuation operations', /interface ManifestContractValidatedJudgment[\s\S]*continueWith:/.test(validator) && /interface ManifestContractRejectedJudgment[\s\S]*continueWith:/.test(validator)],
  ['producer binds validated and rejected continuation closures', /continueWith: handlers => handlers\.onValidated\(judgment\)/.test(validator) && /continueWith: handlers => handlers\.onRejected\(judgment\)/.test(validator)],
  ['validation runtime remains interface-first and frozen', /export const manifestContractValidationOperations:\s*ManifestContractValidationOperationsInterface\s*=\s*Object\.freeze/.test(validator)],
  ['scan command consumes validation ADT through continueWith', /manifestContractValidationOperations\.validate\(resolvedManifest\)\.continueWith\(/.test(scan) && !/switch\s*\(manifestContractJudgment\.kind\)/.test(scan)],
  ['scan command preserves explicit rejection violations', /onRejected:\s*judgment => judgment\.violations/.test(scan) && /manifestContractRejection !== undefined/.test(scan)],
  ['persistence pipeline consumes validation ADT through domain continuation', /manifestContractValidationOperations\.validate\(manifest\)\.continueWith\(/.test(generator) && !/switch\s*\(validation\.kind\)/.test(generator)],
  ['persistence rejection remains distinct from validated manifest', /manifest_persistence_contract_rejected/.test(generator) && /manifest_contract_validation_complete/.test(generator)],
  ['public barrels expose the new ADT and handler contracts', /ManifestContractValidationHandlers/.test(generatorBarrel) && /ManifestContractValidatedJudgment/.test(generatorBarrel) && /ManifestContractRejectedJudgment/.test(cliBarrel)],
  ['upstream collections remains empty', fs.statSync(collections).size === 0],
  ['phase audit is registered in package scripts', pkg.scripts?.['audit:phase2848-manifest-contract-validation-adt'] === 'node scripts/audits/audit-phase2848-manifest-contract-validation-adt.cjs'],
];
let failed = false;
for (const [name, ok] of checks) { console.log(`${ok ? 'PASS' : 'FAIL'} ${name}`); if (!ok) failed = true; }
console.log(`Phase 2848 manifest contract validation ADT audit: ${checks.filter(([, ok]) => ok).length}/${checks.length}`);
console.log('SCOPE: structural source assertions only; not a TypeScript build or end-to-end scan.');
if (failed) process.exitCode = 1;
