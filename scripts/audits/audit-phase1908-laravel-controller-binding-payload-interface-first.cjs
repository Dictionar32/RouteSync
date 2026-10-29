const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const contractPath = path.join(root, 'packages/core/src/types/upstream/laravelControllerScannerInterface.ts');
const analyzerPath = path.join(root, 'packages/core/src/compiler/frontend/php/controllerDataflowAnalyzer.ts');
const reportPath = path.join(root, 'PHASE1908_AUDIT.json');
const contract = fs.readFileSync(contractPath, 'utf8');
const analyzer = fs.readFileSync(analyzerPath, 'utf8');
const report = JSON.parse(fs.readFileSync(reportPath, 'utf8'));
const checks = [
  ['contract version 74', /readonly version: 74;/.test(contract) && /version: 74,/.test(contract)],
  ['typed binding/payload correspondence boundary', /controllerDataflowBindingPayloadJudgmentBoundary/.test(contract)],
  ['projection ownership boundary', /controllerDataflowProjectionOwnership/.test(contract)],
  ['judgment and integrated response remain distinct', /controllerDataflowJudgmentCompositionInvariant/.test(contract)],
  ['analyzer still-disclosed fallback is present', /fallbackValue/.test(analyzer) && /canonicalDefinition/.test(analyzer)],
  ['audit discloses runtime migration incomplete', report.result === 'PASS_WITH_REMAINING_RUNTIME_MIGRATION' && report.runtime_build_executed === false],
];
for (const [name, passed] of checks) console.log(`${passed ? 'PASS' : 'FAIL'} ${name}`);
if (checks.some(([, passed]) => !passed)) process.exitCode = 1;
