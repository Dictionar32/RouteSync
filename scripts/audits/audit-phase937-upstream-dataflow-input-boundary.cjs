const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..', '..');
const authority = fs.readFileSync(path.join(root, 'packages/core/src/compiler/analysis/astDataflowAuthority.ts'), 'utf8');
const input = fs.readFileSync(path.join(root, 'packages/core/src/types/upstream/semanticDataflowInterface.ts'), 'utf8');
const adapter = fs.readFileSync(path.join(root, 'packages/core/src/compiler/scanner/upstream/semanticDataflowInputAdapter.ts'), 'utf8');
const exampleDirs = [
  path.join(root, 'examples/ecomerce-shop-source'),
  path.join(root, 'examples/ecommerce-shop-source'),
];

const executableCore = path.join(root, 'packages/core/src');
const walk = dir => fs.readdirSync(dir, { withFileTypes: true }).flatMap(entry => {
  const file = path.join(dir, entry.name);
  return entry.isDirectory() ? walk(file) : [file];
});
const productionSources = walk(executableCore).filter(file => /\.(ts|tsx|js|mjs|cjs)$/.test(file));
const danglingExampleRefs = productionSources.filter(file => {
  const text = fs.readFileSync(file, 'utf8');
  return /examples\/ecommerce-shop-source|examples\/ecomerce-shop-source/.test(text)
    && !/scripts[\\/]audits/.test(file);
});

const checks = {
  upstreamInputContractExists: /export type SemanticDataflowInput/.test(input),
  inputIsClosed: /kind: 'semantic_dataflow_input'/.test(input) && /readonly closed: true/.test(input),
  authorityConsumesInput: /createSemanticDataflowInterface = \(\s*input: SemanticDataflowInput/.test(authority),
  authorityDoesNotImportScannerKnowledge: !/scanner\/lexer\/routeAst\/semanticKnowledgeDataFlowRelations/.test(authority),
  adapterOwnsScannerKnowledgeBoundary: /semanticKnowledgeDataFlowRelations/.test(adapter),
  adapterProducesUpstreamInput: /createSemanticDataflowInput/.test(adapter) && /SemanticDataflowInput/.test(adapter),
  historicalExamplesAbsent: exampleDirs.every(dir => !fs.existsSync(dir)),
  noDanglingExampleRefsInCoreProduction: danglingExampleRefs.length === 0,
};
checks.clean = Object.values(checks).every(Boolean);
console.log(JSON.stringify({ ...checks, danglingExampleRefs }, null, 2));
process.exit(checks.clean ? 0 : 1);
