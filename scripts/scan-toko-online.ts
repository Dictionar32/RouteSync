import path from 'node:path';
import fs from 'node:fs';
import {
  manifestBuilder,
  createLaravelSourceProjectIdentity,
  createSourceFile,
  routeSyncManifestFlowFromManifest,
  routeSyncManifestDataflowSurfaceFromFlow,
  routeSyncManifestGraphSurfaceFromFlow,
  lowerRouteSyncManifestToRouteManifest,
  projectRouteSyncManifestForRouteManifest,
  IRNodeRegistry,
  analyzeRouteSyncManifestDataflow,
  semanticDataflowIRProjection,
  createServiceGraphBuilder,
  semanticDataflowRuntimeBoundary
} from '../packages/core/src';
import { manifestGeneratorOperations } from '../packages/cli/src/generators/ManifestGenerator';
import { manifestContractValidationOperations } from '../packages/cli/src/generators/ManifestContractValidator';

async function run() {
  const targetDir = '/home/annas-zen/Documents/laragon-docker/www/toko-online';
  const outputPath = path.resolve(targetDir, 'routesync.manifest.json');
  console.log(`Scanning Laravel project at: ${targetDir}`);

  const sourceProject = createLaravelSourceProjectIdentity.create(createSourceFile(targetDir));
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
  const contractJudgment = manifestContractValidationOperations.validate(resolvedManifest);
  switch (contractJudgment.kind) {
    case 'manifest_contract_validated':
      break;
    case 'manifest_contract_rejected':
      throw new Error(`Manifest contract rejected: ${JSON.stringify(contractJudgment.violations)}`);
    default: {
      const exhaustive: never = contractJudgment;
      throw new Error(String(exhaustive));
    }
  }

  console.log(`Saving manifest to: ${outputPath}`);
  const persistence = await manifestGeneratorOperations.save(resolvedManifest, outputPath);
  switch (persistence.kind) {
    case 'manifest_persistence_complete':
      break;
    case 'manifest_persistence_contract_rejected':
      throw new Error(`Manifest contract rejected: ${JSON.stringify(persistence.violations)}`);
    case 'manifest_persistence_serialization_rejected':
      throw new Error(`Manifest serialization rejected: ${persistence.message}`);
    case 'manifest_persistence_write_rejected':
      throw new Error(`Manifest write rejected at ${persistence.outputPath}: ${persistence.message}`);
    default: {
      const exhaustive: never = persistence;
      throw new Error(String(exhaustive));
    }
  }

  const graphBuilder = createServiceGraphBuilder();
  const serviceGraph = graphBuilder.project(graphSurface);
  fs.writeFileSync(path.resolve(targetDir, 'routesync.graph.json'), JSON.stringify(serviceGraph, null, 2));

  const dataflowAnalysis = analyzeRouteSyncManifestDataflow(dataflowSurface, semanticDataflowRuntimeBoundary);
  fs.writeFileSync(path.resolve(targetDir, 'routesync.dataflow.json'), JSON.stringify(dataflowAnalysis, null, 2));

  const dataflowIR = dataflowAnalysis.map(result => semanticDataflowIRProjection.project(result.analysis.interface));
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
