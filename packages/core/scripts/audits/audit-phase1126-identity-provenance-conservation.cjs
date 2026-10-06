#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..', '..');
const read = (rel) => fs.readFileSync(path.join(root, rel), 'utf8');
const exists = (rel) => fs.existsSync(path.join(root, rel));
const allFiles = (dir, out = []) => {
  for (const entry of fs.readdirSync(path.join(root, dir), { withFileTypes: true })) {
    const rel = path.join(dir, entry.name);
    if (entry.isDirectory()) allFiles(rel, out);
    else out.push(rel);
  }
  return out;
};
const ts = (dir) => allFiles(dir).filter(f => f.endsWith('.ts'));

const semanticRefs = read('src/types/upstream/semanticReferences.ts');
const model = read('src/types/upstream/model.ts');
const provenance = read('src/types/upstream/modelRelationProvenance.ts');
const schemaRelation = read('src/types/upstream/schemaRelation.ts');
const projection = read('src/graph/service/structuralSemanticRelationProjection.ts');
const graphRelation = read('src/graph/service/graphRelation.ts');
const graphEdge = read('src/graph/service/graphEdgeRelation.ts');
const sink = read('src/graph/service/graphEdgeRelationSink.ts');
const highLevel = read('src/types/upstream/highLevelSourceModel.ts');
const manifestScanner = read('src/compiler/scanner/orchestrator/upstreamManifestScanner.ts');
const dataflow = read('src/types/upstream/semanticDataflow.ts');
const dataflowInterface = read('src/types/dataflow/dataFlowInterface.ts');
const boundary = read('src/types/interfaces/interfaceDependencyBoundary.ts');

const sourceTs = ts('src');
const legacyRefs = sourceTs.filter(f => /StaticLaravelScanner|LaravelScanner/.test(read(f)));
const upstreamCompilerImports = allFiles('src/types/upstream').filter(f => f.endsWith('.ts')).filter(f => /from ['"][^'"]*compiler\//.test(read(f)));
const cliSourceImports = (() => {
  const cliRoot = path.resolve(root, '..', 'cli', 'src');
  if (!fs.existsSync(cliRoot)) return [];
  const result = [];
  const walk = (d) => {
    for (const e of fs.readdirSync(d, {withFileTypes:true})) {
      const x = path.join(d,e.name);
      if (e.isDirectory()) walk(x); else if (x.endsWith('.ts') && !x.includes(`${path.sep}__tests__${path.sep}`)) result.push(x);
    }
  };
  walk(cliRoot);
  return result.filter(f => /from ['"][^'"]*packages\/core\/src\//.test(fs.readFileSync(f,'utf8')) || /from ['"][^'"]*core\/src\//.test(fs.readFileSync(f,'utf8'))).map(f => path.relative(path.resolve(root,'..','cli'),f));
})();

const checks = {
  canonicalModelRelationIdentity: /kind: 'model_semantic_relation_identity'/.test(model) && /modelSemanticRelationIdentityKey/.test(model),
  schemaForeignKeyEvidenceCanonical: /kind: 'schema_foreign_key_evidence'/.test(schemaRelation) && /migrationProvenance/.test(schemaRelation),
  modelRelationCarriesSchemaProvenance: /provenance\?: ModelRelationProvenance/.test(model),
  canonicalRelationCarriesModelRelation: /kind: 'model_relation'/.test(semanticRefs) && /readonly relation: ModelSemanticRelation/.test(semanticRefs),
  modelRelationProjectionPreservesRelation: /relation\.relation/.test(projection) && /lineage: relation\.relation\.provenance/.test(projection),
  graphRelationPreservesProvenance: /readonly provenance\?/.test(graphRelation) && /ModelRelationProvenance/.test(graphRelation),
  graphEdgeIsProjectionAlias: /type GraphEdgeRelation = GraphSemanticRelation/.test(graphEdge),
  graphSinkUsesCanonicalModelRelationIdentity: /modelSemanticRelationIdentityKey\(relation\.provenance\.relation\.identity\)/.test(sink),
  graphSinkPreservesOriginalRelation: /this\.relations\.set\(key, relation\)/.test(sink),
  sourceModelBuildsModelRelationsOnce: /kind: 'model_relation' as const/.test(highLevel),
  manifestCarriesRelations: /relations: manifest\.sourceModel\.relations/.test(manifestScanner),
  dataflowProducerVocabularyClosed: /'request' \| 'route' \| 'controller' \| 'resource'/.test(dataflow),
  dataflowInterfaceGeneric: !/Laravel|Route|Controller|Resource|Model|Schema/.test(dataflowInterface),
  dependencyBoundaryGenericDirectional: /InterfaceDependencyBoundary<Upstream, Downstream>/.test(boundary) && /project: \(upstream: Upstream\) => Downstream/.test(boundary),
  upstreamNoCompilerImports: upstreamCompilerImports.length === 0,
  legacyScannerProductionEmpty: legacyRefs.length === 0,
  cliPackageSurfaceOnly: cliSourceImports.length === 0,
  ecommerceFixturePresent: exists('../../examples/ecommerce-shop-source/routes/api.php') || exists('../../examples/ecommerce-shop-source/routes/web.php'),
};

const counts = {
  upstreamCompilerImports: upstreamCompilerImports.length,
  legacyRefs: legacyRefs.length,
  cliCoreSourceImports: cliSourceImports.length,
};
const violations = Object.entries(checks).filter(([,v]) => !v).map(([k]) => k);
const result = { phase: 1126, direction: 'upstream => wiring => interface => downstream', checks, counts, violations, passed: violations.length === 0 };
console.log(JSON.stringify(result, null, 2));
process.exit(result.passed ? 0 : 1);
