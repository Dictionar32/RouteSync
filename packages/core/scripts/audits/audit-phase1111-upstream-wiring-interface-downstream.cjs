const fs = require('fs');
const path = require('path');
const coreRoot = path.resolve(__dirname, '../..');
const repoRoot = path.resolve(coreRoot, '../..');
const read = rel => fs.readFileSync(path.join(coreRoot, rel), 'utf8');
const exists = rel => fs.existsSync(path.join(coreRoot, rel));
const walk = dir => {
  if (!fs.existsSync(dir)) return [];
  const out = [];
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const f = path.join(dir, e.name);
    if (e.isDirectory()) out.push(...walk(f)); else out.push(f);
  }
  return out;
};
const ts = dir => walk(dir).filter(f => /\.(ts|tsx|mts|cts)$/.test(f));
const upstreamFiles = ts(path.join(coreRoot, 'src/types/upstream')).filter(f => !f.endsWith('.md'));
const upstreamText = upstreamFiles.map(f => fs.readFileSync(f, 'utf8')).join('\n');
const domainFiles = ts(path.join(coreRoot, 'src/types/domain')).filter(f => !f.includes(`${path.sep}__tests__${path.sep}`));
const domainCompilerImports = domainFiles.filter(f => /from\s+['"][^'"]*compiler\//.test(fs.readFileSync(f, 'utf8'))).map(f => path.relative(repoRoot, f).replaceAll(path.sep, '/'));
const commands = ts(path.join(repoRoot, 'packages/cli/src/commands'));
const commandText = commands.map(f => fs.readFileSync(f, 'utf8')).join('\n');
const wiringDir = path.join(coreRoot, 'src/compiler/scanner/wiring');
const legacyDir = path.join(coreRoot, 'src/compiler/scanner/upstream');
const legacyTs = ts(legacyDir);
const dataflow = read('src/types/dataflow/dataFlowInterface.ts');
const boundary = read('src/types/interfaces/interfaceDependencyBoundary.ts');
const runtimeAdapter = read('src/compiler/analysis/semanticDataflowDataFlowAdapter.ts');
const runtimeComposition = read('src/compiler/analysis/semanticDataflowRuntimeComposition.ts');
const orchestrator = read('src/compiler/scanner/orchestrator/upstreamManifestScanner.ts');
const checks = {
  upstreamHasNoCompilerImports: !/from\s+['"][^'"]*(?:compiler|cli|sdk)[^'"]*['"]/.test(upstreamText),
  upstreamDoesNotOwnBoundary: !/InterfaceDependencyBoundary|DataFlowProjectionInterface/.test(upstreamText),
  upstreamTargetsPresent: ['route.ts','controller.ts','modelRelation.ts','resource.ts','schema.ts','manifest.ts','typeVocabulary.ts'].every(f => exists(`src/types/upstream/${f}`)),
  wiringHasManifestBuilder: exists('src/compiler/scanner/wiring/upstreamManifestBuilder.ts'),
  wiringHasMigrationAdapter: exists('src/compiler/scanner/wiring/migrationInterfaceAdapter.ts'),
  wiringHasDataflowAdapter: exists('src/compiler/scanner/wiring/semanticDataflowInputAdapter.ts'),
  runtimeDataflowAdapterImplemented: /createSemanticDataflowDataFlowInterface/.test(runtimeAdapter) && /DataFlowInterface</.test(runtimeAdapter),
  runtimeCompositionUsesAdapter: /createSemanticDataflowDataFlowInterface/.test(runtimeComposition),
  orchestratorUsesWiringManifestBuilder: /(?:\.\.\/)*wiring\/upstreamManifestBuilder/.test(orchestrator),
  wiringHasRouteResolvers: ['routeGroupSemanticResolver.ts','routeMiddlewareFlowResolver.ts','effectiveControllerActionPolicyResolver.ts'].every(f => exists(`src/compiler/scanner/wiring/route/${f}`)),
  legacyScannerUpstreamHasNoProductionTs: legacyTs.filter(f => !f.includes(`${path.sep}__tests__${path.sep}`) && !f.endsWith('.test.ts')).length === 0,
  noStaticLaravelScanner: !walk(path.join(coreRoot, 'src')).some(f => /StaticLaravelScanner/i.test(path.basename(f))),
  noLegacyScannerImports: !/compiler\/scanner\/upstream/.test([...ts(path.join(coreRoot,'src')), ...ts(path.join(repoRoot,'packages/cli/src'))].map(f => fs.readFileSync(f,'utf8')).join('\n')),
  dataFlowIsGeneric: !/(Laravel|Eloquent|Controller|Resource|Model|Route|Schema)/.test(dataflow),
  dependencyBoundaryIsGenericDirectional: /InterfaceDependencyBoundary<Upstream, Downstream>/.test(boundary) && /project: \(upstream: Upstream\) => Downstream/.test(boundary),
  projectionBoundaryDirectional: /InterfaceDependencyBoundary<RouteSyncManifest, RouteManifestProjection>/.test(read('src/compiler/scanner/wiring/routeManifestProjectionInterface.ts')),
  typeLoweringUsesSpecializedDerivers: /RequestTypeDeriver/.test(read('src/compiler/scanner/wiring/routeManifestTypeLowering.ts')) && /SemanticTypeDeriver/.test(read('src/compiler/scanner/wiring/routeManifestTypeLowering.ts')) && !/TypeDeriver/.test(read('src/compiler/scanner/wiring/routeManifestTypeLowering.ts').replace(/RequestTypeDeriver|SemanticTypeDeriver/g,'')),
  lowererConsumesProjection: /RouteManifestProjection/.test(read('src/compiler/scanner/wiring/routeManifestLowerer.ts')),
  cliUsesPackageSurface: !/(packages\/core\/src|core\/src)/.test(commandText),
  cliPassesRuntimeBoundary: /analyzeRouteSyncManifestDataflow\(dataflowSurface, cliSemanticDataflowRuntimeBoundary\)/.test(commandText),
  domainFrontierExplicit: domainCompilerImports.length > 0,
  ecommerceFixturePresent: fs.existsSync(path.join(repoRoot,'examples/ecommerce-shop-source')),
};
const result = { phase: 1111, checks, domainCompilerImports, legacyProductionFiles: legacyTs.filter(f => !f.endsWith('.test.ts')).map(f => path.relative(repoRoot,f).replaceAll(path.sep,'/')), passed: Object.values(checks).every(Boolean) };
console.log(JSON.stringify(result,null,2));
process.exit(result.passed ? 0 : 1);
