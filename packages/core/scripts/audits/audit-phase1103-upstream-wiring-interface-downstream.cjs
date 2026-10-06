const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '../..');
const read = p => fs.readFileSync(path.join(root, p), 'utf8');
const exists = p => fs.existsSync(path.join(root, p));

const projection = read('src/compiler/scanner/wiring/routeManifestProjection.ts');
const lowering = read('src/compiler/scanner/wiring/routeManifestTypeLowering.ts');
const boundary = read('src/compiler/scanner/wiring/routeManifestTypeLoweringInterface.ts');
const dataflow = read('src/types/dataflow/dataFlowInterface.ts');
const dependency = read('src/types/interfaces/interfaceDependencyBoundary.ts');
const upstreamIndex = read('src/types/upstream/index.ts');
const composition = read('src/compiler/analysis/semanticDataflowRuntimeComposition.ts');

const checks = {
  projectionHasNoTypeDeriver: !projection.includes('TypeDeriver'),
  explicitTypeLoweringBoundary: boundary.includes('InterfaceDependencyBoundary<RouteSyncManifest, RouteManifestTypeLowering>'),
  typeDeriverOwnedByLoweringAdapter: lowering.includes("from '../subscanners/TypeDeriver'") && lowering.includes('TypeDeriver.deriveRequestTypes') && lowering.includes('TypeDeriver.deriveSemanticTypes'),
  genericDataFlow: dataflow.includes('DataFlowInterface<Input, State, Node>') && !dataflow.includes('Laravel'),
  directionalDependencyBoundary: dependency.includes('project: (upstream: Upstream) => Downstream'),
  upstreamDoesNotExportCompilerFailure: !upstreamIndex.includes("export * from './compilerPassFailure';"),
  retiredCompositionEmpty: composition.length === 0,
  retiredCompositionNotExported: !read('src/compiler/analysis/index.ts').includes("semanticDataflowRuntimeComposition"),
  staticLaravelScannerAbsent: !exists('src/scanner/StaticLaravelScanner.ts') && !exists('src/scanners/StaticLaravelScanner.ts'),
};

const failed = Object.entries(checks).filter(([, ok]) => !ok);
console.log(JSON.stringify({ ...checks, PASSED: failed.length === 0 }, null, 2));
process.exit(failed.length ? 1 : 0);
