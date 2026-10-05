const fs = require('fs');
const path = require('path');
const root = path.resolve(__dirname, '..');
const read = p => fs.readFileSync(path.join(root, p), 'utf8');
const lowerer = read('packages/core/src/compiler/scanner/upstream/routeManifestLowerer.ts');
const scanner = read('packages/core/src/compiler/scanner/subscanners/RouteScanner.ts');
const sourceScanner = read('packages/core/src/compiler/scanner/orchestrator/sourceAstScanner.ts');
const collections = read('packages/core/src/types/upstream/collections.ts');
const relations = read('packages/core/src/compiler/scanner/subscanners/routeProducerRelations.ts');
const result = {
  phase: 839,
  canonicalRouteBundle: 'RouteScanner::scanCanonicalBundle',
  sourceAstScannerUsesCanonicalRouteBundle: /RouteScanner\.scanCanonicalBundle\(/.test(sourceScanner),
  sourceAstsCarriesRouteFlows: /readonly routeFlows: readonly import\('\.\.\/domain\/routes'\)\.RouteSemanticFlow\[\]/.test(collections),
  routeBundleProducesAstAndFlow: /scanCanonicalBundle[\s\S]*readonly asts[\s\S]*readonly flows/.test(scanner),
  routeFlowUsesBoundaryAuthority: /routeBoundaryContractFromRouteEmission[\s\S]*routeSemanticFlowFromRouteBoundary/.test(relations),
  lowererUsesManifestRouteFlows: /manifest\.ast\.ast\.routeFlows/.test(lowerer),
  lowererRescansRoutes: /RouteScanner\.scan(Source|Asts)\(/.test(lowerer),
  pass: false,
};
result.pass = result.sourceAstScannerUsesCanonicalRouteBundle &&
  result.sourceAstsCarriesRouteFlows &&
  result.routeBundleProducesAstAndFlow &&
  result.routeFlowUsesBoundaryAuthority &&
  result.lowererUsesManifestRouteFlows &&
  !result.lowererRescansRoutes;
console.log(JSON.stringify(result, null, 2));
process.exitCode = result.pass ? 0 : 1;
