const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '../..');
const collectionsPath = path.join(root, 'packages/core/src/types/upstream/collections.ts');
const pipelinePath = path.join(root, 'packages/core/src/compiler/scanner/wiring/laravelSourceAstPipeline.ts');
const collections = fs.readFileSync(collectionsPath, 'utf8');
const pipeline = fs.readFileSync(pipelinePath, 'utf8');
const checks = [
  ['upstream Sequence owns its ADT instead of re-exporting relation Sequence', /export type Sequence<T>\s*=\s*[\s\S]*?kind: 'empty'[\s\S]*?kind: 'cons'/.test(collections) && !/from ['"]\.\.\/\.\.\/semantic\/relations\//.test(collections)],
  ['upstream collection matchers no longer import relation folds/refinements', !/relationOptionFold|relationRefine|relationEqual|semantic\/relations/.test(collections)],
  ['source-AST pipeline no longer imports semantic relations directly', !/semantic\/relations|semantic\/foundation/.test(pipeline)],
  ['source-AST pipeline sequence construction preserves the existing empty/cons ADT', /reduceRight<Sequence<T>>/.test(pipeline) && /kind: "empty"/.test(pipeline) && /kind: "cons"/.test(pipeline)],
  ['source-AST discovery keeps the explicit empty/many closed outcomes', /kind: "discovered_empty"/.test(pipeline) && /kind: "discovered_many"/.test(pipeline)],
  ['resource projection still filters only the resolved-resource ADT arm', /artifact is LaravelResourceResolvedArtifact => artifact\.kind === 'laravel_resource_resolved_artifact'/.test(pipeline)],
  ['source evidence and scanner interface wiring remain present', /LaravelSourceAstPipelineDependenciesInterface/.test(pipeline) && /createLaravelSourceAstPipeline/.test(pipeline)],
];
let failures = 0;
for (const [name, passed] of checks) {
  process.stdout.write(`${passed ? 'PASS' : 'FAIL'} ${name}\n`);
  failures += Number(!passed);
}
process.stdout.write(`Phase 2253: ${checks.length - failures}/${checks.length} checks passed\n`);
process.exitCode = Number(failures > 0);
