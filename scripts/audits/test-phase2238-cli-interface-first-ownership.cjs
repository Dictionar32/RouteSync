const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const read = relative => fs.readFileSync(path.join(root, relative), 'utf8');
const contract = read('packages/core/src/types/upstream/laravelControllerActionSemanticJudgmentInterface.ts');
const wiring = read('packages/core/src/compiler/scanner/wiring/laravelControllerExecutionDependencies.ts');
const scanner = read('packages/core/src/compiler/scanner/wiring/laravelControllerScanner.ts');
const cli = read('packages/cli/src/parsers/php/controllerInvocationManifestComposition.ts');
const resource = read('packages/core/src/types/upstream/controllerResourceBindingInterface.ts');
const checks = [
  ['existing action contract and production wiring both use version 36', /readonly version: 36;/.test(contract) && /version: 36 as const/.test(wiring)],
  ['resource binding aggregation is not falsely listed as open debt', !/kind: 'resource_binding_aggregation'/.test(contract)],
  ['existing resource authority owns canonical publication', /readonly publishResolved:/.test(resource) && /controllerResourceBindingAuthority\.publishResolved/.test(wiring)],
  ['request evidence adapter is assigned to source evidence projection boundary', /kind: 'request_binding_compatibility_adapter'[\s\S]*targetOwner: 'source_evidence_projection_boundary'/.test(contract)],
  ['body AST projection remains explicitly open', /kind: 'body_source_ast'[\s\S]*targetOwner: 'source_evidence_projection_boundary'/.test(contract)],
  ['production action route bypasses actionScanner but keeps resolver ownership debt explicit', !/scanControllerAction\(/.test(wiring) && /resolveControllerActionContract/.test(wiring)],
  ['CLI composition reaches invocation pipeline and inventory authority', /analyzePhpSourceInvocationSemanticPipelineBatch/.test(cli) && /laravelControllerInvocationSemanticJudgmentInventoryAuthority/.test(cli)],
  ['action judgment remains correlated with integrated response judgment', /actionJudgment\.judge\(/.test(scanner) && /judgeIntegratedResponse/.test(scanner)],
  ['no relation/foundation dependency is introduced in the touched action contract or wiring', !/semantic\/(relation|foundation)|types\/upstream\/(relation|foundation)/.test(contract + wiring)],
];
for (const [name, passed] of checks) process.stdout.write(`${passed ? 'PASS' : 'FAIL'} ${name}\n`);
process.stdout.write(`RESULT ${checks.filter(([, passed]) => passed).length}/${checks.length}\n`);
if (checks.some(([, passed]) => !passed)) process.exitCode = 1;
