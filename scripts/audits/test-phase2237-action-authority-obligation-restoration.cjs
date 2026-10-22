const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const read = relative => fs.readFileSync(path.join(root, relative), 'utf8');
const contract = read('packages/core/src/types/upstream/laravelControllerActionSemanticJudgmentInterface.ts');
const wiring = read('packages/core/src/compiler/scanner/wiring/laravelControllerExecutionDependencies.ts');
const scanner = read('packages/core/src/compiler/scanner/wiring/laravelControllerScanner.ts');
const cli = read('packages/cli/src/parsers/php/controllerInvocationManifestComposition.ts');
const test = read('packages/core/src/types/upstream/__tests__/authority-interface-first-model.phase2211.test.ts');
const checks = [
  ['existing action contract advanced to version 36', contract.includes('readonly version: 36;') && wiring.includes('version: 36 as const')],
  ['partial coverage records body AST debt', contract.includes("kind: 'body_source_ast'") && contract.includes("targetOwner: 'source_evidence_projection_boundary'")],
  ['resource judgment and canonical publication are recognized as already owned upstream', !contract.includes("kind: 'resource_binding_aggregation'") && wiring.includes('controllerResourceBindingAuthority.publishResolved')],
  ['partial coverage records request adapter debt against existing authority', contract.includes("kind: 'request_binding_compatibility_adapter'") && contract.includes("targetOwner: 'source_evidence_projection_boundary'")],
  ['production action path explicitly remains open', !wiring.includes('scanControllerAction(') && wiring.includes('resolveControllerActionContract')],
  ['CLI composition keeps semantic judgment in core and inventory closure', cli.includes('analyzePhpSourceInvocationSemanticPipelineBatch') && cli.includes('laravelControllerInvocationSemanticJudgmentInventoryAuthority')],
  ['test records unresolved source projection and legacy derivation obligations', !test.includes("'resource_binding_aggregation'") && test.includes("'request_binding_compatibility_adapter'")],
  ['no foundation dependency introduced in touched action contract and wiring', !contract.includes('semantic/foundation') && !wiring.includes('semantic/foundation')],
  ['integrated response owner remains the existing pipeline', scanner.includes('LaravelControllerResponseSemanticPipelineInterface') && scanner.includes('laravelControllerResponseSemanticPipeline') && scanner.includes('judgeIntegratedResponse')],
];
for (const [name, passed] of checks) process.stdout.write(`${passed ? 'PASS' : 'FAIL'} ${name}\n`);
process.stdout.write(`RESULT ${checks.filter(([, passed]) => passed).length}/${checks.length}\n`);
if (checks.some(([, passed]) => !passed)) process.exitCode = 1;
