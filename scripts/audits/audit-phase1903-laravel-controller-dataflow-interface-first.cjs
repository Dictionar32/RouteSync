const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const contractPath = path.join(root, 'packages/core/src/types/upstream/laravelControllerScannerInterface.ts');
const analyzerPath = path.join(root, 'packages/core/src/compiler/scanner/lexer/controllerDataflowAnalyzer.ts');
const judgmentPath = path.join(root, 'packages/core/src/types/upstream/laravelControllerInvocationSemanticJudgmentInterface.ts');
const contract = fs.readFileSync(contractPath, 'utf8');
const analyzer = fs.readFileSync(analyzerPath, 'utf8');
const judgment = fs.readFileSync(judgmentPath, 'utf8');
const checks = [
  ['canonical boundary contract version 70', /readonly version: 70;/.test(contract) && /version: 70,/.test(contract)],
  ['semantic ownership gate declared', /controllerDataflowSemanticOwnership/.test(contract)],
  ['integrated response ownership gate declared', /controllerDataflowIntegratedResponseOwnership/.test(contract)],
  ['single canonical invocation judgment retained', /LaravelControllerInvocationSemanticJudgmentInterface/.test(analyzer) && /invocationJudgment: judgment/.test(analyzer)],
  ['canonical judgment carries source identity and response', /readonly sourceFile: SourceFile/.test(judgment) && /readonly response: Extract/.test(judgment)],
  ['no semantic foundation dependency introduced', !/semantic\/foundation/.test(analyzer)],
];
for (const [name, passed] of checks) {
  process.stdout.write(`${passed ? 'PASS' : 'FAIL'} ${name}\n`);
}
process.stdout.write(`\n${checks.filter(([, passed]) => passed).length}/${checks.length} checks passed\n`);
if (checks.some(([, passed]) => !passed)) process.exitCode = 1;
