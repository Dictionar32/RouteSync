const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
const runtime = read('packages/core/src/compiler/scanner/lexer/astClassifierRuntime.ts');
const provider = read('packages/core/src/compiler/scanner/lexer/phpExpressionStructureEvidenceProvider.ts');
const upstream = read('packages/core/src/types/upstream/scannerExpressionStructure.ts');
const checks = [
  ['runtime delegates PHP compound evidence collection to provider', /providePhpExpressionStructureJudgment\(tokens/.test(runtime)],
  ['runtime no longer declares compound candidate IDs', !/id: 'short-ternary'[\s\S]*id: 'unary'/.test(runtime)],
  ['provider owns PHP-specific compound candidate IDs', /id: 'short-ternary'[\s\S]*id: 'unary'/.test(provider)],
  ['provider calls upstream judgment authority', /expressionStructureJudgmentAuthority\.resolve/.test(provider)],
  ['upstream authority calls candidate algebra', /scannerExpressionCandidateAlgebra\.resolveFirst\(contract\)/.test(upstream)],
  ['runtime consumes closed judgment exhaustively', /switch \(judgment\.kind\)[\s\S]*case 'not_structured':[\s\S]*case 'contract_violation':[\s\S]*case 'structured':/.test(runtime)],
  ['AST projection remains downstream of structured judgment', /case 'structured': return relationSome\(projectPhpExpressionStructure\(judgment\.structure/.test(runtime)],
  ['provider accepts scanner services explicitly instead of importing runtime', /PhpExpressionStructureEvidenceServices/.test(provider) && !/from '\.\/astClassifierRuntime'/.test(provider)],
  ['candidate priorities remain contract-owned', /scannerExpressionStructurePriority\('short-ternary'\)/.test(provider) && /SCANNER_EXPRESSION_STRUCTURE_PRIORITY/.test(read('packages/core/src/types/upstream/scannerExpressionCandidateAlgebra.ts'))],
  ['runtime does not invoke candidate algebra directly', !/scannerExpressionCandidateAlgebra\.resolveFirst/.test(runtime)],
];
let failed = 0;
for (const [name, passed] of checks) {
  process.stdout.write(`${passed ? 'PASS' : 'FAIL'} ${name}\n`);
  if (!passed) failed += 1;
}
process.stdout.write(`${checks.length - failed}/${checks.length} checks passed\n`);
if (failed) process.exitCode = 1;
