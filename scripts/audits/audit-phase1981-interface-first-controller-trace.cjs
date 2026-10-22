const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const contractPath = path.join(root, 'packages/core/src/types/upstream/laravelSubscannerRetirementInterface.ts');
const barrelPath = path.join(root, 'packages/core/src/index.ts');
const scannerPath = path.join(root, 'packages/core/src/types/upstream/laravelControllerScannerInterface.ts');
const responsePath = path.join(root, 'packages/core/src/types/upstream/laravelControllerResponseSemanticJudgmentInterface.ts');
const astPath = path.join(root, 'packages/core/src/types/upstream/laravelSourceAstPipelineInterface.ts');
const contract = fs.readFileSync(contractPath, 'utf8');
const barrel = fs.readFileSync(barrelPath, 'utf8');
const scanner = fs.readFileSync(scannerPath, 'utf8');
const response = fs.readFileSync(responsePath, 'utf8');
const ast = fs.readFileSync(astPath, 'utf8');
const checks = [
  ['invocation-response-AST contract map exists', contract.includes('interface LaravelControllerInvocationResponseAstContractMap')],
  ['interface-first contract exists', contract.includes('interface LaravelControllerSubscannerInterfaceFirstContract')],
  ['retirement contract advanced to version 8', contract.includes('readonly version: 8;')],
  ['invocation judgment remains canonical', contract.includes("readonly invocation: LaravelControllerInvocationSemanticJudgmentInterface")],
  ['response judgment remains a distinct product', contract.includes('readonly response: LaravelControllerResponseSemanticJudgment;')],
  ['controller artifact remains typed', contract.includes('readonly controllerArtifact: LaravelControllerScanArtifact;')],
  ['AST projection remains a closed judgment', contract.includes('readonly sourceAstProjection: LaravelSourceAstProjectionJudgment;')],
  ['executor cannot reconstruct or classify semantics', contract.includes('without-classification-or-reconstruction')],
  ['relation/foundation and replacement layers explicitly prohibited', contract.includes("'semantic/relations', 'semantic/foundation', 'replacement-subscanner', 'parallel-invocation-authority'")],
  ['public export is type-only', barrel.includes('export type { LaravelControllerInvocationResponseAstContractMap, LaravelControllerSubscannerInterfaceFirstContract')],
  ['controller artifact correlates invocation and response', scanner.includes('readonly invocationJudgment: LaravelControllerInvocationOutcome') && scanner.includes('readonly responseJudgment: LaravelControllerResponseSemanticJudgmentFor')],
  ['response judgment retains invocation outcome', response.includes('readonly invocationJudgment: InvocationJudgment')],
  ['AST projection retains complete/blocked ADT', ast.includes("kind: 'laravel_source_ast_projection_complete'") && ast.includes("kind: 'laravel_source_ast_projection_blocked'")],
];
const output = { phase: 1981, audit: 'interface-first-controller-trace', passed: checks.filter(([, ok]) => ok).length, total: checks.length, checks: checks.map(([name, ok]) => ({ name, status: ok ? 'PASS' : 'FAIL' })) };
fs.writeFileSync(path.join(root, 'PHASE1981_AUDIT.json'), JSON.stringify(output, null, 2) + '\n');
console.log(JSON.stringify(output, null, 2));
if (output.passed !== output.total) process.exitCode = 1;
