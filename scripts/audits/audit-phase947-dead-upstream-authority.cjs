const fs = require('fs');
const path = require('path');
const root = path.resolve(__dirname, '../..');
const read = p => fs.readFileSync(path.join(root, p), 'utf8');
const authority = read('packages/core/src/compiler/analysis/astDataflowAuthority.ts');
const analysis = read('packages/core/src/compiler/analysis/astAnalysisInterface.ts');
const phase161 = read('packages/core/src/compiler/scanner/lexer/routeAst/PHASE161_TYPED_KNOWLEDGE_DATAFLOW_SOURCE_PROVENANCE.md');
const resource = read('packages/core/PHASE_RESOURCE_PRODUCER_TRACE_REPAIR.md');
const test = read('packages/core/src/compiler/analysis/__tests__/ecommerceShopHighestAstDataflowPhase760.spec.ts');
const all = fs.readdirSync(path.join(root, 'packages/core/src'), { recursive: true })
  .filter(p => p.endsWith('.ts'));
const sourceConsumers = [];
for (const rel of all) {
  const text = read(path.join('packages/core/src', rel));
  if (rel === 'compiler/analysis/astDataflowAuthority.ts' || rel.includes('__tests__')) continue;
  if (/createSemanticDataflowInterface\s*\(/.test(text) || /createAstDataflowInterface\s*\(/.test(text)) sourceConsumers.push(rel);
}
const result = {
  canonicalUpstreamExists: fs.existsSync(path.join(root, 'packages/core/src/types/upstream')),
  literalCoreSrcUpstreamAbsent: !fs.existsSync(path.join(root, 'packages/core/src/upstream')),
  noLegacyAuthorityInterfaceFactory: !/createSemanticDataflowInterface\s*=|createAstDataflowInterface\s*=/.test(authority),
  authorityExportsJudgment: /export const createSemanticDataflowJudgment/.test(authority),
  canonicalInterfaceFactoryUsedByAnalysis: /semanticDataflowInterfaceFromJudgment\(judgment\.dataflow\)/.test(analysis),
  testUsesCanonicalInterfaceFactory: /semanticDataflowInterfaceFromJudgment\(judgment\)/.test(test),
  noProductionLegacyFactoryConsumers: sourceConsumers.length === 0,
  historicalExampleClaimCorrected: /not a current workspace authority/.test(phase161),
  resourceProvenanceCorrected: /packages\/sdk\/tests\/fixtures\/ecommerce-shop-source/.test(resource),
  ecommerceFixtureExists: fs.existsSync(path.join(root, 'packages/sdk/tests/fixtures/ecommerce-shop-source')),
  oldExampleTreesAbsent: !fs.existsSync(path.join(root, 'examples/ecomerce-shop-source')) && !fs.existsSync(path.join(root, 'examples/ecommerce-shop-source')),
  productionLegacyFactoryConsumers: sourceConsumers,
};
result.clean = Object.entries(result).filter(([k]) => k !== 'clean' && k !== 'productionLegacyFactoryConsumers').every(([,v]) => v === true) && sourceConsumers.length === 0;
console.log(JSON.stringify(result, null, 2));
if (!result.clean) process.exit(1);
