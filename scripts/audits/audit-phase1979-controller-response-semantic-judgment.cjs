const fs = require('node:fs');
const path = require('node:path');
const root = process.cwd();
const judgmentPath = path.join(root, 'packages/core/src/types/upstream/laravelControllerResponseSemanticJudgmentInterface.ts');
const retirementPath = path.join(root, 'packages/core/src/types/upstream/laravelSubscannerRetirementInterface.ts');
const scannerPath = path.join(root, 'packages/core/src/types/upstream/laravelControllerScannerInterface.ts');
const barrelPath = path.join(root, 'packages/core/src/index.ts');
const judgment = fs.readFileSync(judgmentPath, 'utf8');
const retirement = fs.readFileSync(retirementPath, 'utf8');
const scanner = fs.readFileSync(scannerPath, 'utf8');
const barrel = fs.readFileSync(barrelPath, 'utf8');
const checks = [
  ['response semantic product is a closed ADT', judgment.includes('export type LaravelControllerResponseSemanticProduct =') && ['object_response', 'model_response', 'resource_response', 'void_response'].every(kind => judgment.includes(`kind: '${kind}'`))],
  ['response judgment preserves not-connected outcome', judgment.includes("kind: 'controller_response_invocation_not_connected'") && judgment.includes("php_source_invocation_integration_not_connected")],
  ['response judgment preserves source-binding rejection', judgment.includes("kind: 'controller_response_source_binding_rejected'") && judgment.includes("php_source_invocation_integration_source_binding_rejected")],
  ['response judgment preserves invocation-blocked outcome', judgment.includes("kind: 'controller_response_invocation_blocked'") && judgment.includes("php_source_invocation_integration_blocked")],
  ['response complete and response blocked remain distinct', judgment.includes("kind: 'controller_response_complete'") && judgment.includes("kind: 'controller_response_blocked'")],
  ['response judgment retains exact canonical invocation judgment', judgment.includes('readonly invocationJudgment: InvocationOutcome<')],
  ['response contract marks source binding as authority-validated', judgment.includes('existing-source-identity-authority')],
  ['response interface file contains no runtime implementation', !/^\s*(?:export\s+)?(?:const|function|class|enum)\s/m.test(judgment)],
  ['retirement contract schema is version 6', retirement.includes('readonly version: 6;')],
  ['retirement map points response modules at response judgment', ['response-attribute-evidence', 'response-shape-evidence', 'response-dto-evidence'].every(kind => retirement.includes(`kind: '${kind}'`) && retirement.includes("targetContract: 'LaravelControllerResponseSemanticJudgment'"))],
  ['public barrel exports the type-only response contract', barrel.includes("export type { LaravelControllerResponseSemanticBlocker, LaravelControllerResponseSemanticEvidence, LaravelControllerResponseSemanticJudgment, LaravelControllerResponseSemanticJudgmentContract, LaravelControllerResponseSemanticProduct } from './types/upstream/laravelControllerResponseSemanticJudgmentInterface';")],
  ['scanner contract still accepts the authority-closed inventory', scanner.includes('LaravelControllerInvocationSemanticJudgmentInventoryClosureReceipt')],
  ['no relation/foundation replacement layer is introduced', !judgment.includes('semantic/relations') && !judgment.includes('semantic/foundation') && !judgment.includes('subscanners/relation') && !judgment.includes('subscanners/foundation')],
];
const report = {
  phase: 1979,
  title: 'Controller response semantic judgment — interface first',
  scope: 'type/interface declarations only; runtime, executor, scanner wiring, and legacy subscanner files untouched',
  checks: checks.map(([name, passed]) => ({ name, passed })),
  passed: checks.filter(([, passed]) => passed).length,
  total: checks.length,
};
process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
if (report.passed !== report.total) process.exitCode = 1;
