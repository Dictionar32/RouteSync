const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');
const root = path.resolve(__dirname, '../..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
const files = {
  collections: 'packages/core/src/types/upstream/collections.ts',
  pipeline: 'packages/core/src/compiler/scanner/wiring/laravelSourceAstPipeline.ts',
  lowerer: 'packages/core/src/compiler/scanner/wiring/routeManifestLowerer.ts',
  projection: 'packages/core/src/compiler/scanner/wiring/routeManifestProjectionInputs.ts',
  sourceModel: 'packages/core/src/types/upstream/highLevelSourceModel.ts',
  formRequestScanner: 'packages/core/src/compiler/scanner/laravelFormRequestScanner.ts',
  formRequestOperation: 'packages/core/src/compiler/scanner/operations/FormRequestScanner.ts',
};
const source = Object.fromEntries(Object.entries(files).map(([key, file]) => [key, read(file)]));
const checks = [
  ['Discovered<T> and matchDiscovered are removed from the canonical collection contract', !/\bDiscovered\s*</.test(source.collections) && !/\bmatchDiscovered\b/.test(source.collections)],
  ['SourceDiscovery has only not_scanned or scanned with direct readonly items', /export type SourceDiscovery<T>\s*=\s*\|\s*\{\s*readonly kind: 'not_scanned'\s*\}\s*\|\s*\{\s*readonly kind: 'scanned'; readonly items: readonly T\[\]\s*\}/s.test(source.collections)],
  ['Source-AST producer emits scanned arrays directly, with no discovered_empty/many variants', /return \{ kind: "scanned", items: Object\.freeze\(\[\.\.\.items\]\) \};/.test(source.pipeline) && !/discovered_empty|discovered_many|\bSequence\s*</.test(source.pipeline)],
  ['Manifest lowerer rejects not_scanned instead of fabricating an empty collection', !/discovery\.kind === 'not_scanned' \? Object\.freeze\(\[\]\) : discovery\.items/.test(source.lowerer) && /CompleteSourceAst invariant violated/.test(source.lowerer) && !/discovered_empty|discovered_many|matchDiscovered/.test(source.lowerer)],
  ['Manifest projection inputs reject not_scanned instead of fabricating an empty collection', !/discovery\.kind === 'not_scanned' \? Object\.freeze\(\[\]\) : discovery\.items/.test(source.projection) && /CompleteSourceAst invariant violated/.test(source.projection) && !/discovered_empty|discovered_many|matchDiscovered/.test(source.projection)],
  ['Both FormRequest collection producers no longer construct a discovery union or Sequence', [source.formRequestScanner, source.formRequestOperation].every(text => /kind: 'scanned', items: Object\.freeze\(\[\.\.\.requests\]\)/.test(text) && !/discoveryFromSequence|sequenceFromRequests|discovered_empty|discovered_many/.test(text))],
  ['Complete source model consumes the flat discovery array without a Discovered fold', /scanned: scanned => sequenceAlgebra\.fromArray\(scanned\.items\)/.test(source.sourceModel) && !/matchDiscovered|scanned\.result/.test(source.sourceModel)],
  ['All seven touched TypeScript files parse without syntax diagnostics', Object.values(source).every((text, index) => ts.createSourceFile(`phase2769-${index}.ts`, text, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS).parseDiagnostics.length === 0)],
];
for (const [name, ok] of checks) console.log(`${ok ? 'PASS' : 'FAIL'} ${name}`);
console.log(`Phase 2769 flat source-discovery contract audit: ${checks.filter(([, ok]) => ok).length}/${checks.length}`);
if (checks.some(([, ok]) => !ok)) process.exitCode = 1;
