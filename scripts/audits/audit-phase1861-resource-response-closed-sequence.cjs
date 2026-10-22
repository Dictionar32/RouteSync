const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '../..');
const read = relative => fs.readFileSync(path.join(root, relative), 'utf8');
const checks = [
  ['resource judgment exposes one artifact-sequence contract', /readonly artifacts: LaravelResourceScanArtifactSequence/.test(read('packages/core/src/types/upstream/laravelResourceScannerInterface.ts'))],
  ['artifact sequence is a named domain contract', /interface LaravelResourceScanArtifactSequence\s*\{[\s\S]*?kind: 'laravel_resource_scan_artifact_sequence'[\s\S]*?items: Sequence<LaravelResourceScanArtifact>/.test(read('packages/core/src/types/upstream/laravelResourceScannerInterface.ts'))],
  ['parallel resource outcome arrays removed from final judgment', !/readonly (resources|rejected|modelBindingJudgments): readonly/.test((read('packages/core/src/types/upstream/laravelResourceScannerInterface.ts').split('export interface LaravelResourceScanJudgment')[1]) || '')],
  ['resolved and rejected outcomes remain a discriminated artifact union', /export type LaravelResourceScanArtifact = LaravelResourceResolvedArtifact \| LaravelResourceRejectedArtifact/.test(read('packages/core/src/types/upstream/laravelResourceScannerInterface.ts'))],
  ['integrated contract declares source-ordered paired outcomes', /responseShape: 'one_source_ordered_artifact_sequence_pairs_each_resource_outcome_with_its_own_binding_judgment'/.test(read('packages/core/src/types/upstream/laravelResourceScannerInterface.ts'))],
  ['runtime returns named sequence rather than parallel arrays', /artifacts: Object\.freeze\(\{ kind: 'laravel_resource_scan_artifact_sequence', items: sequenceFromArray\(resources\.artifacts\) \}\)/.test(read('packages/core/src/compiler/scanner/wiring/laravelResourceScanner.ts'))],
  ['runtime accumulates source-correlated artifacts in one sequence source', /artifacts: \[\.\.\.state\.artifacts, (rejected|accepted)\.artifact\]/.test(read('packages/core/src/compiler/scanner/wiring/laravelResourceScanner.ts'))],
  ['downstream AST projection reads the semantic sequence', /relationSequenceToArray\(resourceScan\.artifacts\.items\)/.test(read('packages/core/src/compiler/scanner/wiring/laravelSourceAstPipeline.ts'))],
  ['downstream no longer reads removed parallel arrays', !/resourceScan\.(resources|rejected|modelBindingJudgments)/.test(read('packages/core/src/compiler/scanner/wiring/laravelSourceAstPipeline.ts'))],
  ['public core export exposes the sequence domain type', /LaravelResourceScanArtifactSequence/.test(read('packages/core/src/index.ts'))],
];

let failed = 0;
for (const [name, passed] of checks) {
  process.stdout.write(`${passed ? 'PASS' : 'FAIL'} ${name}\n`);
  failed += Number(!passed);
}
process.stdout.write(`${checks.length - failed}/${checks.length} PASS\n`);
process.exitCode = failed ? 1 : 0;
