const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const read = relative => fs.readFileSync(path.join(root, relative), 'utf8');
const contract = read('packages/core/src/types/upstream/queryProducerSemanticInterface.ts');
const algebra = read('packages/core/src/types/upstream/queryProducerSemanticAlgebra.ts') + '\n' + read('packages/core/src/types/upstream/queryProducerSemanticReasoning.ts');
const scanner = read('packages/core/src/compiler/scanner/subscanners/queryEvidenceProducer.ts');
const tests = read('packages/core/src/types/upstream/__test__/queryProducerSemanticAlgebra.phase1487.test.ts');
const report = read('PHASE1502_UPSTREAM_QUERY_RULE_AUTHORITY_EXPANSION.md');
const catalogStart = scanner.indexOf('const queryNamedMethodOperationCatalog');
const catalogEnd = scanner.indexOf('const comparisonOperatorCatalog', catalogStart);
const catalog = scanner.slice(catalogStart, catalogEnd);
const families = [
  ['query_column_range_condition_rule', 'resolveColumnRangeCondition', 'whereBetweenColumns'],
  ['query_value_range_condition_rule', 'resolveValueRangeCondition', 'whereValueBetween'],
  ['query_null_safe_equality_rule', 'resolveNullSafeEquality', 'whereNullSafeEquals'],
];
const failures = [];
for (const [rule, resolver, legacyName] of families) {
  if (!contract.includes(`kind: '${rule}'`)) failures.push(`contract rule missing: ${rule}`);
  if (!algebra.includes(`rule: '${rule}'`)) failures.push(`algebra does not emit rule: ${rule}`);
  if (!algebra.includes(`const ${resolver} =`)) failures.push(`upstream resolver missing: ${resolver}`);
  if (catalog.includes(`'${legacyName}'`)) failures.push(`migrated scanner handler remains: ${legacyName}`);
  if (legacyName === 'whereValueBetween' ? !tests.includes('orWhereValueNotBetween') : !tests.includes(`'${legacyName}'`)) failures.push(`semantic test missing: ${legacyName}`);
}
if (!scanner.includes('queryProducerSemanticAlgebra.resolveQueryOperation({ methodName: createMethodName(name), arguments: args })')) failures.push('scanner does not delegate named operations to the upstream authority first');
if (!algebra.includes('type QueryPredicateJunction =') || !algebra.includes('type QueryPredicatePolarity =')) failures.push('predicate rule descriptor is not represented as closed ADTs');
if (algebra.includes('readonly isOr: boolean') || algebra.includes('readonly negated: boolean')) failures.push('primitive boolean flags remain in predicate rule descriptors');
if (!report.includes('Remaining boundary')) failures.push('remaining migration boundary not documented');
if (failures.length) {
  process.stderr.write(`Phase 1502 upstream query rule authority audit FAILED\n- ${failures.join('\n- ')}\n`);
  process.exitCode = 1;
} else {
  process.stdout.write('Phase 1502 upstream query rule authority audit PASSED\n');
  process.stdout.write('Scope: three additional query-condition families are upstream-owned; other scanner-owned query families remain an explicit frontier.\n');
}
