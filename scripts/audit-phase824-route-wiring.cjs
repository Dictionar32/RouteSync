const fs = require('fs');
const path = require('path');
const root = path.resolve(__dirname, '..');
const core = path.join(root, 'packages/core/src');
const sdk = path.join(root, 'packages/sdk/tests');
const walk = dir => fs.readdirSync(dir, { withFileTypes: true }).flatMap(e => e.isDirectory() ? walk(path.join(dir,e.name)) : [path.join(dir,e.name)]);
const coreFiles = walk(core).filter(f => f.endsWith('.ts'));
const sdkFiles = walk(sdk).filter(f => f.endsWith('.ts'));
const read = f => fs.readFileSync(f,'utf8');
const factoryFiles = coreFiles.filter(f => f.includes('/descriptors/route/factories/'));
const productionFactoryRefs = coreFiles.filter(f => /RouteSemanticFlowFactory|descriptors\/route\/factories/.test(read(f)));
const sdkFactoryDirImports = sdkFiles.filter(f => /descriptors\/route\/factories/.test(read(f)));
const producerPath = path.join(core, 'compiler/scanner/subscanners/routeProducerRelations.ts');
const producerText = read(producerPath);
const report = {
  phase: 824,
  legacyRouteFactoryDirectoryExists: fs.existsSync(path.join(core,'compiler/scanner/descriptors/route/factories')),
  legacyRouteFactoryFiles: factoryFiles.map(f=>path.relative(root,f)),
  productionRouteFactoryReferenceFiles: productionFactoryRefs.map(f=>path.relative(root,f)),
  sdkLegacyFactoryDirectoryImports: sdkFactoryDirImports.map(f=>path.relative(root,f)),
  canonicalRouteProducerWiring: [
    'RouteBoundaryContractFactory.create',
    'RouteProducerInput',
    'routeProducer.produce'
  ].every(x=>producerText.includes(x)),
  nextFrontier: 'migrate RouteSemanticFlowFactory test construction to existing canonical boundary/producer authorities; do not introduce a replacement factory'
};
console.log(JSON.stringify(report,null,2));
if (report.legacyRouteFactoryDirectoryExists || report.sdkLegacyFactoryDirectoryImports.length) process.exitCode = 1;
