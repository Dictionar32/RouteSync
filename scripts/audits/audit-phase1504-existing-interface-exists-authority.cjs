const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const read = relative => fs.readFileSync(path.join(root, relative), 'utf8');
const contract = read('packages/core/src/types/upstream/queryProducerSemanticInterface.ts');
const algebra = read('packages/core/src/types/upstream/queryProducerSemanticAlgebra.ts') + '\n' + read('packages/core/src/types/upstream/queryProducerSemanticReasoning.ts');
const scanner = read('packages/core/src/compiler/scanner/operations/queryEvidenceProducer.ts');
const tests = read('packages/core/src/types/upstream/__test__/queryProducerSemanticAlgebra.phase1487.test.ts');
const report = read('PHASE1504_EXISTENCE_PREDICATE_AUTHORITY.md');
const catalogStart = scanner.indexOf('const queryNamedMethodOperationCatalog');
const catalogEnd = scanner.indexOf('const comparisonOperatorCatalog', catalogStart);
const catalog = scanner.slice(catalogStart, catalogEnd);
const failures = [];
if (!contract.includes("kind: 'query_exists_condition_rule'")) failures.push('existing interface rule union does not include exists predicate identity');
if (!contract.includes('readonly resolveQueryOperation:')) failures.push('existing unified operation interface entry point is missing');
if (!algebra.includes('const resolveExistsCondition =')) failures.push('upstream exists resolver is missing');
if (!algebra.includes("rule: 'query_exists_condition_rule'")) failures.push('dispatcher does not emit exists rule identity');
for (const method of ['whereExists', 'orWhereExists', 'whereNotExists', 'orWhereNotExists']) {
  if (catalog.includes(`'${method}'`)) failures.push(`scanner still owns exists handler ${method}`);
  if (!algebra.includes(`['${method}'`)) failures.push(`upstream catalog does not own ${method}`);
}
if (!tests.includes("createMethodName('orWhereNotExists')")) failures.push('exists authority test missing');
if (!report.includes('does **not** introduce a second semantic interface')) failures.push('report does not state existing-interface evolution');
if (failures.length) {
  process.stderr.write(`Phase 1504 existing-interface exists authority audit FAILED\n- ${failures.join('\n- ')}\n`);
  process.exitCode = 1;
} else {
  process.stdout.write('Phase 1504 existing-interface exists authority audit PASSED\n');
  process.stdout.write('Scope: existing QueryProducerSemanticInterface is extended; exists predicate decisions moved out of scanner.\n');
}
