const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..', '..');
const src = path.join(root, 'src');
const upstream = path.join(src, 'types', 'upstream');
const graph = path.join(src, 'graph', 'service');

const read = file => fs.readFileSync(file, 'utf8');
const exists = file => fs.existsSync(file);
const walk = dir => fs.readdirSync(dir, { withFileTypes: true }).flatMap(e => {
  const p = path.join(dir, e.name);
  return e.isDirectory() ? walk(p) : [p];
});
const ts = walk(src).filter(f => f.endsWith('.ts'));
const upstreamTs = walk(upstream).filter(f => f.endsWith('.ts'));
const has = (file, re) => re.test(read(file));
const graphRelation = path.join(graph, 'graphRelation.ts');
const upstreamIndex = path.join(upstream, 'index.ts');
const modelGraphTypes = path.join(src, 'types', 'semantic', 'modelGraphTypes.ts');
const graphEdgeRelation = path.join(graph, 'graphEdgeRelation.ts');

const checks = {
  graphRelationOwnedByGraph: exists(graphRelation),
  upstreamGraphRelationRemoved: !exists(path.join(upstream, 'graphRelation.ts')),
  upstreamIndexDoesNotExportGraphRelation: !has(upstreamIndex, /graphRelation/),
  graphRelationDependsOnlyOnUpstreamSemanticInputs: has(graphRelation, /types\/upstream\/(model|modelRelationProvenance|semanticReferences)/),
  upstreamDoesNotImportGraphLayer: upstreamTs.every(f => !/graph\/service|GraphSemanticRelation|GraphEdgeRelation/.test(read(f))),
  graphEdgeUsesLocalGraphRelation: has(graphEdgeRelation, /from ['"]\.\/graphRelation['"]/),
  graphTypesUseLocalGraphRelation: has(modelGraphTypes, /..\/..\/graph\/service\/graphRelation/),
  publicExportUsesGraphLayer: has(path.join(src, 'index.ts'), /from ['"]\.\/graph\/service\/graphRelation['"]/),
};

const violations = Object.entries(checks).filter(([, v]) => !v).map(([k]) => k);
const result = {
  phase: 1123,
  direction: 'upstream => wiring => interface => downstream',
  checks,
  violations,
  passed: violations.length === 0,
};
console.log(JSON.stringify(result, null, 2));
process.exit(result.passed ? 0 : 1);
