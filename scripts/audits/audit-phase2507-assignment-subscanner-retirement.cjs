const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const semanticProducerPath = path.join(root, 'packages/core/src/compiler/semantic/sourceAstSemanticProducer.ts');
const retiredProducerPath = path.join(root, 'packages/core/src/compiler/scanner/operations/assignmentProducer.ts');
const semanticProducer = fs.readFileSync(semanticProducerPath, 'utf8');
const checks = [
  ['assignment subscanner implementation is retired', !fs.existsSync(retiredProducerPath)],
  ['active semantic producer no longer imports assignment subscanner', !semanticProducer.includes('operations/assignmentProducer')],
  ['assignment projection is owned by source AST semantic producer', semanticProducer.includes('const assignmentAstFromStatement =')],
  ['assignment projection reuses canonical expression authority', semanticProducer.includes('expressionFromPhpAst.project({ syntax: statement.value, sourceFile })')],
  ['assignment target uses existing target/operator/reference mappings', ['resolveAssignmentTarget', 'resolveAssignmentOperator', 'assignmentReferenceMode'].every(value => semanticProducer.includes(value))],
  ['source semantic producer remains wired through upstream interface', semanticProducer.includes('export const sourceAstSemanticProducer: SourceAstSemanticProducerInterface')],
  ['source semantic producer returns assignments in its declared product', semanticProducer.includes('assignments: source.assignments')],
  ['assignment producer local interface is not duplicated in upstream types', !fs.existsSync(path.join(root, 'packages/core/src/types/upstream/assignmentProducerInterface.ts'))],
];
let failed = 0;
for (const [label, passed] of checks) {
  process.stdout.write(`${passed ? 'PASS' : 'FAIL'} ${label}\n`);
  if (!passed) failed += 1;
}
process.stdout.write(`${checks.length - failed}/${checks.length} assertions passed\n`);
process.exitCode = failed === 0 ? 0 : 1;
