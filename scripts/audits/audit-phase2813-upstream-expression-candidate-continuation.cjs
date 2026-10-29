const fs = require('node:fs');
const path = require('node:path');
const root = process.cwd();
let passed = 0;
let failed = 0;
function check(name, condition, detail) {
  if (condition) { passed += 1; process.stdout.write(`PASS ${name}: ${detail}\n`); }
  else { failed += 1; process.stderr.write(`FAIL ${name}: ${detail}\n`); }
}
function read(relative) { return fs.readFileSync(path.join(root, relative), 'utf8'); }
const contract = read('packages/core/src/types/upstream/scannerAstExpressionCandidateInterface.ts');
const algebra = read('packages/core/src/types/upstream/scannerAstExpressionCandidateAlgebra.ts');
const runtime = read('packages/core/src/compiler/frontend/php/astClassifierRuntime.ts');
const test = read('packages/core/src/types/upstream/__test__/scannerAstExpressionCandidateAlgebra.phase1457.test.ts');
const pkg = JSON.parse(read('package.json'));
const collectionsBytes = fs.statSync(path.join(root, 'packages/core/src/types/upstream/collections.ts')).size;
check('existing upstream owner reused', /ScannerExpressionCandidateJudgment/.test(contract) && /ScannerExpressionCandidateInterface/.test(contract), 'candidate judgment contract evolved in its existing owner');
check('domain continuation named explicitly', /continueForAstClassification/.test(contract), 'candidate ADT owns the operation that follows its classification outcome');
check('both ADT branches implement operation', (contract.match(/continueForAstClassification:/g) || []).length === 2, 'not_applicable and resolved are both operable');
check('no generic reasoning primitive added', !/export\s+(?:const|function)\s+(?:fold|visit|match|dispatch|continue)(?:[A-Z]|\b)/.test(contract + algebra), 'operation remains specific to AST candidate classification');
check('candidate producer creates frozen operated judgments', /notApplicableJudgment/.test(algebra) && /resolvedJudgment/.test(algebra) && /Object\.freeze/.test(algebra), 'producer returns immutable ADT branches with executable continuation');
check('runtime consumes upstream-owned operation', /candidateJudgment\.continueForAstClassification\(/.test(runtime), 'AST runtime delegates discriminant elimination to the upstream judgment');
check('runtime no longer switches on candidate judgment', !/switch\s*\(candidateJudgment\.kind\)/.test(runtime), 'downstream does not reclassify the source-candidate ADT');
check('downstream AST judgment switch preserved', /switch\s*\(judgment\.kind\)/.test(runtime), 'separate AST-classification ADT retains its exhaustive handling');
check('behavior test covers continuation', /continueForAstClassification/.test(test), 'candidate no-match continuation has a regression assertion');
check('collections module remains exactly empty', collectionsBytes === 0, `actual size=${collectionsBytes} bytes`);
check('audit command registered', pkg.scripts['audit:phase2813-upstream-expression-candidate-continuation'] === 'node scripts/audits/audit-phase2813-upstream-expression-candidate-continuation.cjs', 'audit can be rerun from package scripts');
process.stdout.write(`\nPhase 2813 upstream expression candidate continuation audit: ${passed}/11 passed; ${failed} failed.\n`);
if (failed > 0) process.exitCode = 1;
