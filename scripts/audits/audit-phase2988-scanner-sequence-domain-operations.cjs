const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const sequencePath = path.join(root, 'packages/core/src/types/upstream/scannerStatementSequenceAlgebra.ts');
const sequence = fs.readFileSync(sequencePath, 'utf8');
const pkgPath = path.join(root, 'package.json');
const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
const checks = [
  ['sequence algebra has no deleted relation foundation imports', !/from\s+['"][^'"]*(?:relationMembership|relationalSequence|semanticRelations)['"]/.test(sequence)],
  ['cursor arithmetic is owned by a scanner-domain cursor operation', /type StatementSequenceCursor/.test(sequence) && /advancePastCurrent/.test(sequence) && /advanceBy/.test(sequence)],
  ['progress is represented by a continuation-bearing domain judgment', /type StatementSequenceProgressJudgment/.test(sequence) && /kind: 'progressing'/.test(sequence) && /kind: 'stalled'/.test(sequence) && /continueWith/.test(sequence)],
  ['partition validity is represented by a continuation-bearing domain judgment', /type StatementPartitionJudgment/.test(sequence) && /kind: 'valid_partition'/.test(sequence) && /kind: 'invalid_partition'/.test(sequence) && /continueWith/.test(sequence)],
  ['runtime export is an explicit interface-typed operation object', /export const scannerStatementSequenceAlgebra:\s*ScannerStatementSequenceInterface\s*=\s*Object\.freeze\(/.test(sequence)],
  ['legacy relationGate and relationAdvanceIndex calls are absent', !/relationGate|relationAdvanceIndex/.test(sequence)],
  ['public sequence result remains a closed serializable ADT', /StatementSequenceResolution/.test(sequence) && !/continueWith/.test(sequence.slice(sequence.indexOf('export const scannerStatementSequenceAlgebra')))],
  ['Phase 2987 upstream-to-CLI-to-manifest trace is retained', fs.existsSync(path.join(root, 'PHASE2987_FULLY_EXPLICIT_SCANNER_UPSTREAM_CLI_MANIFEST_TRACE.md'))],
  ['deleted generic relation foundation files remain absent', !['relationMembership.ts', 'relationalSequence.ts', 'semanticRelations.ts'].some(name => fs.existsSync(path.join(root, 'packages/core/src/semantic/relations', name)))],
  ['package audit command is registered', typeof pkg.scripts?.['audit:phase2988-scanner-sequence-domain-operations'] === 'string'],
];
const failures = checks.filter(([, passed]) => !passed);
console.log(JSON.stringify({ phase: 2988, passed: checks.length - failures.length, total: checks.length, checks: checks.map(([name, passed]) => ({ name, passed })) }, null, 2));
if (failures.length) process.exitCode = 1;
