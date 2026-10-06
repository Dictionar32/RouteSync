const fs = require('fs');
const path = require('path');

const coreRoot = path.resolve(__dirname, '..', '..');
const repo = path.resolve(coreRoot, '..', '..');
const read = rel => fs.readFileSync(path.join(coreRoot, rel), 'utf8');
const readRepo = rel => fs.readFileSync(path.join(repo, rel), 'utf8');
const exists = rel => fs.existsSync(path.join(coreRoot, rel));

const manifest = read('src/types/upstream/manifest.ts');
const manifestBuilder = read('src/types/upstream/manifestBuilderInterface.ts');
const boundary = read('src/types/interfaces/interfaceDependencyBoundary.ts');
const flowProjection = read('src/compiler/scanner/orchestrator/RouteSyncManifestFlowProjectionInterface.ts');
const scanner = read('src/compiler/scanner/orchestrator/upstreamManifestScanner.ts');
const graph = read('src/graph/ServiceGraphBuilderInterface.ts');
const dataflow = read('src/compiler/analysis/semanticDataflowRuntimeBoundary.ts');
const ir = read('src/compiler/ir/SemanticDataflowIRProjectionInterface.ts');
const lowerer = read('src/compiler/scanner/wiring/routeManifestLowerer.ts');
const scan = readRepo('packages/cli/src/commands/scan.ts');
const sync = readRepo('packages/cli/src/commands/sync.ts');
const drift = readRepo('packages/cli/src/commands/audit/driftAuditor.ts');
const allCommands = [scan, sync, drift].join('\n');

const checks = {
  upstreamManifestIsConstructionOnly: /interface RouteSyncManifest \{/.test(manifest)
    && /readonly ast: CompleteSourceAst/.test(manifest)
    && !/interface RouteSyncManifest extends RouteSyncManifestFlow/.test(manifest),
  upstreamBuilderProducesConcreteManifest: /build: \(sourceProject: SourceProjectIdentity\) => Promise<RouteSyncManifest>/.test(manifestBuilder),
  projectionIsDownstreamWiringBoundary: /InterfaceDependencyBoundary<RouteSyncManifest, RouteSyncManifestFlow>/.test(flowProjection),
  projectionDoesNotForwardAst: !/ast:\s*manifest\.ast/.test(scanner),
  flowIsAstFree: (() => { const start = manifest.indexOf('export interface RouteSyncManifestFlow'); const end = manifest.indexOf('export interface RouteSyncManifest {'); const flow = manifest.slice(start, end < 0 ? manifest.length : end); return start >= 0 && !flow.includes('CompleteSourceAst') && flow.includes("readonly kind: 'route_sync_manifest_flow'"); })(),
  boundaryIsDirectional: /project: \(upstream: Upstream\) => Downstream/.test(boundary),
  graphConsumesGraphSurface: /InterfaceDependencyBoundary<RouteSyncManifestGraphSurface, ServiceGraph>/.test(graph),
  dataflowConsumesSemanticInput: /InterfaceDependencyBoundary<\s*SemanticDataflowInput,\s*SemanticDataflowRuntimeDataFlow/.test(dataflow),
  irConsumesOnlyDataflowProjection: /extends DataFlowProjectionInterface</.test(ir),
  lowererRemainsConstructionLane: /manifest: RouteSyncManifest/.test(lowerer) && /manifest\.ast\.ast/.test(lowerer),
  scanBuildsOnceAndProjects: /manifestBuilder\.build\(sourceProject\)/.test(scan)
    && /routeSyncManifestFlowFromManifest\(scannedManifest\)/.test(scan)
    && /lowerRouteSyncManifestToRouteManifest\(\s*scannedManifest/.test(scan),
  syncBuildsOnceAndProjects: /manifestBuilder\.build\(sourceProject\)/.test(sync)
    && /routeSyncManifestFlowFromManifest\(scannedManifest\)/.test(sync)
    && /lowerRouteSyncManifestToRouteManifest\(\s*scannedManifest/.test(sync),
  scanProjectsFlowToGraphAndDataflowSurface: /routeSyncManifestGraphSurfaceFromFlow\(manifestFlow\)/.test(scan)
    && /graphBuilder\.project\(graphSurface\)/.test(scan)
    && /routeSyncManifestDataflowSurfaceFromFlow\(manifestFlow\)/.test(scan),
  syncPassesFlowToDataflowSurface: /routeSyncManifestDataflowSurfaceFromFlow\(manifestFlow\)/.test(sync),
  driftAuditorUsesConcreteManifestOnlyForDrift: /manifestBuilder\.build\(createLaravelSourceProjectIdentity\(cwd\)\)/.test(drift)
    && !/RouteSyncManifestFlow/.test(drift),
  noStaticLaravelScannerInCommands: !/StaticLaravelScanner/.test(allCommands),
  noConcreteManifestInDownstreamContracts: !/RouteSyncManifest(?![A-Za-z])/.test([graph, dataflow, ir].join('\n')),
  noLegacyScannerFile: !exists('src/compiler/scanner/StaticLaravelScanner.ts'),
};

console.log(JSON.stringify({ phase: 1084, checks }, null, 2));
if (!Object.values(checks).every(Boolean)) process.exit(1);
