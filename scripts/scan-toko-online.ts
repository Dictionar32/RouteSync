import path from 'node:path';
import fs from 'node:fs';
import {
  manifestBuilder,
  createLaravelSourceProjectIdentity,
  routeSyncManifestFlowFromManifest,
  routeSyncManifestDataflowSurfaceFromFlow,
  routeSyncManifestGraphSurfaceFromFlow,
  lowerRouteSyncManifestToRouteManifest,
  projectRouteSyncManifestForRouteManifest,
  IRNodeRegistry,
  analyzeRouteSyncManifestDataflow,
  projectSemanticDataflowToIR,
  createServiceGraphBuilder,
  semanticDataflowRuntimeBoundary
} from '../packages/core/src';
import { ManifestGenerator } from '../packages/cli/src/generators/ManifestGenerator';
import { validateManifestContract } from '../packages/cli/src/generators/ManifestContractValidator';

async function run() {
  const targetDir = '/home/annas-zen/Documents/laragon-docker/www/toko-online';
  const outputPath = path.resolve(targetDir, 'routesync.manifest.json');
  console.log(`Scanning Laravel project at: ${targetDir}`);

  const sourceProject = createLaravelSourceProjectIdentity(targetDir);
  const scannedManifest = await manifestBuilder.build(sourceProject);
  const manifestFlow = routeSyncManifestFlowFromManifest(scannedManifest);
  const dataflowSurface = routeSyncManifestDataflowSurfaceFromFlow(manifestFlow);
  const graphSurface = routeSyncManifestGraphSurfaceFromFlow(manifestFlow);
  const routeManifestProjection = projectRouteSyncManifestForRouteManifest(scannedManifest);
  const resolvedManifest = lowerRouteSyncManifestToRouteManifest(
    scannedManifest,
    'http://localhost/api',
    '6.0.0',
    routeManifestProjection
  );

  const routes = resolvedManifest.routes;
  const models = resolvedManifest.models;
  const resources = resolvedManifest.resources;
  const irRegistry = new IRNodeRegistry();

  console.log(`Validating manifest contract...`);
  validateManifestContract(resolvedManifest);

  console.log(`Saving manifest to: ${outputPath}`);
  await ManifestGenerator.save(resolvedManifest, outputPath);

  const graphBuilder = createServiceGraphBuilder();
  const serviceGraph = graphBuilder.project(graphSurface);
  fs.writeFileSync(path.resolve(targetDir, 'routesync.graph.json'), JSON.stringify(serviceGraph, null, 2));

  const dataflowAnalysis = analyzeRouteSyncManifestDataflow(dataflowSurface, semanticDataflowRuntimeBoundary);
  fs.writeFileSync(path.resolve(targetDir, 'routesync.dataflow.json'), JSON.stringify(dataflowAnalysis, null, 2));

  const dataflowIR = dataflowAnalysis.map(result => projectSemanticDataflowToIR(result.analysis.interface));
  fs.writeFileSync(path.resolve(targetDir, 'routesync.dataflow.ir.json'), JSON.stringify(dataflowIR, null, 2));

  fs.writeFileSync(
    path.resolve(targetDir, 'routesync.ir.json'),
    JSON.stringify({ irVersion: 'ir.v2', nodeCount: irRegistry.size, nodes: irRegistry.toJSON() }, null, 2)
  );

  console.log(`\nScan complete!`);
  console.log(`Found: ${routes.length} routes, ${models?.length || 0} models, ${resources?.length || 0} resources.`);
  console.log(`\nDiscovered routes:`);
  routes.forEach(r => {
    console.log(`  ${r.identity.coordinates.method.padEnd(7)} ${r.identity.coordinates.path} ${r.capability.auth.value ? '[auth]' : ''}`);
  });
}

run().catch(err => {
  console.error('Scan failed:', err);
  process.exit(1);
});
