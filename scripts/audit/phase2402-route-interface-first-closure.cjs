const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const read = relative => fs.readFileSync(path.join(root, relative), 'utf8');
const scanner = read('packages/core/src/compiler/scanner/wiring/laravelRouteScanner.ts');
const routeContract = read('packages/core/src/types/upstream/laravelRouteScannerInterface.ts');
const producerRelations = read('packages/core/src/compiler/scanner/subscanners/routeProducerRelations.ts');
const routeEmitter = read('packages/core/src/compiler/scanner/subscanners/route-scanner/routeEmitter.ts');
const manifest = read('packages/core/src/types/upstream/manifest.ts');
const manifestBuilder = read('packages/core/src/compiler/scanner/wiring/upstreamManifestBuilder.ts');
const manifestFlow = read('packages/core/src/compiler/scanner/orchestrator/upstreamManifestScanner.ts');
const checks = [
  ['invocation judgment is owned by concrete upstream manifest', () => manifest.includes('readonly invocationSemanticJudgments: readonly LaravelControllerInvocationSemanticJudgmentInterface[];')],
  ['manifest builder transfers authority-closed judgment receipt directly', () => manifestBuilder.includes('invocationSemanticJudgments: invocationInventoryReceipt.correspondences')],
  ['manifest flow consumes the manifest-owned judgment, not AST', () => manifestFlow.includes('invocationSemanticJudgments: manifest.invocationSemanticJudgments') && !manifestFlow.includes('manifest.ast')],
  ['route scanner declares injected upstream method/resource/path/correlation operations', () => ['declarationMethodAuthority', 'routeResourceFlowAuthority', 'routePathResolutionAuthority', 'controllerActionRouteCorrelationAuthority'].every(name => routeContract.includes(`readonly ${name}:`))],
  ['route scanner actually calls method authority', () => scanner.includes('methodAuthority.judge({ method: evidence.method, targetMethods: evidence.targetMethods })')],
  ['route scanner still owns declaration emission dispatch', () => scanner.includes('const emitDeclaration =') && scanner.includes('return emitDeclaration(evidence, methodJudgment')],
  ['active route scanner still imports emitter from subscanners', () => scanner.includes("from '../subscanners/route-scanner'")],
  ['active route scanner still imports route producer relation projection from subscanners', () => scanner.includes("from '../subscanners/routeProducerRelations'")],
  ['route producer relation path still imports semantic relations', () => producerRelations.includes("from '../../../semantic/relations/")],
  ['resource emission receives an empty controller map instead of a closed action contract', () => scanner.includes('relationNone(),\n        unresolvedResponse,')],
  ['resource emitter still depends on relation algebra and map lookup', () => routeEmitter.includes('RelationIndex') && routeEmitter.includes('relationIndexLookup')],
  ['route boundary producer-input composition still supplies an empty controller map', () => producerRelations.includes('input.methodJudgment,\n            relationNone(),')],
];
let failures = 0;
for (const [name, check] of checks) {
  const passed = check();
  process.stdout.write(`${passed ? 'PASS' : 'FAIL'} ${name}\n`);
  failures += Number(!passed);
}
process.stdout.write(`\n${checks.length - failures}/${checks.length} checks passed\n`);
process.stdout.write('NOTE: This is a gap audit. FAIL means an interface-first blocker remains; it is not a passing closure gate.\n');
process.exitCode = failures === 0 ? 0 : 1;
