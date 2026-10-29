const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const read = (p) => fs.readFileSync(path.join(root, p), 'utf8');
const pipeline = read('packages/core/src/compiler/scanner/wiring/laravelSourceAstPipeline.ts');
const controller = read('packages/core/src/compiler/scanner/wiring/laravelControllerScanner.ts');
const route = read('packages/core/src/compiler/scanner/wiring/laravelRouteScanner.ts');
const resource = read('packages/core/src/compiler/scanner/wiring/laravelResourceScanner.ts');
const invocation = read('packages/core/src/types/upstream/invocationSemanticPipeline.ts');
const controllerDataflow = read('packages/core/src/compiler/frontend/php/controllerDataflowAnalyzer.ts');
const checks = [
  ['controller, route, and resource paths use their canonical scanner interfaces', pipeline.includes('laravelControllerScanner.scan(') && pipeline.includes('laravelRouteScanner.scan(') && pipeline.includes('laravelResourceScanner.scan(')],
  ['controller artifact retains exact source-correlated integrated invocation judgment', controller.includes('integratedResponse: judgment.response') && controller.includes('invocationJudgment: judgment')],
  ['route scanner consumes correlated controller scan and authority-owned route binding judgment', route.includes('input.controllerScan.sourceProject') && route.includes('bindingAuthority.judge(')],
  ['resource scanner consumes the whole controller judgment and authority-closed model-binding batch', resource.includes('controllerScan: input.controllerScan') && resource.includes('bindingAuthority.judgeBatch')],
  ['controller legacy scanner entry has no implementation, import, or export', !fs.existsSync(path.join(root, 'packages/core/src/compiler/scanner/operations/ControllerScanner.ts')) && !/ControllerScanner/.test(read('packages/core/src/compiler/scanner/operations/index.ts'))],
  ['invocation pipeline uses canonical semantic runtime executor', invocation.includes('invocationSemanticRuntimeExecutor.executeAll(knowledge)')],
  ['controller dataflow analyzer composes only the closed integrated response', controllerDataflow.includes('invocationSemanticIntegratedResponseComposition.integrate') && !controllerDataflow.includes('phpSourceInvocationSemanticPipelineIntegrationAuthority')],
  ['no dependency on forbidden semantic foundation in the active scanner pipeline', !/semantic\/foundation/.test(pipeline + controller + route + resource + invocation + controllerDataflow)],
];
let failed = 0;
for (const [name, check] of checks) {
  let ok = false;
  try { ok = Boolean(check); } catch { ok = false; }
  process.stdout.write(`${ok ? 'PASS' : 'FAIL'} ${name}\n`);
  if (!ok) failed += 1;
}
process.stdout.write(`RESULT ${checks.length - failed}/${checks.length} PASS\n`);
process.exitCode = failed ? 1 : 0;
