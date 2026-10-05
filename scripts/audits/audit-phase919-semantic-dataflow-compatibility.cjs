const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '../..');
const upstream = path.join(root, 'packages/core/src/types/upstream');
const analyzer = path.join(root, 'packages/core/src/compiler/scanner/lexer/routeAst/semanticDataFlowAnalyzer.ts');
const iface = path.join(upstream, 'semanticDataflowInterface.ts');

const read = file => fs.readFileSync(file, 'utf8');
const ifaceText = read(iface);
const analyzerText = read(analyzer);

const genericContracts = [
  'SemanticDataFlowPathContract',
  'SemanticDataFlowAnalysisContract',
  'SemanticDataFlowJudgmentContract',
  'SemanticDataFlowInterfaceContract',
];

const productionUpstream = fs.readdirSync(upstream)
  .filter(name => name.endsWith('.ts') && !name.endsWith('.test.ts'))
  .map(name => path.join(upstream, name));

const concreteAstLeaks = [];
for (const file of productionUpstream) {
  const text = read(file);
  if (/compiler\/scanner|scanner\/lexer|AstIdentifier|ControllerMethodAst|ControllerParameterAst|ProviderSourceAst/.test(text)) {
    concreteAstLeaks.push(path.relative(root, file));
  }
}

const missingContracts = genericContracts.filter(name => !ifaceText.includes(`type ${name}<`));
const canonicalImports = analyzerText.includes("types/upstream/semanticDataflowInterface");
const canonicalAuthority = ifaceText.includes("kind: 'semantic_dataflow_judgment'") && ifaceText.includes("kind: 'semantic_dataflow_interface'");
const legacyAstAliasOnly = read(path.join(upstream, 'astDataflowInterface.ts')).includes('@deprecated Use semanticDataflowInterface.ts');

const report = {
  genericCompatibilityContractsPresent: missingContracts.length === 0,
  missingContracts,
  scannerCompatibilityImportPreserved: canonicalImports,
  canonicalSemanticAuthorityPresent: canonicalAuthority,
  legacyAstAliasOnly,
  productionUpstreamConcreteAstLeaks: concreteAstLeaks,
  ecomerceFixturePresent: fs.existsSync(path.join(root, 'examples/ecomerce-shop-source')),
  ecommerceFixturePresent: fs.existsSync(path.join(root, 'examples/ecommerce-shop-source')),
};
report.clean = report.genericCompatibilityContractsPresent && report.scannerCompatibilityImportPreserved && report.canonicalSemanticAuthorityPresent && report.legacyAstAliasOnly && concreteAstLeaks.length === 0 && !report.ecomerceFixturePresent && !report.ecommerceFixturePresent;

process.stdout.write(JSON.stringify(report, null, 2) + '\n');
process.exit(report.clean ? 0 : 1);
