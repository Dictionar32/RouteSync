const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..', '..');
const upstream = path.join(root, 'packages/core/src/types/upstream');
const analysis = path.join(root, 'packages/core/src/compiler/analysis');

function files(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap(entry => {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) return files(full);
    return full.endsWith('.ts') ? [full] : [];
  });
}

const productionUpstream = files(upstream).filter(file => !file.includes('__tests__'));
const productionAnalysis = files(analysis).filter(file => !file.includes('__tests__'));
const semanticInterface = path.join(upstream, 'semanticDataflowInterface.ts');
const legacyInterface = path.join(upstream, 'astDataflowInterface.ts');

const legacyProductionImports = [...productionAnalysis, ...productionUpstream]
  .filter(file => file !== legacyInterface)
  .flatMap(file => {
    const text = fs.readFileSync(file, 'utf8');
    return /from ['"][^'"]*astDataflowInterface['"]/.test(text) ? [path.relative(root, file)] : [];
  });

const concreteAstLeaks = productionUpstream.flatMap(file => {
  const text = fs.readFileSync(file, 'utf8');
  return /from ['"][^'"]*(compiler|scanner)\/|ControllerMethodAst|ControllerParameterAst|ProviderSourceAst|AstIdentifier/.test(text)
    ? [path.relative(root, file)] : [];
});

const authority = fs.readFileSync(path.join(analysis, 'astDataflowAuthority.ts'), 'utf8');
const semanticDiscriminants = [
  'semantic_dataflow_identity',
  'semantic_dataflow_judgment',
  'semantic_dataflow_origin',
  'semantic_dataflow_interface',
].every(value => authority.includes(value));

const fixtureCandidates = [
  path.join(root, 'examples/ecomerce-shop-source'),
  path.join(root, 'examples/ecommerce-shop-source'),
];
const missingNamedFixtures = fixtureCandidates.filter(file => !fs.existsSync(file)).map(file => path.relative(root, file));
const inlineCorpus = fs.readFileSync(path.join(root, 'packages/core/src/compiler/analysis/__tests__/ecommerceShopHighestAstDataflowPhase760.spec.ts'), 'utf8');

const report = {
  semanticInterfacePresent: fs.existsSync(semanticInterface),
  legacyInterfaceCompatibilityOnly: fs.existsSync(legacyInterface),
  legacyProductionImports,
  concreteAstLeaks,
  semanticDiscriminants,
  missingNamedFixtures,
  inlineCorpusPresent: /const requestSource = `|const modelSource = `|const controllerSource = `/m.test(inlineCorpus),
  clean: fs.existsSync(semanticInterface)
    && fs.existsSync(legacyInterface)
    && legacyProductionImports.length === 0
    && concreteAstLeaks.length === 0
    && semanticDiscriminants
    && missingNamedFixtures.length === 2
    && /const requestSource = `|const modelSource = `|const controllerSource = `/m.test(inlineCorpus),
};

console.log(JSON.stringify(report, null, 2));
if (!report.clean) process.exitCode = 1;
