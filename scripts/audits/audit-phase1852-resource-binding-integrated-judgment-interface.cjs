const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const read = relative => fs.readFileSync(path.join(root, relative), 'utf8');
const model = read('packages/core/src/types/upstream/resourceModelBindingSemanticInterface.ts');
const authority = read('packages/core/src/compiler/semantic/resourceModelBindingAuthority.ts');
const scanner = read('packages/core/src/compiler/scanner/wiring/laravelResourceScanner.ts');
const invocation = read('packages/core/src/types/upstream/phpSourceInvocationSemanticPipelineIntegrationInterface.ts');
const pipeline = read('packages/core/src/compiler/scanner/wiring/laravelSourceAstPipeline.ts');
const packageJson = JSON.parse(read('package.json'));
const checks = [
  ['domain-level judgment model exists before wiring', /interface ResourceModelBindingSemanticJudgmentModelInterface/.test(model)],
  ['judgment model closes candidate selection and ambiguity semantics', /candidateSelection: 'all_candidates_at_highest_supported_precedence'/.test(model) && /ambiguity: 'preserve_all_distinct_candidates_and_evidence'/.test(model)],
  ['judgment model specifies provenance, unresolved evidence, and closure semantics', /provenance: 'preserve_source_span_per_resource_model_basis'/.test(model) && /unresolved: 'retain_subject_and_source_evidence'/.test(model) && /relationClosure: 'least_fixed_point_over_whole_resource_model_lattice'/.test(model)],
  ['judgment model preserves conservative cycle policy and subject ordering', /cycleResolution: 'mark_only_non_stable_resource_judgments_unresolved'/.test(model) && /ordering: 'preserve_input_subject_order'/.test(model)],
  ['rule set consumes the canonical judgment model rather than duplicating precedence', /judgmentModel: ResourceModelBindingSemanticJudgmentModelInterface/.test(model) && /judgmentModel: RESOURCE_MODEL_BINDING_SEMANTIC_JUDGMENT_MODEL/.test(model) && /precedence: RESOURCE_MODEL_BINDING_SEMANTIC_JUDGMENT_MODEL\.evidencePrecedence/.test(model)],
  ['runtime derives evidence basis from the canonical model', /RESOURCE_MODEL_BINDING_SEMANTIC_RULE_SET\.judgmentModel\.evidencePrecedence/.test(authority)],
  ['resource scanner sends complete controller scan judgment to batch authority', /controllerScan: input\.controllerScan/.test(scanner) && /input\.bindingAuthority\.judgeBatch\(/.test(scanner)],
  ['integrated invocation response remains a closed typed outcome', /php_source_invocation_integration_complete/.test(invocation) && /php_source_invocation_integration_blocked/.test(invocation)],
  ['pipeline preserves invocation inventory receipt instead of reconstructing response', /controllerInvocationSemanticInventory: invocationInventoryReceipt/.test(pipeline)],
  ['new interface and wiring avoid semantic foundation', !/semantic\/foundation/.test(model + authority + scanner)],
  ['audit command registered', packageJson.scripts?.['audit:phase1852-resource-binding-integrated-judgment-interface'] === 'node scripts/audits/audit-phase1852-resource-binding-integrated-judgment-interface.cjs'],
];
for (const [label, passed] of checks) console.log(`${passed ? 'PASS' : 'FAIL'} ${label}`);
console.log(`${checks.filter(([, passed]) => passed).length}/${checks.length} checks passed`);
if (checks.some(([, passed]) => !passed)) process.exitCode = 1;
