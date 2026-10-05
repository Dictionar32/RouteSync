const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const read = p => fs.readFileSync(path.join(root, p), 'utf8');
const emitter = read('packages/core/src/compiler/scanner/subscanners/route-scanner/routeEmitter.ts');
const scanner = read('packages/core/src/compiler/scanner/subscanners/RouteScanner.ts');
const bridge = read('packages/core/src/compiler/scanner/subscanners/routeProducerRelations.ts');
const producer = read('packages/core/src/compiler/scanner/subscanners/routeProducer.ts');
const result = {
  phase: 817,
  routeProducerConstructorCount: (producer.match(/routeProducer\s*:\s*RouteProducer/g) || []).length,
  routeEmitterLegacyFactoryReference: /RouteSemanticFlowFactory|RouteSemanticFlow/.test(emitter),
  routeScannerLegacyFactoryReference: /RouteSemanticFlowFactory/.test(scanner),
  routeScannerLegacyFlowReference: /RouteSemanticFlow/.test(scanner),
  routeEmitterReturnsRouteEmission: /readonly RouteEmission\[\]/.test(emitter),
  routeScannerConsumesRouteEmission: /RouteEmission/.test(scanner),
  routeBridgeLegacyFactoryReference: /RouteSemanticFlowFactory/.test(bridge),
  bridgeInputIsRouteEmission: /emission:\s*RouteEmission/.test(bridge),
  publicScannerIsUpstreamAst: /Promise<readonly RouteAst\[\]>/.test(scanner),
  nextFrontier: 'eliminate RouteSemanticFlowFactory from routeProducerRelations',
};
console.log(JSON.stringify(result, null, 2));
if (result.routeProducerConstructorCount !== 1 || result.routeEmitterLegacyFactoryReference || result.routeScannerLegacyFactoryReference || result.routeScannerLegacyFlowReference || !result.routeEmitterReturnsRouteEmission || !result.routeScannerConsumesRouteEmission || !result.bridgeInputIsRouteEmission || !result.publicScannerIsUpstreamAst) process.exitCode = 1;
