const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
const boundaryInterface = read('packages/core/src/types/upstream/scannerStatementBoundaryInterface.ts');
const boundaryAlgebra = read('packages/core/src/types/upstream/scannerStatementBoundaryAlgebra.ts');
const sequence = read('packages/core/src/types/upstream/scannerStatementSequenceAlgebra.ts');
const runtime = read('packages/core/src/compiler/scanner/lexer/astClassifierRuntime.ts');
const docs = read('packages/core/src/types/upstream/docs/PHASE1453_STATEMENT_RUNTIME_EXECUTOR_SIMPLIFICATION.md');
const checks = [
  ['interface remains the closed partition contract', /interface ScannerStatementBoundaryInterface/.test(boundaryInterface) && /kind: 'terminator'/.test(boundaryInterface) && /kind: 'end_of_input'/.test(boundaryInterface) && /kind: 'malformed'/.test(boundaryInterface)],
  ['canonical algebra is the only delimiter reasoning authority', /scannerStatementBoundaryContractAlgebra: ScannerStatementBoundaryInterface/.test(boundaryAlgebra) && /const scan =/.test(boundaryAlgebra) && /scannerStatementBoundaryContractAlgebra\.resolve/.test(boundaryAlgebra)],
  ['sequence validates the partition before deriving span', /partitionIsValid/.test(sequence) && /index \+ statementLength/.test(sequence)],
  ['structured runtime callback receives span rather than boundary judgment', /resolveStructured: \(tokens: readonly Token\[\], start: number, end: number\)/.test(sequence) && /resolveStructured\(contract\.tokens, index, index \+ statementLength\)/.test(sequence) && !/resolveStructured: \(tokens: readonly Token\[\], start: number, boundary:/.test(sequence)],
  ['runtime calls canonical algebra directly in wiring', /findBoundary: source => scannerStatementBoundaryContractAlgebra\.resolve/.test(runtime)],
  ['redundant boundary forwarding helper removed', !/function findStatementBoundary\(/.test(runtime) && !/findStatementBoundary\(source\)/.test(runtime)],
  ['simple statement parser receives partition directly', /resolveSimple: statement => parseSimpleStatement\(statement\)/.test(runtime)],
  ['structured parser legacy index span is clearly bounded', /parseStructuredStatement\(source, start, end\)/.test(runtime) && /parseStructuredStatement\(tokens: readonly TokenDescriptor\[\], start: number, end: number\)/.test(runtime)],
  ['docs preserve the required pipeline and scope limitation', /Source token evidence/.test(docs) && /legacy parser representation/.test(docs) && /Downstream AST behavior requires runtime tests/.test(docs)],
  ['no any introduced into sequence algebra', !/\bany\b/.test(sequence)],
];
let failures = 0;
for (const [name, ok] of checks) {
  process.stdout.write(`${ok ? 'PASS' : 'FAIL'} ${name}\n`);
  if (!ok) failures += 1;
}
process.stdout.write(`Phase 1453 statement runtime executor simplification: ${checks.length - failures}/${checks.length}\n`);
process.exitCode = failures ? 1 : 0;
