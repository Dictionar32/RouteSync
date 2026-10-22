const fs = require('node:fs');
const path = require('node:path');
const root = process.cwd();
const responsePath = path.join(root, 'packages/core/src/types/upstream/laravelControllerResponseSemanticJudgmentInterface.ts');
const scannerPath = path.join(root, 'packages/core/src/types/upstream/laravelControllerScannerInterface.ts');
const runtimePath = path.join(root, 'packages/core/src/compiler/scanner/wiring/laravelControllerScanner.ts');
const response = fs.readFileSync(responsePath, 'utf8');
const scannerContract = fs.readFileSync(scannerPath, 'utf8');
const runtime = fs.readFileSync(runtimePath, 'utf8');
const checks = [
  ['response pipeline composes the existing AST projection authority', /readonly astProjection:\s*LaravelControllerAstProjectionSemanticAuthorityInterface/.test(response)],
  ['pipeline contract version advanced to 2', /interface LaravelControllerResponseSemanticPipelineInterface[\s\S]*?readonly contractVersion: 2;/.test(response)],
  ['AST projection ownership is explicit', /readonly astProjectionOwner:\s*'LaravelControllerAstProjectionSemanticAuthorityInterface'/.test(response)],
  ['AST projection ordering follows the closed response judgment', /readonly astProjectionOrder:/.test(response)],
  ['projection does not become a replacement semantic layer', /readonly projectionBoundaryRule:/.test(response)],
  ['existing identity authority remains owner', /readonly identityOwner:\s*'LaravelSourceIdentitySemanticsInterface'/.test(response)],
  ['existing response executor remains owner', /readonly executionOwner:\s*'LaravelControllerResponseSemanticRuntimeExecutorInterface'/.test(response)],
  ['scanner interface remains explicit about pipeline dependency', /readonly responseSemanticPipeline:\s*LaravelControllerResponseSemanticPipelineInterface/.test(scannerContract)],
  ['scanner interface version advanced for contract change', /readonly contractVersion: 21;/.test(scannerContract)],
  ['legacy runtime still not wired to the response pipeline (honest frontier)', !/responseSemanticPipeline/.test(runtime)],
  ['legacy runtime still omits response judgment (honest frontier)', /invocationJudgment:\s*produced\.invocationJudgment,\s*\}\);/.test(runtime) && !/responseJudgment:\s*produced\./.test(runtime)],
];
const failed = checks.filter(([, pass]) => !pass);
for (const [label, pass] of checks) process.stdout.write(`${pass ? 'PASS' : 'FAIL'} ${label}\n`);
process.stdout.write(`\n${checks.length - failed.length}/${checks.length} checks passed\n`);
if (failed.length) process.exitCode = 1;
