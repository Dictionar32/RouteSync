const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '../..');
const read = (relative) => fs.readFileSync(path.join(root, relative), 'utf8');
const analyzer = read('packages/core/src/compiler/scanner/lexer/controllerDataflowAnalyzer.ts');
const upstream = read('packages/core/src/types/upstream/controller.ts');
const packageJson = JSON.parse(read('package.json'));
const checks = [
  ['controller variable definitions receive semantic facts from semanticForValue', /semantic:\s*semanticForValue\(payload\.value, parameterSemantics\)/.test(analyzer)],
  ['semanticForValue is implemented', /function semanticForValue\([\s\S]*?return solveSemanticCandidate\(value, parameterSemantics\);/.test(analyzer)],
  ['semanticForValue returns the upstream semantic contract', /function semanticForValue\([\s\S]*?\): ControllerVariableSemantic/.test(analyzer)],
  ['candidate solver retains parameter semantic evidence', /id:\s*'parameter',[\s\S]*?relationMapValueOr\(parameterSemantics, variableName, \{ kind: 'external' \}\)/.test(analyzer)],
  ['database table candidate requires a non-empty table identity', /id:\s*'db-table',[\s\S]*?requirement\('db-table', relationNotEqual\(dbTable, ''\)\)/.test(analyzer)],
  ['database table candidate is constrained to DB::table source evidence', /relationEqual\(current\.className, 'DB'\), relationEqual\(current\.method, 'table'\)/.test(analyzer)],
  ['semantic candidate fallback remains explicit external knowledge', /id:\s*'external',[\s\S]*?value:\s*\{ kind: 'external' \}/.test(analyzer)],
  ['controller semantic result remains a discriminated upstream union', /export type ControllerVariableSemantic\s*=\s*[\s\S]*?kind: 'model_origin'[\s\S]*?kind: 'request_origin'[\s\S]*?kind: 'expression'[\s\S]*?kind: 'external'/.test(upstream)],
  ['audit script is registered in package.json', packageJson.scripts['audit:phase1365-controller-semantic-candidate-closure'] === 'node scripts/audits/audit-phase1365-controller-semantic-candidate-closure.cjs'],
  ['build script remains unchanged', packageJson.scripts.build === 'tsdown'],
  ['package version remains unchanged', packageJson.version === '1.0.49'],
];
const report = {
  phase: 1365,
  title: 'Controller Semantic Candidate Closure',
  result: checks.every(([, passed]) => passed) ? 'passed' : 'failed',
  passed: checks.filter(([, passed]) => passed).length,
  total: checks.length,
  checks: checks.map(([name, passed]) => ({ name, passed })),
};
const reportPath = path.join(root, 'scripts/audits/reports/phase1365-controller-semantic-candidate-closure.json');
fs.mkdirSync(path.dirname(reportPath), { recursive: true });
fs.writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`);
for (const [name, passed] of checks) console.log(`${passed ? 'PASS' : 'FAIL'} ${name}`);
console.log(`${report.passed}/${report.total} checks passed`);
if (report.result !== 'passed') process.exitCode = 1;
