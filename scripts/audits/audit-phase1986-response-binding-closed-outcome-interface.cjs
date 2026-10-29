const fs = require('node:fs');
const path = require('node:path');
const root = process.cwd();
const responsePath = path.join(root, 'packages/core/src/types/upstream/laravelControllerResponseSemanticJudgmentInterface.ts');
const scannerPath = path.join(root, 'packages/core/src/types/upstream/laravelControllerScannerInterface.ts');
const wiringPath = path.join(root, 'packages/core/src/types/upstream/laravelControllerInvocationResponseWiringInterface.ts');
const retirementPath = path.join(root, 'packages/core/src/types/upstream/laravelSubscannerRetirementInterface.ts');
const barrelPath = path.join(root, 'packages/core/src/index.ts');
const response = fs.readFileSync(responsePath, 'utf8');
const scanner = fs.readFileSync(scannerPath, 'utf8');
const wiring = fs.readFileSync(wiringPath, 'utf8');
const retirement = fs.readFileSync(retirementPath, 'utf8');
const barrel = fs.readFileSync(barrelPath, 'utf8');
const checks = [
  ['each evidence binding is an explicit same-source/different-source ADT', response.includes("kind: 'response_evidence_same_source'") && response.includes("kind: 'response_evidence_different_source'")],
  ['complete source-binding receipt requires a non-empty tuple', /controller_response_evidence_source_binding_complete[\s\S]*?evidence: readonly \[\s*LaravelControllerResponseEvidenceSameSourceEntry/.test(response)],
  ['rejected source-binding receipt requires at least one different-source entry and preserves remaining entries', /controller_response_evidence_source_binding_rejected[\s\S]*?evidence: readonly \[\s*LaravelControllerResponseEvidenceDifferentSourceEntry[\s\S]*?LaravelControllerResponseEvidenceSourceBindingEntry/.test(response)],
  ['receipt declares exact evidence coverage with no omissions or duplicates', response.includes("every-response-evidence-item-is-represented-exactly-once-with-no-omissions-or-duplicates")],
  ['authority result is indexed by the exact input binding outcome', response.includes('LaravelControllerResponseSemanticJudgmentForBinding') && response.includes('LaravelControllerResponseSemanticJudgmentFromInput<Input>')],
  ['rejected evidence binding has a dedicated judgment retaining invocation and receipt', response.includes('LaravelControllerResponseEvidenceSourceBindingRejectedJudgment') && response.includes('readonly sourceBindingJudgment: Extract<')],
  ['controller artifact ADT can carry the evidence-binding rejected judgment for each matching invocation outcome', (scanner.match(/LaravelControllerResponseEvidenceSourceBindingRejectedJudgment<LaravelControllerInvocationOutcome/g) || []).length === 4],
  ['wiring forwards the artifact-owned response judgment without rebuilding or intersecting another classification', wiring.includes("readonly responseJudgment: Artifact['responseJudgment'];")],
  ['response source identity remains owned by the existing semantics interface', response.includes("readonly owner: 'LaravelSourceIdentitySemanticsInterface'") && response.includes('readonly sourceIdentitySemantics: LaravelSourceIdentitySemanticsInterface')],
  ['public barrel exports the new type-only contract', barrel.includes('LaravelControllerResponseEvidenceSourceBindingEntry') && barrel.includes('LaravelControllerResponseEvidenceSourceBindingRejectedJudgment') && barrel.includes('LaravelControllerResponseSemanticJudgmentFromInput')],
  ['retirement contract version advanced', retirement.includes('readonly version: 13;')],
  ['no relation/foundation replacement layer is introduced', !response.includes('operations/relation') && !response.includes('operations/foundation') && !retirement.includes('operations/relation') && !retirement.includes('operations/foundation')],
  ['response contract module remains declarations only', !/^\s*(?:export\s+)?const\s/m.test(response) && !/^\s*(?:export\s+)?function\s/m.test(response)],
];
const report = { phase: 1986, title: 'Response evidence binding closed outcome interface', scope: 'interface/type declarations only; runtime and wiring implementations untouched', checks: checks.map(([name, passed]) => ({ name, passed })), passed: checks.filter(([, passed]) => passed).length, total: checks.length };
process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
if (report.passed !== report.total) process.exitCode = 1;
