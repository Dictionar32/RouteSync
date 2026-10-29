const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const read = relative => fs.readFileSync(path.join(root, relative), 'utf8');
const contract = read('packages/core/src/types/upstream/queryProducerSemanticInterface.ts');
const algebra = read('packages/core/src/types/upstream/queryProducerSemanticAlgebra.ts') + '\n' + read('packages/core/src/types/upstream/queryProducerSemanticReasoning.ts');
const scanner = read('packages/core/src/compiler/scanner/operations/queryEvidenceProducer.ts');
const report = read('PHASE1500_INTERFACE_FIRST_QUERY_OPERATION_RULE_AUTHORITY.md');
const failures = [];
if (!contract.includes('export type QueryOperationEvidence')) failures.push('typed QueryOperationEvidence missing');
if (!contract.includes('export type QueryOperationSemanticDecision')) failures.push('rule-carrying closed decision missing');
if (!contract.includes('readonly resolveQueryOperation:')) failures.push('interface-first resolver missing');
if (!algebra.includes('const resolveQueryOperation = (evidence: QueryOperationEvidence)')) failures.push('upstream algebra resolver missing');
if (!contract.includes('query_basic_condition_rule:')) failures.push('basic rule identity missing');
if (!contract.includes('query_join_rule:')) failures.push('join rule identity missing');
if (!scanner.includes('queryProducerSemanticAlgebra.resolveQueryOperationEvidence({') || !scanner.includes('span: expression.source')) failures.push('scanner does not pass source-bound evidence through the unified interface');
if (scanner.includes('queryProducerSemanticAlgebra.resolveQueryJoinOperation(createMethodName(name), args)')) failures.push('scanner still sequences join authority directly');
if (scanner.includes('queryProducerSemanticAlgebra.resolveQueryBasicOperation(createMethodName(name), args)')) failures.push('scanner still sequences basic-operation authority directly');
if (!scanner.includes('queryNamedMethodOperationCatalog')) failures.push('legacy frontier disappeared; verify full migration before changing audit assumptions');
if (!report.includes('Known migration frontier — not yet closed')) failures.push('remaining scanner semantic frontier must be documented');
if (failures.length) {
  process.stderr.write(`Phase 1500 interface-first query operation audit FAILED\n- ${failures.join('\n- ')}\n`);
  process.exitCode = 1;
} else {
  process.stdout.write('Phase 1500 interface-first query operation audit PASSED\n');
  process.stdout.write('Scope: upstream owns join/basic-condition dispatch; scanner catalog remains a documented migration frontier.\n');
}
