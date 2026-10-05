const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..', 'packages', 'core', 'src');
const files = [];
function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const file = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(file);
    else if (entry.name.endsWith('.ts')) files.push(file);
  }
}
walk(root);
const read = f => fs.readFileSync(f, 'utf8');
const matches = (needle, scope = files) => scope.filter(f => read(f).includes(needle));
const routeEmitter = path.join(root, 'compiler', 'scanner', 'subscanners', 'route-scanner', 'routeEmitter.ts');
const scanner = path.join(root, 'compiler', 'scanner', 'subscanners', 'RouteScanner.ts');
const relationProducer = path.join(root, 'compiler', 'scanner', 'subscanners', 'routeProducerRelations.ts');
const pipeline = path.join(root, 'types', 'upstream', 'astSemanticAuthorityPipeline.ts');

const result = {
  phase: 816,
  routeProducerConstructorCount: matches('routeProducer.produce(').length,
  scannerPublicRouteSemanticFlowReturn: read(scanner).includes('Promise<readonly RouteSemanticFlow[]>'),
  routeScannerUsesLegacyFactory: read(scanner).includes('RouteSemanticFlowFactory'),
  routeEmitterUsesLegacyFactory: read(routeEmitter).includes('RouteSemanticFlowFactory'),
  relationBridgeUsesLegacyFlow: read(relationProducer).includes('RouteSemanticFlowFactory'),
  authorityPipelineConsumerCount: matches('astSemanticAuthorityPipeline(').length,
  authorityPipelineDefinitionCount: matches('export const astSemanticAuthorityPipeline').length,
  routeSemanticFlowFiles: matches('RouteSemanticFlow'),
};

result.routeProducerIsSingleConstructor = result.routeProducerConstructorCount === 1;
result.publicScannerIsUpstreamAst = !result.scannerPublicRouteSemanticFlowReturn;
result.pipelineIsStillUnderConsumed = result.authorityPipelineConsumerCount === 0;
result.nextFrontier = result.routeEmitterUsesLegacyFactory
  ? 'routeEmitter -> RouteProducerInput direct cutover'
  : result.relationBridgeUsesLegacyFlow
    ? 'remove route semantic-flow compatibility bridge'
    : 'authority pipeline integration';

console.log(JSON.stringify({
  ...result,
  routeSemanticFlowFileCount: result.routeSemanticFlowFiles.length,
  routeSemanticFlowFiles: result.routeSemanticFlowFiles.map(f => path.relative(path.resolve(__dirname, '..'), f)),
}, null, 2));
