const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '../..');
const scanner = path.join(root, 'packages/core/src/compiler/scanner/subscanners/RouteScanner.ts');
const relations = path.join(root, 'packages/core/src/compiler/scanner/subscanners/routeProducerRelations.ts');
const producer = path.join(root, 'packages/core/src/compiler/scanner/subscanners/routeProducer.ts');

const read = file => fs.readFileSync(file, 'utf8');
const scannerText = read(scanner);
const relationText = read(relations);
const producerText = read(producer);

const result = {
  phase: 875,
  routeScannerUsesUpstreamProducer: scannerText.includes('import { routeProducer } from "./routeProducer";'),
  routeScannerBuildsProducerInput: scannerText.includes('routeProducerInputFromRouteBoundary(boundary,'),
  routeScannerCallsCanonicalProducer: (scannerText.match(/routeProducer\.produce\(/g) || []).length === 1,
  legacyRouteAstFromEmissionReference: scannerText.includes('routeAstFromRouteEmission'),
  producerInputBoundaryExported: relationText.includes('export const routeProducerInputFromRouteBoundary ='),
  relationBoundaryReturnsProducerInput: relationText.includes('): RouteProducerInput => {'),
  relationBoundaryConstructsRouteAst: /(?:import .*RouteAst|export const .*RouteAst|\breturn .*RouteAst)/.test(relationText),
  canonicalProducerHasProduce: /produce\(input\): RouteAst/.test(producerText),
};
result.pass = result.routeScannerUsesUpstreamProducer
  && result.routeScannerBuildsProducerInput
  && result.routeScannerCallsCanonicalProducer
  && !result.legacyRouteAstFromEmissionReference
  && result.producerInputBoundaryExported
  && result.relationBoundaryReturnsProducerInput
  && !result.relationBoundaryConstructsRouteAst
  && result.canonicalProducerHasProduce;

console.log(JSON.stringify(result, null, 2));
if (!result.pass) process.exitCode = 1;
