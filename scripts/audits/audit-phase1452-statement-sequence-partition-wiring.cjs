const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
const contract = read('packages/core/src/types/upstream/scannerStatementBoundaryInterface.ts');
const boundary = read('packages/core/src/types/upstream/scannerStatementBoundaryAlgebra.ts');
const sequence = read('packages/core/src/types/upstream/scannerStatementSequenceAlgebra.ts');
const runtime = read('packages/core/src/compiler/frontend/php/astClassifierRuntime.ts');
const tests = read('packages/core/src/types/upstream/__test__/scannerStatementSequenceAlgebra.phase1419.test.ts');
const docs = read('packages/core/src/types/upstream/docs/PHASE1452_STATEMENT_SEQUENCE_PARTITION_WIRING.md');
const checks = [
  ['canonical interface remains partition-based', /ScannerStatementBoundaryInterface/.test(contract) && /readonly remaining: readonly Token\[\]/.test(contract) && !/readonly start\s*:/.test(contract)],
  ['canonical algebra still implements the interface', /scannerStatementBoundaryContractAlgebra: ScannerStatementBoundaryInterface/.test(boundary)],
  ['sequence boundary callback receives suffix only', /findBoundary: \(tokens: readonly Token\[\]\) => StatementBoundaryJudgment<Token>/.test(sequence) && !/findBoundary: \(tokens: readonly Token\[\], start: number\)/.test(sequence)],
  ['sequence validates returned partitions before advancing', /partitionIsValid/.test(sequence) && /samePartition/.test(sequence) && /reason: 'invalid_boundary'/.test(sequence)],
  ['sequence uses statement partition for simple statements', /resolveSimple\(boundary\.statement\)/.test(sequence)],
  ['malformed judgments stop sequence and preserve source location', /boundary\.location\.kind/.test(sequence) && /reason: 'malformed_boundary'/.test(sequence)],
  ['runtime wires the canonical algebra rather than legacy indexed facade', /scannerStatementBoundaryContractAlgebra/.test(runtime) && /findBoundary: source => scannerStatementBoundaryContractAlgebra\.resolve/.test(runtime) && !/function findStatementBoundary\(/.test(runtime) && !/import \{ scannerStatementBoundaryAlgebra \}/.test(runtime)],
  ['runtime simple-statement path consumes the partition', /resolveSimple: statement => parseSimpleStatement\(statement\)/.test(runtime)],
  ['sequence tests cover terminator partition progress', /consumes partition judgments and advances past the terminator/.test(tests)],
  ['sequence tests reject malformed partition coverage', /returned partitions do not cover the source suffix/.test(tests)],
  ['phase documents algebra, sequence, runtime ownership boundaries', /boundary algebra owns delimiter reasoning/.test(docs) && /sequence algebra owns traversal progress/.test(docs) && /runtime supplies the canonical boundary contract/.test(docs)],
  ['no any introduced in sequence boundary contract', !/\bany\b/.test(sequence)],
];
let failures = 0;
for (const [name, ok] of checks) {
  process.stdout.write(`${ok ? 'PASS' : 'FAIL'} ${name}\n`);
  if (!ok) failures += 1;
}
process.stdout.write(`Phase 1452 statement sequence partition wiring: ${checks.length - failures}/${checks.length}\n`);
process.exitCode = failures ? 1 : 0;
