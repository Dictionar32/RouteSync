const fs = require('node:fs');
const path = require('node:path');
const root = process.cwd();
const responsePath = path.join(root, 'packages/core/src/types/upstream/laravelControllerResponseSemanticJudgmentInterface.ts');
const retirementPath = path.join(root, 'packages/core/src/types/upstream/laravelSubscannerRetirementInterface.ts');
const publicBarrelPath = path.join(root, 'packages/core/src/index.ts');
const upstreamBarrelPath = path.join(root, 'packages/core/src/types/upstream/index.ts');
const scannerPath = path.join(root, 'packages/core/src/compiler/scanner/wiring/laravelControllerScanner.ts');
const response = fs.readFileSync(responsePath, 'utf8');
const retirement = fs.readFileSync(retirementPath, 'utf8');
const publicBarrel = fs.readFileSync(publicBarrelPath, 'utf8');
const upstreamBarrel = fs.readFileSync(upstreamBarrelPath, 'utf8');
const scanner = fs.readFileSync(scannerPath, 'utf8');
const checks = [
  ['response judgment remains a closed discriminated ADT', response.includes("kind: 'controller_response_complete'") && response.includes("kind: 'controller_response_blocked'") && response.includes("kind: 'controller_response_source_binding_rejected'")],
  ['response evidence input is indexed by invocation source subject', response.includes('LaravelControllerResponseSemanticEvidenceForSource<Source extends SourceFile>') && response.includes("InvocationJudgment['sourceFile']")],
  ['response semantic authority has an explicit typed judgment operation', response.includes('export interface LaravelControllerResponseSemanticJudgmentAuthorityInterface') && response.includes('readonly judge:')],
  ['response runtime executor is declared as a delegation-only interface', response.includes('export interface LaravelControllerResponseSemanticRuntimeExecutorInterface') && response.includes('readonly execute:') && response.includes('classify response kinds') && response.includes('reconstruct provenance')],
  ['authority contract does not replace the PHP invocation authority', response.includes('does-not-replace-or-duplicate-the-PHP-invocation-semantic-authority')],
  ['existing source identity semantics is the declared identity owner', response.includes('LaravelSourceIdentitySemanticsInterface') && response.includes('sourceIdentitySemantics:')],
  ['retirement contract references the response authority and executor types', retirement.includes('responseSemanticAuthority: LaravelControllerResponseSemanticJudgmentAuthorityInterface') && retirement.includes('responseSemanticRuntimeExecutor: LaravelControllerResponseSemanticRuntimeExecutorInterface') && (retirement.match(/readonly owner: LaravelControllerResponseSemanticJudgmentAuthorityInterface;/g) || []).length === 3],
  ['response authority and executor are exported from the public type barrel', publicBarrel.includes('LaravelControllerResponseSemanticJudgmentAuthorityInterface') && publicBarrel.includes('LaravelControllerResponseSemanticRuntimeExecutorInterface')],
  ['response contracts are exported from the upstream barrel', upstreamBarrel.includes("export * from './laravelControllerResponseSemanticJudgmentInterface';")],
  ['new response contract file adds no relation/foundation dependency', !response.includes('semantic/relations') && !response.includes('semantic/foundation')],
  ['runtime scanner remains unmodified by this interface-only phase', !scanner.includes('responseJudgment:')],
  ['runtime mismatch is visible rather than falsely marked migrated', scanner.includes('invocationJudgment: produced.invocationJudgment') && !scanner.includes('responseJudgment:')],
];
const report = {
  phase: 1984,
  title: 'Response semantic authority and executor interface closure',
  scope: 'interface-only; no runtime/scanner/wiring implementation edits',
  checks: checks.map(([name, passed]) => ({ name, passed })),
  passed: checks.filter(([, passed]) => passed).length,
  total: checks.length,
  knownRuntimeGap: 'laravelControllerScanner.ts still emits an artifact without responseJudgment; this phase declares the missing upstream contract but does not claim runtime compatibility',
};
process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
if (report.passed !== report.total) process.exitCode = 1;
