const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const read = (p) => fs.readFileSync(path.join(root, p), 'utf8');
const judgment = read('packages/core/src/types/upstream/laravelScannerSemanticJudgment.ts');
const route = read('packages/core/src/types/upstream/laravelRouteScannerInterface.ts');
const resource = read('packages/core/src/types/upstream/laravelResourceScannerInterface.ts');
const pipeline = read('packages/core/src/compiler/scanner/wiring/laravelSourceAstPipeline.ts');
const invocation = read('packages/core/src/types/upstream/invocationSemanticPipeline.ts');
const checks = [
  ['route-controller judgment has a typed authority boundary', () => judgment.includes('RouteControllerBindingJudgmentAuthority') && judgment.includes("kind: 'route_controller_binding_judgment_authority'")],
  ['route-controller judgment models resolved, unresolved, and ambiguous outcomes', () => judgment.includes("kind: 'resolved'") && judgment.includes("kind: 'unresolved'") && judgment.includes("kind: 'ambiguous'")],
  ['resource-model judgment has a typed authority boundary', () => judgment.includes('ResourceModelBindingJudgmentAuthority') && judgment.includes("kind: 'resource_model_binding_judgment_authority'")],
  ['resource-model judgment preserves unresolved and ambiguous outcomes', () => judgment.includes('resource_model_not_found') && judgment.includes('controller_resource_binding_not_found') && judgment.includes('models: readonly ModelDefinition[]')],
  ['semantic judgment contracts preserve evidence and subject identity', () => judgment.includes('RouteControllerBindingEvidence') && judgment.includes('ResourceModelBindingEvidence') && judgment.includes('source: SourceSpan')],
  ['new judgment contracts are exported through upstream and core barrels', () => read('packages/core/src/types/upstream/index.ts').includes("export * from './laravelScannerSemanticJudgment'") && read('packages/core/src/index.ts').includes("export * from './types/upstream/laravelScannerSemanticJudgment'")],
  ['existing invocation authority remains canonical and is not duplicated', () => invocation.includes('invocationSemanticRuntimeExecutor.executeAll(knowledge)') && judgment.includes('reuse-existing-invocation-semantic-authority')],
  ['phase remains interface-first and does not claim pipeline wiring', () => pipeline.includes('ModelScanner.scanCanonicalBundle') && route.includes('LaravelRouteScanJudgment') && resource.includes('LaravelResourceScanJudgment')],
  ['new contract contains no any escape hatch', () => !/\bany\b/.test(judgment)],
  ['no forbidden semantic foundation dependency was introduced', () => !judgment.includes('semantic/foundation') && !pipeline.includes('semantic/foundation')],
];
let failed = 0;
for (const [name, check] of checks) {
  let ok = false;
  try { ok = Boolean(check()); } catch { ok = false; }
  process.stdout.write(`${ok ? 'PASS' : 'FAIL'} ${name}\n`);
  if (!ok) failed += 1;
}
process.stdout.write(`RESULT ${checks.length - failed}/${checks.length} PASS\n`);
process.exitCode = failed ? 1 : 0;
