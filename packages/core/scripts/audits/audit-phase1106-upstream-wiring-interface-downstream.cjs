const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..', '..');
const read = rel => fs.readFileSync(path.join(root, rel), 'utf8');
const exists = rel => fs.existsSync(path.join(root, rel));
const nonEmpty = rel => exists(rel) && fs.statSync(path.join(root, rel)).size > 0;
const walk = dir => {
  const out = [];
  if (!fs.existsSync(dir)) return out;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...walk(full));
    else if (entry.isFile()) out.push(full);
  }
  return out;
};

const upstreamDir = path.join(root, 'src/types/upstream');
const cliDir = path.join(root, '../../cli/src/commands');
const upstreamFiles = walk(upstreamDir).filter(f => f.endsWith('.ts'));
const cliCommandFiles = walk(cliDir).filter(f => f.endsWith('.ts'));
const upstreamText = upstreamFiles.map(f => fs.readFileSync(f, 'utf8')).join('\n');
const cliText = cliCommandFiles.map(f => fs.readFileSync(f, 'utf8')).join('\n');
const dataFlow = read('src/types/dataflow/dataFlowInterface.ts');
const boundary = read('src/types/interfaces/interfaceDependencyBoundary.ts');
const domainFiles = walk(path.join(root, 'src/types/domain')).filter(f => f.endsWith('.ts') && !f.includes(`${path.sep}__tests__${path.sep}`));
const domainCompilerImports = domainFiles.filter(f => /compiler\//.test(fs.readFileSync(f, 'utf8')));
const domainBase = read('src/types/domain/base.ts');
const routeManifestInterface = read('src/compiler/scanner/wiring/routeManifestInterface.ts');
const lowerer = read('src/compiler/scanner/wiring/routeManifestLowerer.ts');
const projectionInterface = read('src/compiler/scanner/wiring/routeManifestProjectionInterface.ts');

const checks = {
  upstreamNoCompilerCliSdkImports: !/from\s+['"][^'"]*(?:compiler|cli|sdk)|import\([^)]*['"][^'"]*(?:compiler|cli|sdk)/.test(upstreamText),
  upstreamDoesNotImportBoundary: !/interfaceDependencyBoundary/.test(upstreamText),
  upstreamSemanticTargetsPresent: ['manifest.ts','route.ts','controller.ts','modelRelation.ts','resource.ts','schema.ts'].every(f => exists(`src/types/upstream/${f}`)),
  routeManifestCanonicalWiringContract: /export interface RouteManifest extends RouteManifestDomainSurface/.test(routeManifestInterface),
  routeManifestCompilerTypesOnlyAtWiring: /RequestType/.test(routeManifestInterface) && /ObjectType/.test(routeManifestInterface),
  domainSurfaceBaseHasNoCompilerImports: !/compiler\//.test(domainBase) && !/RequestType|ObjectType/.test(domainBase),
  domainCompilerFrontierExplicit: domainCompilerImports.length > 0,
  lowererConsumesWiringManifest: /from ['"]\.\/routeManifestInterface['"]/.test(lowerer),
  projectionBoundaryIsDirectional: /extends InterfaceDependencyBoundary<RouteSyncManifest, RouteManifestProjection>/.test(projectionInterface),
  dataFlowIsDomainNeutral: !/(Laravel|Eloquent|Controller|Resource|Model|Route)/.test(dataFlow),
  dependencyBoundaryIsGeneric: /InterfaceDependencyBoundary<Upstream, Downstream>/.test(boundary),
  cliCommandsUsePackageSurface: !/(core\/src|packages\/core\/src)/.test(cliText),
  noStaticLaravelScanner: walk(path.join(root, 'src')).filter(f => path.basename(f).includes('StaticLaravelScanner')).length === 0,
  legacyWiringPathsRetired: [
    'src/compiler/scanner/upstream/routeManifestLowerer.ts',
    'src/compiler/scanner/upstream/routeManifestProjection.ts',
    'src/compiler/scanner/upstream/routeManifestProjectionInputs.ts',
    'src/compiler/scanner/upstream/routeManifestProjectionInterface.ts',
    'src/compiler/scanner/upstream/routeManifestTypeLowering.ts',
    'src/compiler/scanner/upstream/routeManifestTypeLoweringInterface.ts'
  ].every(rel => !exists(rel)),
};

const result = { phase: 1106, checks, passed: Object.values(checks).every(Boolean) };
console.log(JSON.stringify(result, null, 2));
process.exit(result.passed ? 0 : 1);
