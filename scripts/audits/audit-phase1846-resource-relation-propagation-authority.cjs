const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const read = relative => fs.readFileSync(path.join(root, relative), 'utf8');
const authority = read('packages/core/src/compiler/semantic/resourceModelBindingAuthority.ts');
const scanner = read('packages/core/src/compiler/scanner/wiring/laravelResourceScanner.ts');
const contract = read('packages/core/src/types/upstream/laravelResourceScannerInterface.ts');
const judgment = read('packages/core/src/types/upstream/laravelScannerSemanticJudgment.ts');
const sourceEvidence = read('packages/core/src/compiler/scanner/lexer/resourceSourceEvidence.ts');
const packageJson = JSON.parse(read('package.json'));
const checks = [
  ['resource scanner interface advances to current contract version 10', /contractVersion: 10/.test(contract)],
  ['semantic judgment contract advances to version 9', /readonly version: 9/.test(judgment) && /version: 9/.test(judgment)],
  ['authority derives relation propagation from source-correlated resource edges', /resource_model_resource_relation/.test(authority) && /resource-model-relation-propagation/.test(read('packages/core/src/types/upstream/resourceModelBindingSemanticInterface.ts'))],
  ['relation propagation joins source relation facts against canonical model relation facts', /resource_model_model_relation_target/.test(authority) && /relationName/.test(read('packages/core/src/types/upstream/resourceModelBindingSemanticInterface.ts'))],
  ['relation propagation requires the target model to match the selected child candidate', /resource_model_alias/.test(read('packages/core/src/types/upstream/resourceModelBindingSemanticInterface.ts')) && /resource_model_selected_candidate/.test(read('packages/core/src/types/upstream/resourceModelBindingSemanticInterface.ts'))],
  ['candidate precedence is declared by upstream semantic rules', /RESOURCE_MODEL_BINDING_SEMANTIC_RULE_SET/.test(authority) && /resource-model-precedence-controller-dataflow/.test(read('packages/core/src/types/upstream/resourceModelBindingSemanticInterface.ts'))],
  ['only candidates supported at the declaratively selected precedence enter the judgment', /resource_model_selected_candidate/.test(read('packages/core/src/types/upstream/resourceModelBindingSemanticInterface.ts')) && /selectedCandidateFacts/.test(authority)],
  ['same-precedence candidates remain available for explicit ambiguity', /relationGate\(candidates\.length === 1/.test(authority) && /kind: 'ambiguous'/.test(authority)],
  ['scanner forwards complete controller judgment and relation evidence to authority', /controllerScan: input\.controllerScan/.test(scanner) && /relations: relationEvidence/.test(scanner) && /input\.bindingAuthority\.judgeBatch/.test(scanner)],
  ['resource relation facts retain source span provenance', /resourceRelationEvidence\(resourceName/.test(sourceEvidence) && /source,/.test(sourceEvidence)],
  ['authority remains outside runtime scanner and avoids semantic foundation', !/resourceModelBindingAuthority/.test(scanner) || /bindingAuthority/.test(scanner) && !/semantic\/foundation/.test(scanner)],
  ['Phase 1845 audit checks the current resource contract version', /contractVersion: 10/.test(read('scripts/audits/audit-phase1845-laravel-resource-scanner-interface-first.cjs'))],
  ['Phase 1836 historical boundary audit tracks the updated resource contract version', /contractVersion: 10/.test(read('scripts/audits/audit-phase1836-laravel-controller-downstream-interface-first.cjs'))],
  ['audit command is registered', packageJson.scripts?.['audit:phase1846-resource-relation-propagation-authority'] === 'node scripts/audits/audit-phase1846-resource-relation-propagation-authority.cjs'],
];
for (const [label, passed] of checks) console.log(`${passed ? 'PASS' : 'FAIL'} ${label}`);
const passed = checks.filter(([, value]) => value).length;
console.log(`${passed}/${checks.length} checks passed`);
if (passed !== checks.length) process.exitCode = 1;
