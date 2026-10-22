const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const read = (relative) => fs.readFileSync(path.join(root, relative), 'utf8');
const scanner = read('packages/core/src/compiler/scanner/wiring/laravelSourceAstPipeline.ts');
const producer = read('packages/core/src/compiler/semantic/sourceAstSemanticProducer.ts');
const contract = read('packages/core/src/types/upstream/sourceAstSemanticProducerInterface.ts');
const evidenceContract = read('packages/core/src/types/upstream/sourceAstEvidenceAcquisitionInterface.ts');
const evidenceAcquisition = read('packages/core/src/compiler/semantic/sourceAstEvidenceAcquisition.ts');
const barrel = read('packages/core/src/types/upstream/index.ts');
const checks = [
  ['scanner delegates semantic products through one upstream producer', scanner.includes('sourceAstSemanticProducer.produce(sourceProject)')],
  ['scanner no longer imports expression producer', !scanner.includes('expressionProducer')],
  ['scanner no longer imports assignment producer', !scanner.includes('assignmentProducer')],
  ['scanner no longer imports property producer', !scanner.includes('propertyProducer')],
  ['scanner no longer traverses PHP statement semantics', !scanner.includes('statementExpressions') && !scanner.includes('statementAssignments')],
  ['producer owns expression, assignment and property production through the active producers and typed assignment constructor', producer.includes('expressionProducer.produce') && producer.includes('assignmentAstFromStatement') && producer.includes('propertyProducer.produce')],
  ['producer implements closed upstream contract', producer.includes('SourceAstSemanticProducerInterface') && producer.includes('closed: true')],
  ['contract preserves all semantic products as typed outputs', contract.includes('expressions: readonly ExpressionAst[]') && contract.includes('assignments: readonly AssignmentAst[]') && contract.includes('properties: readonly PropertyAst[]')],
  ['upstream barrel exports the contract', barrel.includes("export * from './sourceAstSemanticProducerInterface';")],
  ['active Laravel source-AST pipeline consumes the three typed products without reselecting producers', scanner.includes('dependencies.sourceAstSemanticProducer.produce(sourceProject)') && scanner.includes('semanticProducts.expressions') && scanner.includes('semanticProducts.assignments') && scanner.includes('semanticProducts.properties')],
];
const failed = checks.filter(([, passed]) => !passed);
const report = {
  phase: 1407,
  name: 'source-ast-semantic-producer-boundary',
  status: failed.length === 0 ? 'passed_with_residuals' : 'failed',
  passed: checks.length - failed.length,
  total: checks.length,
  checks: checks.map(([name, passed]) => ({ name, passed })),
  residuals: [
    'sourceAstSemanticProducer still orchestrates evidence acquisition and syntax parsing internally; this is an open architecture boundary, not a claim that parsing and semantic judgment are already separate.',
    'Route action collision resolution has moved upstream; source-order independence is enforced by sorting canonical route keys before resolving names.',
    'full typecheck/build and end-to-end Laravel fixture execution require project dependencies not included in this workspace.'
  ]
};
const reportPath = path.join(root, 'scripts/audits/reports/phase1407-source-ast-semantic-producer-boundary.json');
fs.mkdirSync(path.dirname(reportPath), { recursive: true });
fs.writeFileSync(reportPath, JSON.stringify(report, null, 2) + '\n');
for (const [name, passed] of checks) console.log(`${passed ? 'PASS' : 'FAIL'} ${name}`);
console.log(`RESULT ${report.passed}/${report.total} ${report.status}`);
process.exitCode = failed.length ? 1 : 0;
