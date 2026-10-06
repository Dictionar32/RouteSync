const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '../../..');
const cli = path.join(root, 'cli', 'src');
const core = path.join(root, 'core', 'src');
const upstream = path.join(core, 'types', 'upstream');

function walk(dir) {
  const out = [];
  if (!fs.existsSync(dir)) return out;
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) out.push(...walk(p));
    else if (e.isFile() && p.endsWith('.ts')) out.push(p);
  }
  return out;
}

const productionCliFiles = walk(cli).filter(f => !f.includes(`${path.sep}__tests__${path.sep}`));
const productionText = productionCliFiles.map(f => fs.readFileSync(f, 'utf8')).join('\n');
const commandText = walk(path.join(cli, 'commands')).map(f => fs.readFileSync(f, 'utf8')).join('\n');
const generatorText = walk(path.join(cli, 'generators')).filter(f => !f.includes(`${path.sep}__tests__${path.sep}`)).map(f => fs.readFileSync(f, 'utf8')).join('\n');

const checks = {
  syncDoesNotDuplicateTypeGeneration: !/TypeGenerator\.generate\(resolvedManifest/.test(fs.readFileSync(path.join(cli, 'commands', 'sync.ts'), 'utf8')),
  noProductionCliInternalCoreImports: !/from ['\"][^'\"]*core\/src\//.test(productionText),
  legacyPathClassifierAbsent: !fs.existsSync(path.join(cli, 'generators', 'classifier', 'pathClassifier.ts')),
  generatorUsesCanonicalCrudRole: /route\.capability\.crudRole/.test(fs.readFileSync(path.join(cli, 'generators', 'classifier', 'routeGrouper.ts'), 'utf8')),
  noPathCrudInferenceInRouteClassifier: !/classifyCrudRole|ROLE_ACTION|deriveGroupName|isDynamic/.test(fs.readFileSync(path.join(cli, 'generators', 'route-classifier.ts'), 'utf8')),
  canonicalUpstreamAuthoritiesPresent: ['route.ts','controller.ts','modelRelation.ts','resource.ts','schema.ts','manifest.ts'].every(n => fs.existsSync(path.join(upstream,n))),
  ecommerceFixturePresent: fs.existsSync(path.join(root, '..', 'examples', 'ecommerce-shop-source')),
  staticLaravelScannerAbsent: walk(core).filter(f => /StaticLaravelScanner/i.test(path.basename(f))).length === 0,
  upstreamDoesNotImportDownstream: !walk(upstream).some(f => /types\/dataflow|types\/interfaces|compiler\/analysis|compiler\/graph|compiler\/ir/.test(fs.readFileSync(f,'utf8'))),
  genericDataflowExported: /DataFlowInterface/.test(fs.readFileSync(path.join(core,'index.ts'),'utf8')),
  dependencyBoundaryExported: /InterfaceDependencyBoundary/.test(fs.readFileSync(path.join(core,'index.ts'),'utf8')),
  commandsBuildManifestFromUpstreamBuilder: /manifestBuilder\.build\(sourceProject\)/.test(fs.readFileSync(path.join(cli,'commands','scan.ts'),'utf8')) && /manifestBuilder\.build\(sourceProject\)/.test(fs.readFileSync(path.join(cli,'commands','sync.ts'),'utf8')),
  generateConsumesManifestNotSource: /fs\.readJson\(options\.manifest\)/.test(fs.readFileSync(path.join(cli,'commands','generate.ts'),'utf8')) && !/manifestBuilder\.build/.test(fs.readFileSync(path.join(cli,'commands','generate.ts'),'utf8')),
  noSemanticResolverInCommandPath: !/SemanticResolver|normalizeManifest/.test(commandText),
};

const report = { phase: 1097, checks, productionCliInternalImports: productionCliFiles.filter(f => /from ['\"][^'\"]*core\/src\//.test(fs.readFileSync(f,'utf8'))).map(f => path.relative(root,f)), passed: Object.values(checks).every(Boolean) };
const reportDir = path.join(root, '..', '..', 'reports');
fs.mkdirSync(reportDir, { recursive: true });
fs.writeFileSync(path.join(reportDir, 'phase1097-generator-upstream-closure.json'), JSON.stringify(report, null, 2));
console.log(JSON.stringify(report, null, 2));
if (!report.passed) process.exit(1);
