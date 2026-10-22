const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '../..');
const sourcePath = path.join(root, 'src/types/upstream/highLevelSourceModel.ts');
const source = fs.readFileSync(sourcePath, 'utf8');
const report = {
  phase: 2623,
  scope: 'upstream source-model relation authority',
  checks: [
    {
      name: 'canonical source-model builder interface exists',
      passed: source.includes('export interface CompleteLaravelSourceModelBuilderInterface'),
    },
    {
      name: 'canonical source-model builder operation exists',
      passed: source.includes('export const completeLaravelSourceModelBuilder: CompleteLaravelSourceModelBuilderInterface'),
    },
    {
      name: 'source-model no longer imports generic semantic relation sequence helpers',
      passed: !source.includes("from '../../semantic/relations/relationalSequence'") && source.includes('sequenceAlgebra.'),
    },
    {
      name: 'reference-index authority is traceable',
      passed: source.includes('sourceModelReferenceIndexFromCatalog') && source.includes('SemanticRelationGraph'),
    },
  ],
  unresolvedRootCause: 'The generic Sequence-operation dependency has been moved to the upstream collections owner. Phase 2625 separately closes first-match identity ambiguity; full TypeScript 7 typecheck and CLI end-to-end remain unverified.',
};

for (const check of report.checks) {
  process.stdout.write(`${check.passed ? 'PASS' : 'FAIL'} ${check.name}\n`);
}
process.stdout.write(`KNOWN ROOT CAUSE: ${report.unresolvedRootCause}\n`);
if (report.checks.some(check => !check.passed)) process.exitCode = 1;
