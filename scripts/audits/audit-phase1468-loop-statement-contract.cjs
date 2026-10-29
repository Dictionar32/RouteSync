const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const read = relative => fs.readFileSync(path.join(root, relative), 'utf8');
const runtime = read('packages/core/src/compiler/frontend/php/astClassifierRuntime.ts');
const iface = read('packages/core/src/types/upstream/scannerLoopStatementInterface.ts');
const algebra = read('packages/core/src/types/upstream/scannerLoopStatementAlgebra.ts');
const barrel = read('packages/core/src/types/upstream/index.ts');
const tests = read('packages/core/src/types/upstream/__test__/scannerLoopStatementAlgebra.phase1468.test.ts');
const section = (name, next) => runtime.slice(runtime.indexOf(`function ${name}(`), runtime.indexOf(`function ${next}(`));
const checks = [
  ['interface exposes closed loop judgments', iface.includes("kind: 'resolved'") && iface.includes("kind: 'not_applicable'") && iface.includes("kind: 'malformed'")],
  ['algebra owns header/body delimiter reasoning', algebra.includes('matchLeadingDelimiter') && algebra.includes('resolveLoop')],
  ['algebra owns counted-loop clause partition', algebra.includes("targets: [';']") && algebra.includes('invalid_for_clauses')],
  ['algebra owns foreach as/target reasoning', algebra.includes("target: 'as'") && algebra.includes('invalid_iteration_target')],
  ['foreach runtime consumes contract evidence', section('parseCollectionIterationStatement', 'parsePretestIterationStatement').includes('scannerLoopStatementContractAlgebra.resolve') && !section('parseCollectionIterationStatement', 'parsePretestIterationStatement').includes('matchingClose(')],
  ['while runtime consumes contract evidence', section('parsePretestIterationStatement', 'parseSwitchCases').includes('scannerLoopStatementContractAlgebra.resolve') && !section('parsePretestIterationStatement', 'parseSwitchCases').includes('matchingBrace(')],
  ['for runtime consumes contract clauses', section('parseCountedIterationStatement', 'toForClause').includes('evidence.clauses') && !section('parseCountedIterationStatement', 'toForClause').includes('splitTopLevel(')],
  ['upstream public API exports contract', barrel.includes("export * from './scannerLoopStatementInterface'") && barrel.includes("export { scannerLoopStatementContractAlgebra } from './scannerLoopStatementAlgebra'")],
  ['focused contract tests cover valid and malformed cases', tests.includes('counted loop') && tests.includes('key/value target') && tests.includes('invalid counted clauses')],
];
let failed = 0;
for (const [name, passed] of checks) {
  process.stdout.write(`${passed ? 'PASS' : 'FAIL'} ${name}\n`);
  if (!passed) failed += 1;
}
process.stdout.write(`\nPhase 1468 audit: ${checks.length - failed}/${checks.length} passed\n`);
process.exitCode = failed === 0 ? 0 : 1;
