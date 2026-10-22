const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const read = (p) => fs.readFileSync(path.join(root, p), 'utf8');
const contractPath = 'packages/core/src/types/upstream/semanticTypeDerivationInterface.ts';
const contract = read(contractPath);
const executor = read('packages/core/src/compiler/semantic/type-derivation/semanticTypeDerivationRuntimeExecutor.ts');
const tests = read('packages/core/src/compiler/semantic/type-derivation/__test__/semanticTypeDerivationRuntimeExecutor.phase1552.test.ts');
const scanner = read('packages/core/src/compiler/scanner/subscanners/SemanticTypeDeriver.ts');
const checks = [
  ['runtime contract accepts unknown candidate at executable boundary', /candidate: unknown/.test(contract)],
  ['runtime validator guards object before property reads', /if \(!isRecord\(candidate\)\) return invalid\(\)/.test(contract)],
  ['runtime validator guards proof and coverage records', /!isRecord\(coverage\) \|\| !isRecord\(proof\)/.test(contract)],
  ['runtime validator rejects malformed contract with stable diagnostic', /Semantic type derivation contract violation/.test(contract)],
  ['proof validates stage order and result count', /proofStagesMatch/.test(contract) && /proof\.resultCount !== result\.length/.test(contract)],
  ['executor only delegates then validates', /assertSemanticTypeDerivationJudgment\(request, authority\.resolve\(request\)\)/.test(executor) && !/deriveResourceTypes|deriveRouteResponseTypes|deriveModelTypes/.test(executor)],
  ['scanner consumer invokes executor facade', /runtimeExecutor\.execute/.test(scanner)],
  ['malformed proof regression test exists', /proof: null/.test(tests) && /rejects malformed runtime values/.test(tests)],
  ['missing judgment regression test exists', /null as unknown as SemanticTypeDerivationJudgment/.test(tests) && /rejects a missing judgment object/.test(tests)],
];
let failed = 0;
const report = { phase: 1554, title: 'Runtime semantic derivation contract shape hardening', passed: 0, total: checks.length, checks: [] };
for (const [name, test] of checks) {
  const passed = Boolean(test);
  process.stdout.write(`${passed ? 'PASS' : 'FAIL'} ${name}\n`);
  if (!passed) failed++;
  report.checks.push({ name, passed });
}
report.passed = checks.length - failed;
fs.writeFileSync(path.join(root, 'PHASE1554_AUDIT.json'), JSON.stringify(report, null, 2) + '\n');
process.stdout.write(`Phase 1554 audit: ${report.passed}/${report.total} passed\n`);
process.exitCode = failed ? 1 : 0;
