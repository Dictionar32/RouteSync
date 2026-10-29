const fs = require('node:fs');
const path = require('node:path');
const root = process.cwd();
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
const scannerPath = 'packages/core/src/compiler/scanner/wiring/laravelRouteScanner.ts';
const emitterPath = 'packages/core/src/compiler/scanner/operations/route-scanner/routeEmitter.ts';
const projectionPath = 'packages/core/src/compiler/scanner/operations/routeProducerRelations.ts';
const scanner = read(scannerPath);
const emitter = read(emitterPath);
const projection = read(projectionPath);
const checks = [
  ['active scanner has no RouteEmission type dependency', !scanner.includes('RouteEmission')],
  ['legacy RouteEmission ADT is retired from emitter implementation', !emitter.includes('RouteEmission')],
  ['boundary operations return RouteBoundaryContract directly', /emitResourceRouteBoundariesFromJudgment[\s\S]*?\): readonly RouteBoundaryContract\[\]/.test(emitter) && /emitStandardRouteBoundaries[\s\S]*?\): readonly RouteBoundaryContract\[\]/.test(emitter)],
  ['resource boundary projection consumes resource judgment facts directly', /const planned = actions\[index\][\s\S]*?project\(planned\.method, path, plan\.resource/.test(emitter)],
  ['standard boundary projection maps resolved method facts directly', /return relationProject\(targetMethods, method => project\(/.test(emitter)],
  ['RouteEmission-to-boundary adapter is removed', !projection.includes('routeBoundaryContractFromRouteEmission')],
  ['active scanner uses route-facts projection and canonical boundary contract', scanner.includes('routeBoundaryContractFromRouteFacts') && scanner.includes('RouteBoundaryContract')],
  ['canonical RouteProducer remains the only AST producer', scanner.includes('routeProducerOperation.produce(producerInput)') && scanner.includes('routeProducerInputCompositionOperation.compose')],
];
let failed = 0;
for (const [label, pass] of checks) {
  process.stdout.write(`${pass ? 'PASS' : 'FAIL'} ${label}\n`);
  if (!pass) failed += 1;
}
process.stdout.write(`RESULT ${checks.length - failed}/${checks.length}\n`);
process.exitCode = failed === 0 ? 0 : 1;
