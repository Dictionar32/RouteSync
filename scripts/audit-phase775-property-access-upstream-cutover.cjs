const fs = require('fs');
const path = require('path');
const root = path.resolve(__dirname, '..');
const read = (p) => fs.readFileSync(path.join(root, p), 'utf8');
const files = [
  'packages/core/src/compiler/scanner/binders/resource/propertyAccessBinder.ts',
  'packages/core/src/compiler/scanner/binders/resource/whenLoadedSemanticBinder.ts',
  'packages/core/src/compiler/scanner/binders/resource/composite/collectionArrayBinders.ts',
  'packages/core/src/types/domain/boundAst.ts',
  'packages/core/src/types/domain/modelContracts.ts',
  'packages/core/src/semantic/plugins/ModelColumnResolver.ts',
];
const sources = Object.fromEntries(files.map((f) => [f, read(f)]));
const touched = files.map((f) => sources[f]).join('\n').replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|\s)\/\/.*$/gm, '$1');
const graph = JSON.parse(read('examples/ecommerce-shop-source/frontend/routesync.graph.json'));
const legacy = [
  'packages/core/src/types/semantic/parsedAstAlgebra.ts',
  'packages/core/src/types/semantic/parsedAstTypes.ts',
  'packages/core/src/types/semantic/__archive__/parsedAstAlgebra.ts',
  'packages/core/src/types/semantic/__archive__/parsedAstTypes.ts',
  'packages/core/src/types/domain/semanticResolutionLegacyAdapter.ts',
];
const legacyParsedRefs = [];
for (const base of ['packages/core/src/compiler', 'packages/core/src/types/semantic', 'packages/core/src/types/domain']) {
  const dir = path.join(root, base);
  if (!fs.existsSync(dir)) continue;
  const walk = (d) => fs.readdirSync(d, { withFileTypes: true }).flatMap((e) => {
    const p = path.join(d, e.name);
    return e.isDirectory() ? walk(p) : [p];
  });
  for (const p of walk(dir).filter((p) => /\.(ts|tsx|mts|cts)$/.test(p))) {
    const rel = path.relative(root, p);
    if (legacy.includes(rel)) continue;
    const s = fs.readFileSync(p, 'utf8');
    if (/Parsed[A-Za-z0-9_]*Descriptor/.test(s)) legacyParsedRefs.push(rel);
  }
}
const checks = {
  databaseTypeIsUpstream: sources['packages/core/src/types/domain/boundAst.ts'].includes("import type { DatabaseType } from '../upstream/databaseVocabulary';") && !sources['packages/core/src/types/domain/boundAst.ts'].includes('DatabaseColumnType'),
  databaseTypePreservedAtResolver: sources['packages/core/src/semantic/plugins/ModelColumnResolver.ts'].includes('dbType: fact.databaseType'),
  duplicateDatabaseColumnTypeRemoved: !sources['packages/core/src/types/domain/modelContracts.ts'].includes('export type DatabaseColumnType'),
  accessExpressionUsesExplicitClosedResult: sources['packages/core/src/compiler/scanner/binders/resource/propertyAccessBinder.ts'].includes('matchPhpAccessMode<ResourceFieldExpression>'),
  nullsafePropertyIsCanonicalExpression: sources['packages/core/src/compiler/scanner/binders/resource/propertyAccessBinder.ts'].includes('nullsafePropertyAccess(target, value.source.property)'),
  nullsafeMethodIsCanonicalExpression: sources['packages/core/src/compiler/scanner/binders/resource/propertyAccessBinder.ts'].includes('nullsafeMethodCall(target, value.source.method)'),
  relationUsesCanonicalEloquentType: touched.includes('value.source.eloquentType') && touched.includes('relation.eloquentType') && !/relationType:\s*(?:value\.source|relation)\.type/.test(touched),
  noForbiddenHostConstructsInTouchedSemanticFiles: !/\b(if|while|for|switch)\b|\.(map|filter|reduce|flatMap)\(|\?\?|\bundefined\b|===|\bas\s+(unknown|any)\b/.test(touched),
  parsedDescriptorProductionRefsEmpty: legacyParsedRefs.length === 0,
  parsedDescriptorReservoirsEmpty: legacy.every((p) => fs.statSync(path.join(root, p)).size === 0),
  ecommerceGraphHasModels: Object.keys(graph.models || {}).length > 0,
  ecommerceGraphHasRelations: Object.values(graph.models || {}).some((m) => Object.keys(m.relations || {}).length > 0),
  ecommerceGraphHasFields: Object.values(graph.models || {}).some((m) => Object.keys(m.fields || {}).length > 0),
};
const workload = {
  models: Object.keys(graph.models || {}).length,
  relations: Object.values(graph.models || {}).reduce((n, m) => n + Object.keys(m.relations || {}).length, 0),
  fields: Object.values(graph.models || {}).reduce((n, m) => n + Object.keys(m.fields || {}).length, 0),
  controllers: Object.keys(graph.controllers || {}).length,
  services: Object.keys(graph.services || {}).length,
  edges: Array.isArray(graph.edges) ? graph.edges.length : 0,
};
const result = {
  phase: 775,
  kind: 'property-access-upstream-cutover',
  checks,
  workload,
  legacyParsedRefs,
  status: Object.values(checks).every(Boolean) ? 'PASS' : 'FAIL',
};
console.log(JSON.stringify(result, null, 2));
process.exit(result.status === 'PASS' ? 0 : 1);
