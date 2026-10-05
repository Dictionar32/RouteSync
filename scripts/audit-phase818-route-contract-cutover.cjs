const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const read = p => fs.readFileSync(path.join(root, p), 'utf8');
const bridge = read('packages/core/src/compiler/scanner/subscanners/routeProducerRelations.ts');
const emitter = read('packages/core/src/compiler/scanner/subscanners/route-scanner/routeEmitter.ts');
const scanner = read('packages/core/src/compiler/scanner/subscanners/RouteScanner.ts');
const producer = read('packages/core/src/compiler/scanner/subscanners/routeProducer.ts');
const result = {
  phase: 818,
  routeProducerConstructorCount: (producer.match(/routeProducer\s*:\s*RouteProducer/g) || []).length,
  bridgeUsesLegacyFlow: /(?:import|from)[^\n]*(?:RouteSemanticFlowFactory|RouteSemanticFlow)/.test(bridge),
  bridgeUsesCanonicalBoundaryContract: /RouteBoundaryContractFactory\.create/.test(bridge),
  bridgeInputIsRouteEmission: /emission:\s*RouteEmission/.test(bridge),
  emitterReturnsRouteEmission: /readonly RouteEmission\[\]/.test(emitter),
  scannerPublicAstBoundary: /Promise<readonly RouteAst\[\]>/.test(scanner),
};
console.log(JSON.stringify(result, null, 2));
if (result.routeProducerConstructorCount !== 1 || result.bridgeUsesLegacyFlow || !result.bridgeUsesCanonicalBoundaryContract || !result.bridgeInputIsRouteEmission || !result.emitterReturnsRouteEmission || !result.scannerPublicAstBoundary) process.exitCode = 1;
