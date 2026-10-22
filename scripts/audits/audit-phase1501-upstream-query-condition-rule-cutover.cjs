const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const read = relative => fs.readFileSync(path.join(root, relative), 'utf8');
const contract = read('packages/core/src/types/upstream/queryProducerSemanticInterface.ts');
const algebra = read('packages/core/src/types/upstream/queryProducerSemanticAlgebra.ts') + '\n' + read('packages/core/src/types/upstream/queryProducerSemanticReasoning.ts');
const scanner = read('packages/core/src/compiler/scanner/subscanners/queryEvidenceProducer.ts');
const report = read('PHASE1501_UPSTREAM_QUERY_CONDITION_RULE_CUTOVER.md');
const catalogStart = scanner.indexOf('const queryNamedMethodOperationCatalog');
const catalogEnd = scanner.indexOf('const comparisonOperatorCatalog', catalogStart);
const catalog = scanner.slice(catalogStart, catalogEnd);
const failures = [];
for (const rule of ['query_range_condition_rule', 'query_membership_condition_rule', 'query_null_condition_rule']) {
  if (!contract.includes(`kind: '${rule}'`)) failures.push(`contract rule missing: ${rule}`);
  if (!algebra.includes(`rule: '${rule}'`)) failures.push(`algebra does not emit rule: ${rule}`);
}
for (const resolver of ['resolveRangeCondition', 'resolveMembershipCondition', 'resolveNullCondition']) {
  if (!algebra.includes(`const ${resolver} =`)) failures.push(`upstream resolver missing: ${resolver}`);
}
for (const legacyName of ['whereBetween', 'whereIn', 'whereNull']) {
  if (catalog.includes(`'${legacyName}'`)) failures.push(`migrated handler remains in scanner catalog: ${legacyName}`);
}
if (!scanner.includes('queryProducerSemanticAlgebra.resolveQueryOperation({ methodName: operation.name, arguments: positionalArguments(expression) })')) failures.push('query-method judgment does not delegate to unified authority');
const namedDispatch = scanner.slice(scanner.indexOf('const queryOperationFromNamedMethod'), scanner.indexOf('const queryColumnReferencesFromSequence'));
if (namedDispatch.indexOf('queryProducerSemanticAlgebra.resolveQueryOperation') > namedDispatch.indexOf('const field = propertyArgument')) failures.push('scanner resolves compatibility fields before asking the upstream authority');
if (scanner.includes('queryProducerSemanticAlgebra.resolveQueryJoinOperation(operation.name')) failures.push('scanner still sequences join authority directly');
if (scanner.includes('queryProducerSemanticAlgebra.resolveQueryBasicOperation(operation.name')) failures.push('scanner still sequences basic-condition authority directly');
if (!report.includes('Remaining frontier')) failures.push('remaining migration frontier not documented');
if (failures.length) {
  process.stderr.write(`Phase 1501 upstream query condition cutover audit FAILED\n- ${failures.join('\n- ')}\n`);
  process.exitCode = 1;
} else {
  process.stdout.write('Phase 1501 upstream query condition cutover audit PASSED\n');
  process.stdout.write('Scope: range, membership, and null predicates are upstream-owned; other legacy query families remain an explicit migration frontier.\n');
}
