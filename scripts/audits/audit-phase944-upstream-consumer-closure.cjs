const fs = require('fs');
const path = require('path');
const root = path.resolve(__dirname, '..', '..');
const read = p => fs.readFileSync(path.join(root, p), 'utf8');
const exists = p => fs.existsSync(path.join(root, p));
const prodFiles = dir => fs.readdirSync(path.join(root, dir), { withFileTypes: true }).flatMap(e => e.isDirectory() ? prodFiles(path.join(dir, e.name)) : e.name.endsWith('.ts') ? [path.join(dir, e.name)] : []);
const files = prodFiles('packages/core/src').filter(p => !p.includes('/__tests__/'));
const text = files.map(p => [p, read(p)]);
const importsFromUpstream = text.flatMap(([p, s]) => [...s.matchAll(/from\s+['"]([^'"]*types\/upstream[^'"]*)['"]/g)].map(m => [p,m[1]]));
const reverse = importsFromUpstream.filter(([p]) => p.startsWith('packages/core/src/types/upstream/'));
const policyConsumer = read('packages/core/src/types/upstream/highLevelSourceModel.ts');
const graphProjection = read('packages/core/src/graph/service/manifestGraphCompiler.ts');
const dataflowAdapter = read('packages/core/src/compiler/scanner/upstream/semanticDataflowInputAdapter.ts');
const authority = read('packages/core/src/compiler/analysis/astDataflowAuthority.ts');
const analysisInterface = read('packages/core/src/compiler/analysis/astAnalysisInterface.ts');
const result = {
  canonicalUpstreamExists: exists('packages/core/src/types/upstream/semanticDataflowInterface.ts'),
  literalCoreSrcUpstreamAbsent: !exists('packages/core/src/upstream'),
  noReverseUpstreamImports: reverse.length === 0,
  policyRelationsEnterCompleteSourceModel: /relations:\s*sourceModelReferenceIndexFromCatalog\(catalog\)\.graph/.test(policyConsumer),
  policyRelationsAreSemanticRelations: /RouteActionPolicyRelation|ControllerActionPolicyRelation/.test(policyConsumer),
  graphConsumesOnlyStructuralRelations: /if \(!isStructuralSemanticRelation\(relation\)\) return;/.test(graphProjection),
  dataflowAdapterCanonicalizesSeedsOnly: /fact\.kind, 'dependency'/.test(dataflowAdapter) && /value_flow/.test(dataflowAdapter) && !/kind:\s*'reaches'/.test(dataflowAdapter),
  authorityOwnsReachClosure: /relationFixedPoint\(/.test(authority) && /kind: 'reaches'/.test(authority),
  canonicalInterfaceFactoryConsumed: /semanticDataflowInterfaceFromJudgment\(judgment\.dataflow\)/.test(analysisInterface),
  noProductionLegacyAstDataflowFactoryConsumers: !text.some(([p,s]) => p !== 'packages/core/src/compiler/analysis/astDataflowAuthority.ts' && s.includes('createAstDataflowInterface')),
};
result.clean = Object.values(result).every(v => v === true);
console.log(JSON.stringify({...result, reverseImports: reverse}, null, 2));
if (!result.clean) process.exitCode = 1;
