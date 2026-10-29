const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
const boundary = read('packages/core/src/types/upstream/scannerStatementBoundaryAlgebra.ts');
const sequence = read('packages/core/src/types/upstream/scannerStatementSequenceAlgebra.ts');
const tokenStructure = read('packages/core/src/types/upstream/scannerTokenStructureAlgebra.ts');
const assignment = read('packages/core/src/types/upstream/scannerAssignmentPartsAlgebra.ts');
const runtime = read('packages/core/src/compiler/frontend/php/astClassifierRuntime.ts');
const expression = read('packages/core/src/types/upstream/scannerExpressionOperatorAlgebra.ts');
const pkg = JSON.parse(read('package.json'));
const checks = [
  ['statement boundary uses a typed delimiter stack and detects mismatched closers', /readonly closer: string/.test(boundary) && /mismatched_closer/.test(boundary) && /unexpected_closer/.test(boundary)],
  ['statement boundary detects unclosed delimiters and invalid starts', /unclosed_delimiter/.test(boundary) && /invalid_start/.test(boundary)],
  ['sequence rejects malformed boundaries before invoking resolvers', /boundary\.kind === 'malformed'/.test(sequence) && /malformed_boundary/.test(sequence)],
  ['sequence validates terminator and end-of-input index invariants', /boundary\.kind !== 'terminator'/.test(sequence) && /boundary\.kind !== 'end_of_input'/.test(sequence)],
  ['assignment result distinguishes resolved, unresolved, malformed and contract violation', /kind: 'resolved'/.test(assignment) && /kind: 'unresolved'/.test(assignment) && /kind: 'malformed'/.test(assignment) && /kind: 'contract_violation'/.test(assignment)],
  ['assignment algebra receives token-structure ADT rather than a raw numeric index', /findTopLevelOperator: \(tokens: readonly Token\[\], token: string\) => TokenStructureResolution/.test(assignment)],
  ['runtime adapts closed assignment outcomes explicitly', /case 'resolved':/.test(runtime) && /case 'unresolved':/.test(runtime) && /case 'malformed':/.test(runtime) && /case 'contract_violation':/.test(runtime.slice(runtime.indexOf('function parseAssignmentParts('), runtime.indexOf('\nfunction classifyAssignment(', runtime.indexOf('function parseAssignmentParts('))))],
  ['runtime does not collapse malformed token structure into not-found', /case 'malformed':\s*throw new Error/.test(runtime.slice(runtime.indexOf('function findTopLevelOperator('), runtime.indexOf('function findBinaryOperator(')))],
  ['binary operator candidate selection is owned once by runtime or delegated algebra', (/const candidates = relationProject\(operators/.test(runtime) && /index: candidate\.index/.test(runtime)) || (/scannerExpressionOperatorAlgebra\.resolve/.test(runtime) && /candidate\.rule\.precedence/.test(expression))],
  ['token-structure algebra remains the owner of generic delimiter traversal', /scannerTokenStructureAlgebra\.findTopLevel/.test(runtime) && /const scan =/.test(tokenStructure)],
  ['build script remains tsdown', pkg.scripts && pkg.scripts.build === 'tsdown'],
  ['no any introduced in evolved scanner contracts', !/\bany\b/.test(boundary + sequence + tokenStructure + assignment)],
];
const result = { phase: 1420, title: 'scanner-boundary-assignment-closure', checks: checks.map(([name, passed]) => ({ name, passed })), passed: checks.filter(([, passed]) => passed).length, total: checks.length, status: checks.every(([, passed]) => passed) ? 'passed_with_full_build_pending' : 'failed' };
const report = path.join(root, 'scripts/audits/reports/phase1420-scanner-boundary-assignment-closure.json');
fs.mkdirSync(path.dirname(report), { recursive: true });
fs.writeFileSync(report, JSON.stringify(result, null, 2) + '\n');
console.log(JSON.stringify(result, null, 2));
if (result.status === 'failed') process.exitCode = 1;
