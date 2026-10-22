const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
const runtime = read('packages/core/src/compiler/scanner/lexer/astClassifierRuntime.ts');
const boundary = read('packages/core/src/types/upstream/scannerStatementBoundaryAlgebra.ts');
const sequence = read('packages/core/src/types/upstream/scannerStatementSequenceAlgebra.ts');
const pkg = JSON.parse(read('package.json'));
const checks = [
  ['canonical boundary contract owns delimiter-state resolution and exposes a closed partition judgment', /ScannerStatementBoundaryInterface/.test(boundary) && /scannerStatementBoundaryContractAlgebra/.test(boundary) && /stack/.test(boundary) && /parentheses/.test(boundary) && /brackets/.test(boundary) && /braces/.test(boundary)],
  ['boundary returns closed resolution ADT', /kind: 'terminator'/.test(boundary) && /kind: 'end_of_input'/.test(boundary) && /kind: 'malformed'/.test(boundary)],
  ['sequence contract owns cursor transitions', /StatementSequenceContract/.test(sequence) && /parseAt/.test(sequence) && /nextIndex > index/.test(sequence)],
  ['sequence algebra accepts injected grammar capabilities', /resolveStructured/.test(sequence) && /resolveSimple/.test(sequence) && /findBoundary/.test(sequence)],
  ['runtime delegates statement traversal to algebra', /scannerStatementSequenceAlgebra\.parse/.test(runtime) && !/function parseStatements\([^)]*index\s*=/.test(runtime)],
  ['runtime delegates delimiter scanning to canonical boundary contract algebra', /scannerStatementBoundaryContractAlgebra\.resolve/.test(runtime) && !/function findStatementEnd/.test(runtime)],
  ['structured rules receive boundary from sequence contract', /resolveStructured: \(source, start, end\) => parseStructuredStatement\(source, start, end\)/.test(runtime) && /function parseStructuredStatement\(tokens: readonly TokenDescriptor\[\], start: number, end: number\)/.test(runtime)],
  ['build script preserved', pkg.scripts && pkg.scripts.build === 'tsdown'],
  ['no any introduced in new contracts', !/\bany\b/.test(boundary + sequence)],
];
const result = { phase: 1417, title: 'scanner-runtime-interface-algebra', checks: checks.map(([name, passed]) => ({ name, passed })), passed: checks.filter(([, passed]) => passed).length, total: checks.length, status: checks.every(([, passed]) => passed) ? 'passed_with_typecheck_pending' : 'failed' };
const report = path.join(root, 'scripts/audits/reports/phase1417-scanner-runtime-interface-algebra.json');
fs.mkdirSync(path.dirname(report), { recursive: true });
fs.writeFileSync(report, JSON.stringify(result, null, 2) + '\n');
console.log(JSON.stringify(result, null, 2));
if (result.status === 'failed') process.exitCode = 1;
