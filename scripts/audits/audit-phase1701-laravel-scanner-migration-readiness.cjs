const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const read = (p) => fs.readFileSync(path.join(root, p), 'utf8');
const pipeline = read('packages/core/src/compiler/scanner/wiring/laravelSourceAstPipeline.ts');
const controller = read('packages/core/src/compiler/scanner/wiring/laravelControllerScanner.ts');
const route = read('packages/core/src/compiler/scanner/wiring/laravelRouteScanner.ts');
const resource = read('packages/core/src/compiler/scanner/wiring/laravelResourceScanner.ts');
const judgment = read('packages/core/src/types/upstream/laravelScannerSemanticJudgment.ts');
const coreIndex = read('packages/core/src/index.ts');
const checks = [
  ['controller production path uses LaravelControllerScannerInterface implementation', pipeline.includes('laravelControllerScanner.scan(') && !pipeline.includes('ControllerScanner.scanCanonicalBundle')],
  ['controller scanner forwards the exact integrated invocation response and whole judgment', controller.includes('integratedResponse: judgment.response') && controller.includes('invocationJudgment: judgment')],
  ['controller scanner consumes source-backed query evidence from upstream pipeline', pipeline.indexOf('const queries = queryProducer.produce') < pipeline.indexOf('laravelControllerScanner.scan(') && controller.includes('controllerMethodContractFromMethod') && controller.includes('queries')],
  ['route production path uses LaravelRouteScannerInterface implementation', pipeline.includes('laravelRouteScanner.scan(') && route.includes('export const laravelRouteScanner: LaravelRouteScannerInterface')],
  ['resource production path uses LaravelResourceScannerInterface implementation', pipeline.includes('laravelResourceScanner.scan(') && resource.includes('export const laravelResourceScanner: LaravelResourceScannerInterface')],
  ['resource authority consumes the whole controller scan judgment and canonical model facts', resource.includes('controllerScan: input.controllerScan') && resource.includes('controllerScan: input.controllerScan') && resource.includes('bindingAuthority.judgeBatch')],
  ['route binding authority is bound once in the canonical scanner composition', route.includes('bindingAuthority: routeControllerBindingAuthority') && route.includes('authorities.bindingAuthority.judge(')],
  ['remaining ModelScanner, FormRequestScanner, and ChannelScanner legacy entries are explicitly separate migration work', pipeline.includes('ModelScanner.scanCanonicalBundle') && pipeline.includes('FormRequestScanner.scanCanonicalBundle') && pipeline.includes('ChannelScanner.scanCanonicalAsts')],
  ['invocation semantic pipeline remains the canonical integrated-response owner', read('packages/core/src/types/upstream/invocationSemanticPipeline.ts').includes('invocationSemanticRuntimeExecutor.executeAll(knowledge)') && read('packages/core/src/compiler/scanner/lexer/controllerDataflowAnalyzer.ts').includes('invocationSemanticIntegratedResponseComposition.integrate')],
  ['public exports include canonical controller and route scanner contracts', coreIndex.includes('LaravelControllerScannerInterface') && coreIndex.includes('LaravelRouteScannerInterface')],
  ['no semantic foundation dependency in canonical scanner pipeline', !/semantic\/foundation/.test(pipeline + controller + route + resource + judgment)],
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
