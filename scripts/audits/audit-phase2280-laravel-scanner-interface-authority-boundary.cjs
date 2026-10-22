const { readFileSync } = require('node:fs');
const { join } = require('node:path');

const root = process.cwd();
const contract = readFileSync(join(root, 'packages/core/src/types/upstream/laravelControllerScannerInterface.ts'), 'utf8');
const executor = readFileSync(join(root, 'packages/core/src/compiler/scanner/wiring/laravelControllerScanner.ts'), 'utf8');
const action = readFileSync(join(root, 'packages/core/src/types/upstream/laravelControllerActionSemanticJudgmentInterface.ts'), 'utf8');
const actionWiring = readFileSync(join(root, 'packages/core/src/compiler/scanner/wiring/laravelControllerExecutionDependencies.ts'), 'utf8');
const dataflow = readFileSync(join(root, 'packages/core/src/compiler/scanner/subscanners/controller/controllerDataflowContract.ts'), 'utf8');

const checks = [
  ['existing LaravelControllerScannerInterface evolved to contract version 38', contract.includes('readonly contractVersion: 38;') && executor.includes('readonly contractVersion = 38 as const;')],
  ['scanner interface reuses the existing typed action-projection migration contract', contract.includes('readonly actionSemanticProjectionMigration: LaravelControllerActionProjectionMigration;') && executor.includes('readonly actionSemanticProjectionMigration = controllerActionProjectionMigration;')],
  ['complete and blocked scan outcomes use the same contract version', (contract.match(/readonly contractVersion: 38;/g) || []).length === 3 && executor.includes('contractVersion: 38 as const')],
  ['action-level method AST derivation remains an explicit upstream obligation', action.includes("kind: 'method_ast_semantic_derivation'")],
  ['return semantic adapter remains an explicit upstream obligation', action.includes("kind: 'return_semantic_production_adapter'")],
  ['relation-backed dataflow path remains visible rather than claimed migrated', action.includes("kind: 'legacy_dataflow_relation_algebra'") && dataflow.includes("semantic/relations")],
  ['action judgment publication remains independent of legacy projection', !actionWiring.slice(actionWiring.indexOf('semantic: Object.freeze({', actionWiring.indexOf('judge: <TInvocationJudgment')), actionWiring.indexOf('\n          }),\n        }),\n        projection: contract,')).includes('contract.')],
  ['scanner contract file does not import semantic/foundation or semantic/relations', !/from ['"][^'"]*semantic\/(foundation|relations)/.test(contract)],
];

for (const [label, passed] of checks) process.stdout.write(`${passed ? 'PASS' : 'FAIL'} ${label}\n`);
if (checks.some(([, passed]) => !passed)) process.exitCode = 1;
