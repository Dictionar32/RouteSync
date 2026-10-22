const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '../..');
const read = relative => fs.readFileSync(path.join(root, relative), 'utf8');
const checks = [];
const check = (name, condition) => checks.push({ name, passed: Boolean(condition) });

const interfaceSource = read('packages/core/src/types/upstream/semanticDecisionInterface.ts');
const algebraSource = read('packages/core/src/types/upstream/semanticDecisionAlgebra.ts');
const candidateInterface = read('packages/core/src/types/upstream/scannerAstExpressionCandidateInterface.ts');
const candidateAlgebra = read('packages/core/src/types/upstream/scannerAstExpressionCandidateAlgebra.ts');
const runtimeSource = read('packages/core/src/compiler/scanner/lexer/astClassifierRuntime.ts');
const barrelSource = read('packages/core/src/types/upstream/index.ts');
const decisionTest = read('packages/core/src/types/upstream/__test__/semanticDecisionAlgebra.phase1457.test.ts');
const candidateTest = read('packages/core/src/types/upstream/__test__/scannerAstExpressionCandidateAlgebra.phase1457.test.ts');
const docsSource = read('packages/core/src/types/upstream/docs/PHASE1457_SEMANTIC_DECISION_APPLICABILITY_CONTRACT.md');

check('semantic rule interface requires applicability and derivation callbacks',
  interfaceSource.includes('readonly applies:') && interfaceSource.includes('readonly derive:'));
check('closed decision judgment includes invalid rule contract', interfaceSource.includes("'invalid_rule_contract'"));
check('decision algebra validates callbacks before evaluating candidates',
  algebraSource.includes("typeof rule.applies !== 'function' || typeof rule.derive !== 'function'") && algebraSource.includes("reason: 'invalid_rule_contract'"));
check('decision algebra gates derivation behind positive applicability',
  algebraSource.indexOf('if (!applicable) continue;') < algebraSource.indexOf('const result = rule.derive(input)'));
check('candidate interface exposes a closed candidate judgment',
  candidateInterface.includes("kind: 'not_applicable'") && candidateInterface.includes("kind: 'resolved'") && candidateInterface.includes('ScannerExpressionCandidateId'));
check('candidate algebra owns syntax candidate discovery',
  candidateAlgebra.includes('scannerTokenStructureInterface.locateTopLevel') && candidateAlgebra.includes('scannerTokenStructureInterface.locateTopLevelCandidates'));
check('candidate algebra returns evidence with each candidate', candidateAlgebra.includes('evidence: Object.freeze([...evidence])'));
check('candidate algebra contains no AST construction or runtime calls', !candidateAlgebra.includes('PhpAstFactory') && !candidateAlgebra.includes('classifyAstTokens'));
check('runtime delegates candidate discovery to upstream algebra', runtimeSource.includes('scannerAstExpressionCandidateContractAlgebra.resolve('));
check('runtime rule applicability consumes candidate IDs only', runtimeSource.includes('candidateIds.has(id)') && !runtimeSource.includes('hasTopLevelCandidate(') && !runtimeSource.includes('hasAssignmentCandidate('));
check('runtime does not register all expression rules as always applicable', !runtimeSource.includes('priority, applies: alwaysApplicable'));
check('upstream barrel exports candidate interface and algebra', barrelSource.includes("export * from './scannerAstExpressionCandidateInterface'") && barrelSource.includes("export { scannerAstExpressionCandidateContractAlgebra } from './scannerAstExpressionCandidateAlgebra'"));
check('candidate tests cover empty input, cast, nested operators, and assignment', candidateTest.includes('not-applicable for empty evidence') && candidateTest.includes('cast from its leading token evidence') && candidateTest.includes('operator is nested') && candidateTest.includes('assignment candidates only at top level'));
check('decision tests cover applicability suppression and malformed contract rejection', decisionTest.includes('does not derive a rule when its applicability judgment is negative') && decisionTest.includes('invalid_rule_contract'));
check('documentation records downstream boundary and no eager candidate reasoning', docsSource.includes('downstream') && docsSource.includes('eager') && docsSource.includes('runtime wiring'));
check('no any was introduced in new candidate interface or algebra', !/\bany\b/.test(candidateInterface) && !/\bany\b/.test(candidateAlgebra));

for (const result of checks) console.log(`${result.passed ? 'PASS' : 'FAIL'} ${result.name}`);
console.log(`\n${checks.filter(result => result.passed).length}/${checks.length} checks passed`);
if (checks.some(result => !result.passed)) process.exitCode = 1;
