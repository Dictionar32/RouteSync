const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..', '..');
const upstream = path.join(root, 'packages', 'core', 'src', 'types', 'upstream');
const semantic = fs.readFileSync(path.join(upstream, 'semanticDataflowInterface.ts'), 'utf8');
const analyzer = fs.readFileSync(path.join(root, 'packages', 'core', 'src', 'compiler', 'scanner', 'lexer', 'routeAst', 'semanticDataFlowAnalyzer.ts'), 'utf8');

const sourceFiles = [];
const walk = dir => {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full);
    else if (entry.name.endsWith('.ts')) sourceFiles.push(full);
  }
};
walk(path.join(root, 'packages', 'core', 'src'));

const upstreamProduction = sourceFiles.filter(file => file.startsWith(upstream) && !file.includes(`${path.sep}__tests__${path.sep}`));
const genericContractLeaks = sourceFiles.filter(file => /SemanticDataFlow(?:Path|Analysis|Judgment|Interface)Contract/.test(fs.readFileSync(file, 'utf8')) && !file.endsWith('semantic-dataflow-interface-contract.phase910.test.ts'));
const astDataflowIdentityLeaks = [path.join(upstream, 'semanticDataflowInterface.ts')].filter(file => /AstNodeIdentity/.test(fs.readFileSync(file, 'utf8')));

const report = {
  canonicalSemanticInterfacePresent: /export type SemanticDataflowInterface/.test(semantic),
  judgmentUsesSemanticIdentity: /readonly node: SemanticDataflowIdentity/.test(semantic),
  genericContractUpstreamLeaks: genericContractLeaks.map(file => path.relative(root, file)),
  semanticDataflowAstIdentityLeaks: astDataflowIdentityLeaks.map(file => path.relative(root, file)),
  scannerOwnsLegacyCompatibility: /Scanner-local compatibility vocabulary/.test(analyzer),
  ecomerceFixturePresent: fs.existsSync(path.join(root, 'examples', 'ecomerce-shop-source')),
  ecommerceFixturePresent: fs.existsSync(path.join(root, 'examples', 'ecommerce-shop-source')),
};
report.clean = report.canonicalSemanticInterfacePresent && report.judgmentUsesSemanticIdentity && report.genericContractUpstreamLeaks.length === 0 && report.semanticDataflowAstIdentityLeaks.length === 0 && report.scannerOwnsLegacyCompatibility;
console.log(JSON.stringify(report, null, 2));
