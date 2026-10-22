const { readFileSync } = require('node:fs');
const { join } = require('node:path');

const root = process.cwd();
const upstream = readFileSync(join(root, 'packages/core/src/types/upstream/laravelControllerActionSemanticJudgmentInterface.ts'), 'utf8');
const wiring = readFileSync(join(root, 'packages/core/src/compiler/scanner/wiring/laravelControllerExecutionDependencies.ts'), 'utf8');
const legacy = readFileSync(join(root, 'packages/core/src/compiler/scanner/descriptors/request/controllerActionContract.ts'), 'utf8');
const dataflow = readFileSync(join(root, 'packages/core/src/types/upstream/semanticDataflowKnowledge.ts'), 'utf8');

const checks = [
  ['existing action contract evolved to version 50', upstream.includes('readonly version: 50;') && wiring.includes('version: 50 as const')],
  ['upstream contract states authority sequence explicitly', upstream.includes('readonly authoritySequence:') && wiring.includes('authoritySequence:')],
  ['method AST semantic derivation is an explicit migration obligation', upstream.includes("kind: 'method_ast_semantic_derivation'") && upstream.includes("targetOwner: 'existing_typed_source_evidence_and_semantic_judgment_authorities'")],
  ['return semantic adapter is an explicit migration obligation', upstream.includes("kind: 'return_semantic_production_adapter'") && upstream.includes("targetOwner: 'existing_upstream_return_semantic_contract'")],
  ['legacy action resolver is still identified for projection migration', legacy.includes('export function resolveControllerActionContract(')],
  ['dataflow relation-algebra debt remains explicit', upstream.includes("kind: 'legacy_dataflow_relation_algebra'") && dataflow.includes("semantic/relations")],
  ['canonical publication still does not read semantic values from projection', !wiring.slice(wiring.indexOf('semantic: Object.freeze({', wiring.indexOf('judge: <TInvocationJudgment')), wiring.indexOf('\n          }),\n        }),\n        projection: contract,')).includes('contract.')],
];

for (const [label, passed] of checks) {
  process.stdout.write(`${passed ? 'PASS' : 'FAIL'} ${label}\n`);
}

if (checks.some(([, passed]) => !passed)) process.exitCode = 1;
