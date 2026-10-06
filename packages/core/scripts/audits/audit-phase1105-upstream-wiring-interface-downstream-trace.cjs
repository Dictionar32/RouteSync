const fs = require('fs');
const path = require('path');

const coreRoot = path.resolve(__dirname, '../..');
const repoRoot = path.resolve(coreRoot, '../..');
const read = p => fs.readFileSync(path.join(coreRoot, p), 'utf8');
const repoRead = p => fs.readFileSync(path.join(repoRoot, p), 'utf8');
const exists = p => fs.existsSync(path.join(coreRoot, p));
const walk = dir => {
  const out = [];
  if (!fs.existsSync(dir)) return out;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...walk(p));
    else out.push(p);
  }
  return out;
};
const tsFiles = dir => walk(dir).filter(p => p.endsWith('.ts'));
const upstreamFiles = tsFiles(path.join(coreRoot, 'src/types/upstream'));
const upstreamText = upstreamFiles.map(p => fs.readFileSync(p, 'utf8')).join('\n');
const wiringFiles = [
  'src/compiler/scanner/wiring/routeManifestLowerer.ts',
  'src/compiler/scanner/wiring/routeManifestProjection.ts',
  'src/compiler/scanner/wiring/routeManifestProjectionInputs.ts',
  'src/compiler/scanner/wiring/routeManifestProjectionInterface.ts',
  'src/compiler/scanner/wiring/routeManifestTypeLowering.ts',
  'src/compiler/scanner/wiring/routeManifestTypeLoweringInterface.ts',
];
const legacyWiringFiles = wiringFiles.map(p => p.replace('/wiring/', '/upstream/'));
const commands = ['annotate.ts','audit.ts','explain.ts','generate.ts','scan.ts','sync.ts','watch.ts'];
const commandTexts = commands.map(f => repoRead(`packages/cli/src/commands/${f}`));
const fixture = path.join(repoRoot, 'examples/ecommerce-shop-source');
const countFiles = (dir, names) => names.reduce((n, name) => n + walk(dir).filter(p => p.endsWith(`/${name}`) || p.endsWith(`\\${name}`)).length, 0);
const dataflow = read('src/types/dataflow/dataFlowInterface.ts');
const graph = read('src/graph/RouteSyncManifestGraphProjectionInterface.ts');
const ir = read('src/compiler/ir/SemanticDataflowIRProjection.ts');
const typeLowering = read('src/compiler/scanner/wiring/routeManifestTypeLowering.ts');
const typeDeriver = read('src/compiler/scanner/subscanners/TypeDeriver.ts');
const checks = {
  upstreamExists: upstreamFiles.length > 0,
  upstreamHasNoCompilerCliSdkImports: !/(from\s+['"][^'"]*(?:compiler|cli|sdk)[^'"]*['"])/.test(upstreamText),
  upstreamDoesNotOwnBoundary: !upstreamText.includes('InterfaceDependencyBoundary') && !upstreamText.includes('DataFlowProjectionInterface'),
  wiringSurfaceExists: wiringFiles.every(exists),
  legacyWiringPathsPreservedEmpty: legacyWiringFiles.every(p => exists(p) && fs.statSync(path.join(coreRoot,p)).size === 0),
  typeLoweringOwnsTypeDeriver: typeLowering.includes("from '../subscanners/TypeDeriver'") && typeLowering.includes('TypeDeriver.deriveRequestTypes') && typeLowering.includes('TypeDeriver.deriveSemanticTypes'),
  typeDeriverNotBarrelExported: !read('src/compiler/scanner/subscanners/index.ts').includes('export { TypeDeriver }'),
  dataFlowIsGeneric: !/(Laravel|Controller|Route|Eloquent|Resource|Model|Schema)/.test(dataflow),
  graphIsManifestBoundary: graph.includes('InterfaceDependencyBoundary<RouteSyncManifestFlow, RouteSyncManifestGraphSurface>'),
  irConsumesDataFlow: ir.includes('DataFlowInterface<SemanticDataflowInput, SemanticDataflowJudgment, SemanticDataflowIdentity>'),
  noStaticLaravelScanner: !walk(path.join(coreRoot, 'src')).some(p => p.endsWith('.ts') && fs.readFileSync(p,'utf8').includes('StaticLaravelScanner')) && !walk(path.join(repoRoot,'packages/cli/src')).some(p => p.endsWith('.ts') && fs.readFileSync(p,'utf8').includes('StaticLaravelScanner')),
  legacySemanticGeneratorsEmpty: ['semantic','normalizer','passes'].every(d => tsFiles(path.join(repoRoot,'packages/cli/src/generators',d)).filter(p => fs.statSync(p).size > 0).length === 0),
  cliCommandsAvoidCoreSrcImports: commandTexts.every(t => !/packages\/core\/src/.test(t)),
  ecommerceFixturePresent: fs.existsSync(fixture),
  ecommerceHasControllers: countFiles(fixture,['Controller.php']) > 0 || walk(fixture).some(p => /controllers?/i.test(p)),
  ecommerceHasModels: countFiles(fixture,['Model.php']) > 0 || walk(fixture).some(p => /models?/i.test(p)),
};
console.log(JSON.stringify({...checks, PASSED: Object.values(checks).every(Boolean)}, null, 2));
process.exit(Object.values(checks).every(Boolean) ? 0 : 1);
