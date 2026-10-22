const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const read = relative => fs.readFileSync(path.join(root, relative), 'utf8');
const contract = read('packages/core/src/types/upstream/queryProducerSemanticInterface.ts');
const algebra = read('packages/core/src/types/upstream/queryProducerSemanticAlgebra.ts') + '\n' + read('packages/core/src/types/upstream/queryProducerSemanticReasoning.ts');
const scanner = read('packages/core/src/compiler/scanner/subscanners/queryEvidenceProducer.ts');
const tests = read('packages/core/src/types/upstream/__test__/queryProducerSemanticAlgebra.phase1487.test.ts');
const report = read('PHASE1503_UPSTREAM_DATE_PREDICATE_AUTHORITY.md');
const catalogStart = scanner.indexOf('const queryNamedMethodOperationCatalog');
const catalogEnd = scanner.indexOf('const comparisonOperatorCatalog', catalogStart);
const catalog = scanner.slice(catalogStart, catalogEnd);
const failures = [];
for (const [rule, resolver, legacyName] of [
  ['query_date_part_condition_rule', 'resolveDatePartCondition', 'whereDate'],
  ['query_date_relative_condition_rule', 'resolveRelativeDateCondition', 'wherePast'],
]) {
  if (!contract.includes(`kind: '${rule}'`)) failures.push(`contract rule missing: ${rule}`);
  if (!algebra.includes(`rule: '${rule}'`)) failures.push(`algebra does not emit rule: ${rule}`);
  if (!algebra.includes(`const ${resolver} =`)) failures.push(`upstream resolver missing: ${resolver}`);
  if (catalog.includes(`'${legacyName}'`)) failures.push(`migrated scanner handler remains: ${legacyName}`);
  if (!tests.includes(`'${legacyName}'`)) failures.push(`semantic test missing: ${legacyName}`);
}
if (!algebra.includes('unsupported date condition operator')) failures.push('date operator validation is not closed');
if (!scanner.includes('queryProducerSemanticAlgebra.resolveQueryOperation({ methodName: createMethodName(name), arguments: args })')) failures.push('scanner does not delegate named operations to upstream authority first');
if (!report.includes('Remaining boundary')) failures.push('remaining migration boundary not documented');
if (failures.length) {
  process.stderr.write(`Phase 1503 upstream date predicate authority audit FAILED\n- ${failures.join('\n- ')}\n`);
  process.exitCode = 1;
} else {
  process.stdout.write('Phase 1503 upstream date predicate authority audit PASSED\n');
  process.stdout.write('Scope: date-part and relative-date predicate families are upstream-owned; remaining scanner-owned families stay an explicit migration frontier.\n');
}
