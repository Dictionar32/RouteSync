const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..', '..');
const read = rel => fs.readFileSync(path.join(root, rel), 'utf8');
const files = dir => fs.readdirSync(path.join(root, dir), { withFileTypes: true }).flatMap(e => {
  const rel = path.join(dir, e.name);
  return e.isDirectory() ? files(rel) : [rel];
});
const ts = dir => files(dir).filter(f => f.endsWith('.ts') && !f.includes(`${path.sep}__tests__${path.sep}`));
const importsCompiler = content => /from\s+['"][^'"]*compiler\//.test(content);
const production = ts('src/types/domain');
const upstream = ts('src/types/upstream');
const ir = ts('src/ir');
const semantic = ts('src/semantic');
const routeBarrel = read('src/types/route.ts');
const index = read('src/index.ts');
const dataflow = read('src/types/dataflow/dataFlowInterface.ts');
const boundary = read('src/types/interfaces/interfaceDependencyBoundary.ts');
const coreProduction = ts('src');
const legacy = coreProduction.filter(f => /StaticLaravelScanner|scanner\/upstream/.test(read(f)));

const checks = {
  typeVocabularyCanonicalUpstream: read('src/types/upstream/index.ts').includes("./typeVocabulary"),
  upstreamNoCompilerImports: upstream.filter(f => importsCompiler(read(f))).length === 0,
  domainNoCompilerImports: production.filter(f => importsCompiler(read(f))).length === 0,
  irNoSemanticTypeCompilerFacade: ir.filter(f => read(f).includes('compiler/types/SemanticType')).length === 0,
  semanticNoSemanticTypeCompilerFacade: semantic.filter(f => read(f).includes('compiler/types/SemanticType')).length === 0,
  publicSemanticTypeIsDomainOwned: /from ['"]\.\/types\/domain\/semanticType['"]/.test(index),
  irContextNoWiringManifest: !read('src/types/ir/contextIrTypes.ts').includes('scanner/wiring'),
  dataFlowGeneric: !/(Laravel|Route|Controller|Resource|Model|Schema)/.test(dataflow),
  dependencyBoundaryGeneric: !/(Laravel|Route|Controller|Resource|Model|Schema)/.test(boundary),
  graphConsumesUpstream: ts('src/graph').some(f => read(f).includes('types/upstream')),
  irConsumesUpstream: ir.some(f => /types\/upstream/.test(read(f))),
  cliPackageSurface: fs.readdirSync(path.resolve(root, '../cli/src/commands')).filter(n => n.endsWith('.ts')).every(n => !fs.readFileSync(path.resolve(root, '../cli/src/commands', n), 'utf8').includes('packages/core/src/')),
  legacyEmpty: legacy.length === 0,
  ecommerceFixturePresent: fs.existsSync(path.join(root, '../sdk/tests/fixtures/ecommerce-shop-source')),
};

const failed = Object.entries(checks).filter(([, ok]) => !ok).map(([name]) => name);
console.log(JSON.stringify({ phase: 1116, direction: 'upstream => wiring => interface => downstream', checks, failed, passed: failed.length === 0 }, null, 2));
process.exitCode = failed.length ? 1 : 0;
