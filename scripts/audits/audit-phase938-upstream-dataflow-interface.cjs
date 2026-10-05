const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..', '..');
const read = p => fs.readFileSync(path.join(root, p), 'utf8');
const interfaceText = read('packages/core/src/types/upstream/semanticDataflowInterface.ts');
const authorityText = read('packages/core/src/compiler/analysis/astDataflowAuthority.ts');
const adapterText = read('packages/core/src/compiler/scanner/upstream/semanticDataflowInputAdapter.ts');
const packageTree = fs.readdirSync(path.join(root, 'packages/core/src/compiler/scanner/lexer/routeAst'));
const sourceFiles = [];
function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full);
    else if (entry.name.endsWith('.ts')) sourceFiles.push(full);
  }
}
walk(path.join(root, 'packages/core/src'));
const productionSources = sourceFiles.filter(p => !p.includes('__tests__') && !p.includes('/PHASE') && !p.includes('.phase'));
const legacyAuthorityImports = productionSources.filter(p => {
  const t = fs.readFileSync(p, 'utf8');
  return /(?:from|export \*) ['\"].*semanticDataFlowAnalyzer['\"]/.test(t);
});
const oldExampleRefs = productionSources.filter(p => /examples\/(?:ecomerce-shop-source|ecommerce-shop-source)/.test(fs.readFileSync(p, 'utf8')));
const result = {
  upstreamInputContractExists: /export type SemanticDataflowInput/.test(interfaceText),
  upstreamOriginIsProducerNeutral: /source: 'semantic_dataflow_input'/.test(interfaceText) && !/semantic_knowledge_data_flow/.test(interfaceText),
  authorityConsumesUpstreamInput: /SemanticDataflowInput/.test(authorityText) && !/semanticKnowledgeDataFlowRelations/.test(authorityText),
  scannerAdapterProducesUpstreamInput: /SemanticDataflowInput/.test(adapterText) && /createSemanticDataflowInput/.test(adapterText),
  legacyAnalyzerNotProductionAuthority: legacyAuthorityImports.length === 0,
  oldExampleRefsAbsentFromProduction: oldExampleRefs.length === 0,
  legacyAnalyzerStillPresentOnlyAsCompatibilitySurface: packageTree.includes('semanticDataFlowAnalyzer.ts'),
};
result.clean = Object.values(result).every(v => v === true);
console.log(JSON.stringify(result, null, 2));
process.exit(result.clean ? 0 : 1);
