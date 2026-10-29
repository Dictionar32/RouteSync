const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const read = (relative) => fs.readFileSync(path.join(root, relative), 'utf8');
const checks = [
  ['canonical judgment interface is declared separately', /interface ExpressionStructureJudgmentInterface/.test(read('packages/core/src/types/upstream/scannerExpressionJudgmentInterface.ts'))],
  ['interface accepts a named request contract', /ExpressionStructureJudgmentRequest/.test(read('packages/core/src/types/upstream/scannerExpressionJudgmentInterface.ts'))],
  ['closed malformed judgment refers to source evidence, not numeric index', /kind: 'malformed_source'; readonly ruleId: string; readonly location: ExpressionEvidenceLocation<Token>/.test(read('packages/core/src/types/upstream/scannerExpressionJudgmentInterface.ts')) && !/kind: 'malformed_source'; readonly ruleId: string; readonly index: number/.test(read('packages/core/src/types/upstream/scannerExpressionJudgmentInterface.ts'))],
  ['upstream authority implements the declared interface', /expressionStructureJudgmentAuthority: ExpressionStructureJudgmentInterface/.test(read('packages/core/src/types/upstream/scannerExpressionStructure.ts'))],
  ['provider wires through the authority interface object', /expressionStructureJudgmentAuthority\.resolve/.test(read('packages/core/src/compiler/frontend/php/phpExpressionStructureEvidenceProvider.ts'))],
  ['provider does not call the legacy positional resolver', !/resolveExpressionStructureJudgment\s*</.test(read('packages/core/src/compiler/frontend/php/phpExpressionStructureEvidenceProvider.ts'))],
  ['legacy positional resolver is not exported as a parallel authority', !/export const resolveExpressionStructureJudgment/.test(read('packages/core/src/types/upstream/scannerExpressionStructure.ts')) && !/resolveExpressionStructureJudgment/.test(read('packages/core/src/types/upstream/index.ts'))],
  ['provider supplies terminal evidence but does not construct closed judgments', /selectTerminal:[\s\S]*ExpressionStructureTerminalEvidence<TokenDescriptor>[\s\S]*kind: 'malformed_source'/.test(read('packages/core/src/compiler/frontend/php/phpExpressionStructureEvidenceProvider.ts')) && !/ruleId: candidate|attempts \}/.test(read('packages/core/src/compiler/frontend/php/phpExpressionStructureEvidenceProvider.ts'))],
  ['upstream authority closes terminal evidence with candidate identity and proof trail', /case 'malformed_source':[\s\S]*ruleId: resolution\.candidate[\s\S]*attempts: resolution\.attempts/.test(read('packages/core/src/types/upstream/scannerExpressionStructure.ts'))],
  ['contract regression tests cover selection and terminal closure', /closes selected candidate evidence[\s\S]*closes provider terminal evidence/.test(read('packages/core/src/types/upstream/__test__/scannerExpressionJudgmentInterface.phase1439.test.ts'))],
  ['runtime consumes source-location judgment instead of judgment index', /judgment\.location\.kind/.test(read('packages/core/src/compiler/frontend/php/astClassifierRuntime.ts')) && !/judgment\.index/.test(read('packages/core/src/compiler/frontend/php/astClassifierRuntime.ts'))],
  ['upstream barrel exports interface and implementation', /expressionStructureJudgmentAuthority/.test(read('packages/core/src/types/upstream/index.ts')) && /ExpressionStructureJudgmentInterface/.test(read('packages/core/src/types/upstream/index.ts'))],
];
let failures = 0;
for (const [label, passed] of checks) {
  process.stdout.write(`${passed ? 'PASS' : 'FAIL'} ${label}\n`);
  if (!passed) failures += 1;
}
process.stdout.write(`${checks.length - failures}/${checks.length} checks passed\n`);
if (failures > 0) process.exitCode = 1;
