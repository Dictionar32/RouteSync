const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const responsePath = path.join(root, 'packages/core/src/types/upstream/laravelControllerResponseSemanticJudgmentInterface.ts');
const scannerPath = path.join(root, 'packages/core/src/types/upstream/laravelControllerScannerInterface.ts');
const indexPath = path.join(root, 'packages/core/src/index.ts');
const wiringPath = path.join(root, 'packages/core/src/compiler/scanner/wiring/laravelControllerScanner.ts');
const response = fs.readFileSync(responsePath, 'utf8');
const scanner = fs.readFileSync(scannerPath, 'utf8');
const index = fs.readFileSync(indexPath, 'utf8');
const wiring = fs.readFileSync(wiringPath, 'utf8');
const checks = [
  ['pipeline interface exists', response.includes('export interface LaravelControllerResponseSemanticPipelineInterface')],
  ['pipeline is composition, not semantic classifier', response.includes('readonly evidenceProduction: LaravelControllerResponseEvidenceProductionInterface;') && response.includes('readonly evidenceSourceBinding: LaravelControllerResponseEvidenceSourceBindingAuthorityInterface;') && response.includes('readonly responseExecutor: LaravelControllerResponseSemanticRuntimeExecutorInterface;')],
  ['existing identity authority remains owner', response.includes("readonly identityOwner: 'LaravelSourceIdentitySemanticsInterface';")],
  ['source correlation order is closed and explicit', response.includes('invocation-judgment-and-declaration-source-to-identity-judgment-to-success-correlation-receipt-before-evidence-production')],
  ['rejected source binding cannot become complete', response.includes('rejected-source-binding-cannot-be-converted-to-a-complete-response-judgment')],
  ['no replacement subscanner layer is permitted', response.includes('without-adding-relation-or-foundation-operations-or-a-parallel-semantic-authority')],
  ['scanner interface requires pipeline dependency', scanner.includes('readonly responseSemanticPipeline: LaravelControllerResponseSemanticPipelineInterface;')],
  ['scanner interface version advanced', scanner.includes('readonly contractVersion: 20;')],
  ['pipeline interface publicly exported', index.includes('LaravelControllerResponseSemanticPipelineInterface') && index.includes('LaravelControllerResponseSemanticPipelineContract')],
  ['runtime wiring remains honestly marked as not integrated', !wiring.includes('responseSemanticPipeline') && wiring.includes('responseJudgment') === false],
  ['no new relation/foundation subscanner added', !fs.existsSync(path.join(root, 'packages/core/src/compiler/scanner/operations/controller/responseSemanticPipeline.ts')) && !fs.existsSync(path.join(root, 'packages/core/src/compiler/scanner/operations/controller/responseSemanticAuthority.ts'))],
];
for (const [label, pass] of checks) process.stdout.write(`${pass ? 'PASS' : 'FAIL'} ${label}\n`);
const failed = checks.filter(([, pass]) => !pass);
process.stdout.write(`RESULT ${checks.length - failed.length}/${checks.length}\n`);
process.exitCode = failed.length === 0 ? 0 : 1;
