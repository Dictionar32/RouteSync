const fs = require('fs');
const path = require('path');
const root = path.resolve(__dirname, '..', '..');
const read = p => fs.readFileSync(path.join(root, p), 'utf8');
const exists = p => fs.existsSync(path.join(root, p));
const allFiles = dir => fs.readdirSync(path.join(root, dir), { withFileTypes: true }).flatMap(e => e.isDirectory() ? allFiles(path.join(dir, e.name)) : [path.join(dir, e.name)]);
const coreSource = allFiles('packages/core/src').filter(p => /\.(ts|tsx|md)$/.test(p));
const productionTs = coreSource.filter(p => p.endsWith('.ts') && !p.includes('/__tests__/'));
const productionText = productionTs.map(p => [p, read(p)]);
const legacy = ['examples/ecomerce-shop-source', 'examples/ecommerce-shop-source'];
const reverse = productionText.flatMap(([p,s]) => [...s.matchAll(/(?:from\s+|import\s*\(\s*)['"]([^'"]*types\/upstream[^'"]*)['"]/g)].map(m => [p,m[1]])).filter(([p]) => p.startsWith('packages/core/src/types/upstream/'));
const activeDocs = [
  'packages/core/src/semantic/kernel/PHASE760_HIGHEST_UPSTREAM_DATAFLOW_AST.md',
  'packages/core/src/semantic/kernel/PHASE770_HIGHEST_ROUTE_CAPABILITY_AND_ECOMMERCE_DATAFLOW.md',
];
const staleActiveDocs = activeDocs.flatMap(p => {
  const s = read(p);
  return legacy.filter(x => s.includes(x) && !s.includes('historical Laravel ecommerce workload') && !s.includes('historical Laravel ecommerce workload concept')).map(x => [p,x]);
});
const phase760 = read('packages/core/src/semantic/kernel/PHASE760_HIGHEST_UPSTREAM_DATAFLOW_AST.md');
const phase770 = read('packages/core/src/semantic/kernel/PHASE770_HIGHEST_ROUTE_CAPABILITY_AND_ECOMMERCE_DATAFLOW.md');
const adapter = read('packages/core/src/compiler/scanner/upstream/semanticDataflowInputAdapter.ts');
const authority = read('packages/core/src/compiler/analysis/astDataflowAuthority.ts');
const graph = read('packages/core/src/graph/service/manifestGraphCompiler.ts');
const controller = read('packages/core/src/compiler/scanner/subscanners/controller/controllerAstCanonical.ts');
const result = {
  canonicalUpstreamExists: exists('packages/core/src/types/upstream/semanticDataflowInterface.ts'),
  literalCoreSrcUpstreamAbsent: !exists('packages/core/src/upstream'),
  canonicalEcommerceFixtureExists: exists('packages/sdk/tests/fixtures/ecommerce-shop-source'),
  noReverseProductionImports: reverse.length === 0,
  activeDocsDeclareHistoricalExample: phase760.includes('not a physical authority') && phase770.includes('not a physical authority'),
  noUnqualifiedCurrentExampleClaimInActiveDocs: staleActiveDocs.length === 0,
  laravelControllerAttributesEnterPolicyEvidence: /Middleware/.test(controller) && /WithoutMiddleware/.test(controller) && /Authorize/.test(controller),
  dataflowAdapterExcludesReaches: /kind, 'dependency'/.test(adapter) && /value_flow/.test(adapter) && !/kind:\s*'reaches'/.test(adapter),
  authorityOwnsReachClosure: /relationFixedPoint\(/.test(authority) && /kind: 'reaches'/.test(authority),
  graphRejectsPolicyRelations: /isStructuralSemanticRelation\(relation\)/.test(graph),
};
result.clean = Object.values(result).every(v => v === true);
console.log(JSON.stringify({...result, reverseProductionImports: reverse, staleActiveDocs}, null, 2));
if (!result.clean) process.exitCode = 1;
