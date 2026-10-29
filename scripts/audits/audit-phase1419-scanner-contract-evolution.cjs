const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
const sequence = read('packages/core/src/types/upstream/scannerStatementSequenceAlgebra.ts');
const tokenStructure = read('packages/core/src/types/upstream/scannerTokenStructureAlgebra.ts');
const assignment = read('packages/core/src/types/upstream/scannerAssignmentPartsAlgebra.ts');
const runtime = read('packages/core/src/compiler/frontend/php/astClassifierRuntime.ts');
const pkg = JSON.parse(read('package.json'));
const checks = [
  ['statement sequence returns closed completion or contract-violation ADT', /kind: 'complete'/.test(sequence) && /kind: 'contract_violation'/.test(sequence) && /malformed_boundary/.test(sequence)],
  ['statement sequence rejects non-progress instead of returning prefix', /non_progressing_structured_statement/.test(sequence) && /non_progressing_simple_statement/.test(sequence)],
  ['token structure algebra owns top-level traversal', /const scan =/.test(tokenStructure) && /stack: readonly string\[\]/.test(tokenStructure)],
  ['token structure distinguishes found, absent, and malformed', /kind: 'found'/.test(tokenStructure) && /kind: 'not_found'/.test(tokenStructure) && /kind: 'malformed'/.test(tokenStructure)],
  ['runtime top-level operator delegates to token algebra', runtime.slice(runtime.indexOf('function findTopLevelOperator('), runtime.indexOf('function findExpressionRootOperator(')).includes('scannerTokenStructureAlgebra.findTopLevel') && !runtime.slice(runtime.indexOf('function findTopLevelOperator('), runtime.indexOf('function findExpressionRootOperator(')).includes('const token = tokens[index]')],
  ['runtime refuses sequence contract violation', /Scanner statement sequence contract violation/.test(runtime)],
  ['assignment resolution no longer searches selected operator twice', (assignment.match(/contract\.findTopLevelOperator\(contract\.tokens, operator\.token\)/g) || []).length === 1],
  ['no any introduced in new scanner algebra', !/\bany\b/.test(tokenStructure) && !/\bany\b/.test(sequence)],
  ['build script preserved', pkg.scripts && pkg.scripts.build === 'tsdown'],
];
const result = { phase: 1419, title: 'scanner-contract-evolution', checks: checks.map(([name, passed]) => ({ name, passed })), passed: checks.filter(([, passed]) => passed).length, total: checks.length, status: checks.every(([, passed]) => passed) ? 'passed_with_typecheck_pending' : 'failed' };
const report = path.join(root, 'scripts/audits/reports/phase1419-scanner-contract-evolution.json');
fs.mkdirSync(path.dirname(report), { recursive: true });
fs.writeFileSync(report, JSON.stringify(result, null, 2) + '\n');
console.log(JSON.stringify(result, null, 2));
if (result.status === 'failed') process.exitCode = 1;
