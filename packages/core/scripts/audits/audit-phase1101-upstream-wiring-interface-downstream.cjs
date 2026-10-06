const fs = require('fs');
const path = require('path');

const coreRoot = path.resolve(__dirname, '..', '..');
const cliRoot = path.resolve(coreRoot, '..', 'cli');
const coreSrc = path.join(coreRoot, 'src');
const cliSrc = path.join(cliRoot, 'src');
const read = file => fs.existsSync(file) ? fs.readFileSync(file, 'utf8') : '';
const walk = dir => {
  const files = [];
  if (!fs.existsSync(dir)) return files;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) files.push(...walk(full));
    else if (entry.name.endsWith('.ts')) files.push(full);
  }
  return files;
};

const upstream = walk(path.join(coreSrc, 'types', 'upstream')).filter(f => !f.includes(`${path.sep}__tests__${path.sep}`));
const cliFiles = walk(cliSrc).filter(f => !f.includes(`${path.sep}__tests__${path.sep}`));
const commands = ['scan.ts', 'sync.ts'].map(f => read(path.join(cliSrc, 'commands', f))).join('\n');
const dataflow = read(path.join(coreSrc, 'types/dataflow/dataFlowInterface.ts'));
const boundary = read(path.join(coreSrc, 'types/interfaces/interfaceDependencyBoundary.ts'));
const projectionInterface = read(path.join(coreSrc, 'compiler/scanner/wiring/routeManifestProjectionInterface.ts'));
const projection = read(path.join(coreSrc, 'compiler/scanner/wiring/routeManifestProjection.ts'));
const lowerer = read(path.join(coreSrc, 'compiler/scanner/wiring/routeManifestLowerer.ts'));
const cliRuntime = read(path.join(cliSrc, 'dataflow/semanticDataflowRuntimeBoundary.ts'));
const legacyAdapter = read(path.join(coreSrc, 'compiler/analysis/semanticDataflowDataFlowAdapter.ts'));
const legacyComposition = read(path.join(coreSrc, 'compiler/analysis/semanticDataflowRuntimeComposition.ts'));
const staticScannerFiles = walk(coreSrc).filter(f => /StaticLaravelScanner/i.test(path.basename(f)));
const staticScannerRefs = walk(coreSrc).filter(f => !/PHASE/.test(f) && /StaticLaravelScanner/.test(read(f)));
const upstreamBoundaryImports = upstream.filter(f => /(^|\n)\s*import(?:\s+type)?\s+.*(?:InterfaceDependencyBoundary|DataFlowProjectionInterface|DataFlowInterface)/.test(read(f)));
const cliInternalImports = cliFiles.filter(f => /@routesync\/core\/src|packages\/core\/src|types\/upstream/.test(read(f)));
const legacyGeneratorFiles = [
  ...walk(path.join(cliSrc, 'generators', 'semantic')),
  ...walk(path.join(cliSrc, 'generators', 'normalizer')),
  ...walk(path.join(cliSrc, 'generators', 'passes')),
  path.join(cliSrc, 'generators/legacy/RouteTypeEmitter.ts'),
  path.join(cliSrc, 'generators/semantic-resolver.ts'),
  path.join(cliSrc, 'generators/normalizer.ts'),
  path.join(cliSrc, 'generators/pipeline.ts'),
  path.join(cliSrc, 'generators/passes.ts'),
];
const nonEmptyLegacyGenerators = legacyGeneratorFiles.filter(f => fs.existsSync(f) && read(f).length > 0);

const checks = {
  upstreamDoesNotDependOnWiringInterfaces: upstreamBoundaryImports.length === 0,
  cliUsesPackageSurfaceOnly: cliInternalImports.length === 0,
  genericDataflowIsDomainNeutral: !/(Laravel|Route|Controller|Request|Model|Resource|Schema|Graph|IR|StaticLaravelScanner)/.test(dataflow),
  dependencyBoundaryIsDirectional: /project:\s*\(upstream: Upstream\) => Downstream/.test(boundary),
  projectionInterfaceIsDownstreamOwned: /extends InterfaceDependencyBoundary<\s*RouteSyncManifest,\s*RouteManifestProjection/.test(projectionInterface),
  projectionConsumesCanonicalManifest: /project = \(manifest: RouteSyncManifest\)/.test(projection) && !/TypeDeriver/.test(projection),
  lowererDoesNotDeriveTypes: !/TypeDeriver|TypeInterner/.test(lowerer),
  lowererConsumesExplicitProjection: /projection: RouteManifestProjection/.test(lowerer) && /requestTypes: projection.requestTypes/.test(lowerer),
  cliInjectsProjection: /projectRouteSyncManifestForRouteManifest/.test(commands) && /routeManifestProjection/.test(commands),
  cliOwnsConcreteDataflowRuntime: /cliSemanticDataflowRuntimeBoundary/.test(cliRuntime) && /DataFlowInterface/.test(cliRuntime),
  retiredCoreDataflowImplementationIsEmpty: legacyAdapter.length === 0 && legacyComposition.length === 0,
  noStaticLaravelScannerImplementation: staticScannerFiles.length === 0 && staticScannerRefs.length === 0,
  legacyGeneratorPathsPreservedButEmpty: nonEmptyLegacyGenerators.length === 0,
};

const result = {
  phase: 1101,
  checks,
  upstreamBoundaryImports,
  cliInternalImports,
  staticScannerFiles,
  staticScannerRefs,
  nonEmptyLegacyGenerators,
  passed: Object.values(checks).every(Boolean),
};
console.log(JSON.stringify(result, null, 2));
process.exit(result.passed ? 0 : 1);
