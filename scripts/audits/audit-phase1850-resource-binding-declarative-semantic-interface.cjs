const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const read = (relative) => fs.readFileSync(path.join(root, relative), 'utf8');
const checks = [
  ['upstream semantic model declares closed typed rule set', /interface ResourceModelBindingSemanticRuleSetInterface/.test(read('packages/core/src/types/upstream/resourceModelBindingSemanticInterface.ts'))],
  ['semantic precedence is represented by declarative rewrite rules', /resource-model-precedence-controller-dataflow/.test(read('packages/core/src/types/upstream/resourceModelBindingSemanticInterface.ts')) && /resource-model-precedence-relation-propagation/.test(read('packages/core/src/types/upstream/resourceModelBindingSemanticInterface.ts'))],
  ['all precedence tiers are encoded upstream', ['controller_dataflow', 'relation_propagation', 'convention', 'structural'].every((value) => read('packages/core/src/types/upstream/resourceModelBindingSemanticInterface.ts').includes(value))],
  ['higher-priority evidence is expressed as negative relation premises', /pattern\('resource_model_candidate_evidence',[\s\S]*?'negative'\)/.test(read('packages/core/src/types/upstream/resourceModelBindingSemanticInterface.ts'))],
  ['authority uses shared declarative relation executor', /semanticRewriteRuntimeExecutor\.executeRelations/.test(read('packages/core/src/compiler/semantic/resourceModelBindingAuthority.ts'))],
  ['authority imports upstream rule set instead of local precedence array', /RESOURCE_MODEL_BINDING_SEMANTIC_RULE_SET/.test(read('packages/core/src/compiler/semantic/resourceModelBindingAuthority.ts')) && !/const precedence: readonly ResourceModelBindingEvidence\['basis'\]/.test(read('packages/core/src/compiler/semantic/resourceModelBindingAuthority.ts'))],
  ['candidate ambiguity remains preserved at selected precedence', /preserve_all_candidates_at_selected_precedence/.test(read('packages/core/src/types/upstream/resourceModelBindingSemanticInterface.ts'))],
  ['resource scanner contract version is advanced', /contractVersion: 10/.test(read('packages/core/src/types/upstream/laravelResourceScannerInterface.ts'))],
  ['semantic model exported from upstream barrel', /RESOURCE_MODEL_BINDING_SEMANTIC_RULE_SET/.test(read('packages/core/src/types/upstream/index.ts'))],
  ['semantic model exported from core public barrel', /RESOURCE_MODEL_BINDING_SEMANTIC_RULE_SET/.test(read('packages/core/src/index.ts'))],
  ['no semantic foundation dependency introduced', !/semantic\/foundation/.test(read('packages/core/src/types/upstream/resourceModelBindingSemanticInterface.ts') + read('packages/core/src/compiler/semantic/resourceModelBindingAuthority.ts'))],
  ['no unsafe cast introduced in authority', !/\sas\s+ResourceModelBindingEvidence\['basis'\]/.test(read('packages/core/src/compiler/semantic/resourceModelBindingAuthority.ts'))],
];
let failed = false;
for (const [name, passed] of checks) {
  process.stdout.write(`${passed ? 'PASS' : 'FAIL'} ${name}\n`);
  failed ||= !passed;
}
process.stdout.write(`Phase 1850: ${checks.filter(([, passed]) => passed).length}/${checks.length}\n`);
process.exitCode = failed ? 1 : 0;
