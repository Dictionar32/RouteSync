const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '../..');
const core = path.join(root, 'packages/core/src');
const typesUpstream = path.join(core, 'types/upstream');
const scannerUpstream = path.join(core, 'compiler/scanner/upstream');
const packageRoot = path.join(root, 'packages');

const read = file => fs.readFileSync(file, 'utf8');
const walk = dir => {
  const out = [];
  if (!fs.existsSync(dir)) return out;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...walk(p));
    else if (/\.(ts|tsx|js|cjs|mjs)$/.test(entry.name)) out.push(p);
  }
  return out;
};

const typeFiles = walk(typesUpstream);
const scannerFiles = walk(scannerUpstream);
const productionTypeFiles = typeFiles.filter(f => !f.includes(`${path.sep}__tests__${path.sep}`));
const productionScannerFiles = scannerFiles.filter(f => !f.includes(`${path.sep}__tests__${path.sep}`));

const reverseTypeImports = typeFiles.filter(f => /compiler\/scanner\/upstream/.test(read(f)));
const reverseProductionImports = productionTypeFiles.filter(f => /compiler\/scanner\/upstream/.test(read(f)));
const scannerToTypes = productionScannerFiles.filter(f => /types\/upstream/.test(read(f)));

const semanticInterface = path.join(typesUpstream, 'semanticDataflowInterface.ts');
const authority = path.join(core, 'compiler/analysis/astDataflowAuthority.ts');
const adapter = path.join(scannerUpstream, 'semanticDataflowInputAdapter.ts');
const astAnalysis = path.join(core, 'compiler/analysis/astAnalysisInterface.ts');

const semanticText = read(semanticInterface);
const authorityText = read(authority);
const adapterText = read(adapter);
const astAnalysisText = read(astAnalysis);

const fixture = path.join(packageRoot, 'sdk/tests/fixtures/ecommerce-shop-source');
const oldExamplePaths = [
  path.join(root, 'examples/ecomerce-shop-source'),
  path.join(root, 'examples/ecommerce-shop-source'),
];

const result = {
  canonicalUpstreamExists: fs.existsSync(typesUpstream),
  literalCoreSrcUpstreamAbsent: !fs.existsSync(path.join(core, 'upstream')),
  noReverseImportsInUpstreamTests: reverseTypeImports.length === 0,
  noReverseImportsInUpstreamProduction: reverseProductionImports.length === 0,
  scannerUpstreamDependsOnCanonicalTypes: scannerToTypes.length > 0,
  semanticInputExists: /export type SemanticDataflowInput\b/.test(semanticText),
  semanticInputSeedOnly: /export type SemanticDataflowInputFact = Exclude<SemanticDataflowFact, \{ readonly kind: 'reaches' \}>/.test(semanticText) && /readonly facts: readonly SemanticDataflowInputFact\[\]/.test(semanticText),
  adapterProducesSemanticInput: /SemanticDataflowInput/.test(adapterText) && /createSemanticDataflowInput/.test(adapterText),
  authorityOwnsReachClosure: /transitiveReaches|reachesFrom/.test(authorityText) && /SemanticDataflowJudgment/.test(authorityText),
  analysisUsesCanonicalInterfaceFactory: /semanticDataflowInterfaceFromJudgment/.test(astAnalysisText),
  ecommerceFixtureExists: fs.existsSync(fixture),
  oldExamplePathsAbsent: oldExamplePaths.every(p => !fs.existsSync(p)),
};

result.clean = Object.values(result).every(Boolean);

console.log(JSON.stringify({
  ...result,
  reverseTypeImports: reverseTypeImports.map(f => path.relative(root, f)),
  reverseProductionImports: reverseProductionImports.map(f => path.relative(root, f)),
  scannerToTypesFiles: scannerToTypes.map(f => path.relative(root, f)),
}, null, 2));

if (!result.clean) process.exit(1);
