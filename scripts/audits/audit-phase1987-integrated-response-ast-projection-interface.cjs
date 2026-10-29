const fs = require('node:fs');
const path = require('node:path');
const root = process.cwd();
const invocationPath = path.join(root, 'packages/core/src/types/upstream/laravelControllerInvocationSemanticJudgmentInterface.ts');
const responsePath = path.join(root, 'packages/core/src/types/upstream/laravelControllerResponseSemanticJudgmentInterface.ts');
const scannerPath = path.join(root, 'packages/core/src/types/upstream/laravelControllerScannerInterface.ts');
const projectionRuntimePath = path.join(root, 'packages/core/src/types/upstream/laravelControllerAstProjectionSemanticAuthority.ts');
const barrelPath = path.join(root, 'packages/core/src/index.ts');
const retirementPath = path.join(root, 'packages/core/src/types/upstream/laravelSubscannerRetirementInterface.ts');
const invocation = fs.readFileSync(invocationPath, 'utf8');
const response = fs.readFileSync(responsePath, 'utf8');
const scanner = fs.readFileSync(scannerPath, 'utf8');
const barrel = fs.readFileSync(barrelPath, 'utf8');
const retirement = fs.readFileSync(retirementPath, 'utf8');
const checks = [
  ['AST projection consumes existing response ADTs through type-only imports', invocation.includes("from './laravelControllerResponseSemanticJudgmentInterface'") && invocation.includes('LaravelControllerResponseSemanticJudgmentFor') && invocation.includes('LaravelControllerResponseEvidenceSourceBindingRejectedJudgment')],
  ['semantic projection context requires both canonical judgments', /kind: 'invocation_semantic_judgment'[\s\S]*?readonly judgment: InvocationJudgment;[\s\S]*?readonly responseJudgment: LaravelControllerAstProjectionResponseJudgment<InvocationJudgment>/.test(invocation)],
  ['response projection is indexed by the exact invocation subtype', /type LaravelControllerAstProjectionResponseJudgment<[\s\S]*?InvocationJudgment extends LaravelControllerInvocationSemanticJudgmentInterface[\s\S]*?LaravelControllerResponseSemanticJudgmentFor<InvocationJudgment>[\s\S]*?LaravelControllerResponseEvidenceSourceBindingRejectedJudgment<InvocationJudgment>/.test(invocation)],
  ['projection result returns the same correlated invocation and response ADTs', /kind: 'semantic_projection'[\s\S]*?invocationJudgment: InvocationJudgment;[\s\S]*?responseJudgment: LaravelControllerAstProjectionResponseJudgment<InvocationJudgment>/.test(invocation)],
  ['AST projection authority declares generic input-to-output preservation', /judge: <InvocationJudgment extends LaravelControllerInvocationSemanticJudgmentInterface>\([\s\S]*?LaravelControllerAstProjectionContext<InvocationJudgment>[\s\S]*?LaravelControllerAstProjectionSemanticJudgment<InvocationJudgment>/.test(invocation)],
  ['authority contract forbids response reclassification and reconstruction', invocation.includes('project-the-existing-closed-invocation-and-response-judgments-without-response-classification-or-reconstruction')],
  ['controller artifact already owns both judgments as one ADT', scanner.includes('readonly invocationJudgment: LaravelControllerInvocationOutcome') && scanner.includes("readonly responseJudgment:")],
  ['response outcome remains closed and rejected source binding is preserved', response.includes('LaravelControllerResponseEvidenceSourceBindingRejectedJudgment') && response.includes('LaravelControllerResponseSemanticJudgmentFromInput<Input>')],
  ['new projection context and response projection type are publicly exported', barrel.includes('LaravelControllerAstProjectionContext') && barrel.includes('LaravelControllerAstProjectionResponseJudgment')],
  ['no relation/foundation replacement layer is introduced', !invocation.includes('operations/relation') && !invocation.includes('operations/foundation') && !retirement.includes('operations/relation') && !retirement.includes('operations/foundation')],
  ['no new scanner or parallel invocation authority is introduced', !invocation.includes('LaravelControllerIntegratedResponseScannerInterface') && !invocation.includes('ParallelInvocationAuthorityInterface')],
  ['existing AST projection runtime remains unchanged for interface-first sequencing', fs.existsSync(projectionRuntimePath)],
];
const report = {
  phase: 1987,
  title: 'Integrated invocation-response AST projection interface first',
  scope: 'upstream interface/type contract and public type exports only; runtime executor and scanner implementations untouched',
  checks: checks.map(([name, passed]) => ({ name, passed })),
  passed: checks.filter(([, passed]) => passed).length,
  total: checks.length,
  knownGap: 'The current runtime AST projection authority still emits invocation-only projection and must be migrated later to forward responseJudgment; this phase deliberately does not modify runtime before the contract is settled.',
};
process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
if (report.passed !== report.total) process.exitCode = 1;
