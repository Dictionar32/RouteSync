const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const response = fs.readFileSync(path.join(root, 'packages/core/src/types/upstream/laravelControllerResponseSemanticJudgmentInterface.ts'), 'utf8');
const retirement = fs.readFileSync(path.join(root, 'packages/core/src/types/upstream/laravelSubscannerRetirementInterface.ts'), 'utf8');
const publicIndex = fs.readFileSync(path.join(root, 'packages/core/src/index.ts'), 'utf8');
const scanner = fs.readFileSync(path.join(root, 'packages/core/src/compiler/scanner/wiring/laravelControllerScanner.ts'), 'utf8');
const checks = [
  ['explicit empty evidence inventory ADT', /kind: 'response_evidence_inventory_empty'[\s\S]*?evidence: readonly \[\]/.test(response)],
  ['explicit non-empty evidence inventory ADT', /kind: 'response_evidence_inventory_present'[\s\S]*?evidence: readonly \[\s*LaravelControllerResponseSemanticEvidence,/.test(response)],
  ['empty input maps only to empty receipt', /controller_response_evidence_source_binding_empty/.test(response) && /LaravelControllerResponseEvidenceSourceBindingJudgmentFromInput/.test(response)],
  ['non-empty input permits complete or rejected receipt', /controller_response_evidence_source_binding_complete[\s\S]*?controller_response_evidence_source_binding_rejected/.test(response)],
  ['source-binding authority delegates to existing source identity semantics', /sourceIdentitySemantics: LaravelSourceIdentitySemanticsInterface/.test(response) && /readonly bind:/.test(response)],
  ['no parallel source identity owner introduced', /owner: 'LaravelSourceIdentitySemanticsInterface'/.test(response)],
  ['source-binding contract version advanced', /contractVersion: 4/.test(response)],
  ['contract explicitly states producer boundary', /producerBoundary: 'response-evidence-inventory-is-bound/.test(response)],
  ['response AST contract map includes evidence-binding stage', /readonly responseEvidenceBinding: LaravelControllerResponseEvidenceSourceBindingAuthorityInterface/.test(retirement)],
  ['subscanner contract names evidence-binding ownership', /responseEvidenceBindingOwner: 'LaravelControllerResponseEvidenceSourceBindingAuthorityInterface/.test(retirement)],
  ['public exports include binding authority and input ADT', /LaravelControllerResponseEvidenceSourceBindingAuthorityInterface/.test(publicIndex) && /LaravelControllerResponseEvidenceSourceBindingInput/.test(publicIndex)],
  ['runtime scanner intentionally remains unmodified and gap is visible', !/responseJudgment:\s*produced\./.test(scanner) && /responseJudgment/.test(fs.readFileSync(path.join(root, 'packages/core/src/types/upstream/laravelControllerScannerInterface.ts'), 'utf8'))],
  ['no semantic/foundation subscanner introduced', !fs.existsSync(path.join(root, 'packages/core/src/compiler/scanner/subscanners/semantic/foundation'))],
  ['no new relation/foundation layer in phase files', !/semantic\/(relations|foundation)/.test(response.slice(response.indexOf('export interface LaravelControllerResponseEvidenceSourceBindingAuthorityInterface')))],
];
const failures = checks.filter(([, passed]) => !passed);
for (const [name, passed] of checks) process.stdout.write(`${passed ? 'PASS' : 'FAIL'} ${name}\n`);
process.stdout.write(`PHASE1990_AUDIT ${checks.length - failures.length}/${checks.length}\n`);
if (failures.length) process.exitCode = 1;
