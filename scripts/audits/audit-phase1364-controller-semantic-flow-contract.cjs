const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '../..');
const read = (relative) => fs.readFileSync(path.join(root, relative), 'utf8');
const contract = read('packages/core/src/compiler/scanner/operations/controller/controllerDataflowContract.ts');
const upstream = read('packages/core/src/types/upstream/controller.ts');
const ast = read('packages/core/src/compiler/frontend/php/controllerBodyAstTypes.ts');
const analyzer = read('packages/core/src/compiler/frontend/php/controllerDataflowAnalyzer.ts');
const packageJson = JSON.parse(read('package.json'));
const checks = [
  ['upstream ControllerSemanticVariableFlow contract exists', /export interface ControllerSemanticVariableFlow\s*\{\s*readonly variables: Sequence<ControllerVariableBinding>;/s.test(upstream)],
  ['controller body AST uses upstream semantic flow contract', /semanticVariables:\s*ControllerSemanticVariableFlow/.test(ast)],
  ['controller dataflow contract imports canonical flow type', /import type \{[^}]*ControllerSemanticVariableFlow[^}]*\} from ['"][^'"]*types\/upstream\/controller['"]/.test(contract)],
  ['controller dataflow contract exposes canonical flow type', /readonly semantic:\s*ControllerSemanticVariableFlow/.test(contract)],
  ['builder returns canonical flow type', /function buildSemanticDataflow\(evidence: ControllerDataflowAst\): ControllerSemanticVariableFlow/.test(contract)],
  ['resource binding consumer accepts canonical flow type', /function collectResourceBindings\(value: PhpAstValue, semanticVariables: ControllerSemanticVariableFlow,/.test(contract)],
  ['producer returns the canonical flow type', /function canonicalSemanticVariables\([\s\S]*?\): ControllerSemanticVariableFlow/.test(analyzer)],
  ['no duplicate inline variables-flow shape remains in contract', !/\{\s*readonly variables:\s*Sequence<ControllerVariableBinding>\s*\}/.test(contract)],
  ['audit script is registered in package.json', packageJson.scripts['audit:phase1364-controller-semantic-flow-contract'] === 'node scripts/audits/audit-phase1364-controller-semantic-flow-contract.cjs'],
  ['build script remains unchanged', packageJson.scripts.build === 'tsdown'],
  ['package version remains unchanged', packageJson.version === '1.0.49'],
  ['semantic AST producer remains separate from dataflow contract', /semanticKnowledgeDataFlow/.test(analyzer) && /semanticVariables/.test(analyzer)],
];
const report = {
  phase: 1364,
  title: 'Controller Semantic Flow Contract Adoption',
  result: checks.every(([, passed]) => passed) ? 'passed' : 'failed',
  passed: checks.filter(([, passed]) => passed).length,
  total: checks.length,
  checks: checks.map(([name, passed]) => ({ name, passed })),
};
const reportPath = path.join(root, 'scripts/audits/reports/phase1364-controller-semantic-flow-contract.json');
fs.mkdirSync(path.dirname(reportPath), { recursive: true });
fs.writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`);
for (const [name, passed] of checks) console.log(`${passed ? 'PASS' : 'FAIL'} ${name}`);
console.log(`${report.passed}/${report.total} checks passed`);
if (report.result !== 'passed') process.exitCode = 1;
