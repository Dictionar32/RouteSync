const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
const contract = read('packages/core/src/types/upstream/scannerStatementBoundaryInterface.ts');
const barrel = read('packages/core/src/types/upstream/index.ts');
const algebra = read('packages/core/src/types/upstream/scannerStatementBoundaryAlgebra.ts');
const sequence = read('packages/core/src/types/upstream/scannerStatementSequenceAlgebra.ts');
const runtime = read('packages/core/src/compiler/scanner/lexer/astClassifierRuntime.ts');
const docs = read('packages/core/src/types/upstream/docs/PHASE1450_STATEMENT_BOUNDARY_INTERFACE_FIRST.md');
const checks = [
  ['public statement boundary interface exists', /export interface ScannerStatementBoundaryInterface/.test(contract)],
  ['query begins from candidate token suffix without numeric start cursor', /StatementBoundaryQuery<Token>[\s\S]*readonly tokens: readonly Token\[\]/.test(contract) && !/readonly start\s*:/.test(contract)],
  ['terminator judgment returns statement, terminator, and remaining partitions', /kind: 'terminator'[\s\S]*readonly statement: readonly Token\[\][\s\S]*readonly terminator: Token[\s\S]*readonly remaining: readonly Token\[\]/.test(contract)],
  ['end-of-input judgment returns the remaining statement partition', /kind: 'end_of_input'[\s\S]*readonly statement: readonly Token\[\]/.test(contract)],
  ['malformed judgment uses source evidence location', /kind: 'malformed'[\s\S]*readonly location: TokenEvidenceLocation<Token>/.test(contract)],
  ['malformed reasons are closed and typed', /'unexpected_closer' \| 'mismatched_closer' \| 'unclosed_delimiter'/.test(contract)],
  ['public judgments expose no cursor index or delimiter counters', !/readonly index\s*:|readonly parentheses\s*:|readonly brackets\s*:|readonly braces\s*:/.test(contract)],
  ['interface types are exported through upstream barrel', /ScannerStatementBoundaryInterface, StatementBoundaryQuery, StatementBoundaryJudgment/.test(barrel)],
  ['boundary algebra remains unchanged in this interface-first phase', /readonly start: number/.test(algebra) && /readonly index: number/.test(algebra)],
  ['sequence algebra and runtime are not migrated prematurely', /boundary\.index/.test(sequence) && /findStatementBoundary\(source, start\)/.test(runtime)],
  ['migration order and validation boundary are documented', /1\. Define the interface[\s\S]*2\. Make the statement-boundary algebra[\s\S]*3\. Migrate statement-sequence wiring[\s\S]*4\. Remove duplicate runtime[\s\S]*5\. Verify AST output/.test(docs)],
  ['no any introduced in the new public interface', !/\bany\b/.test(contract)],
];
let failures = 0;
for (const [name, ok] of checks) {
  process.stdout.write(`${ok ? 'PASS' : 'FAIL'} ${name}\n`);
  if (!ok) failures += 1;
}
process.stdout.write(`Phase 1450 statement-boundary interface first: ${checks.length - failures}/${checks.length}\n`);
process.exitCode = failures ? 1 : 0;
