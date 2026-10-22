const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const read = (relative) => fs.readFileSync(path.join(root, relative), 'utf8');
const model = read('packages/core/src/types/upstream/resourceModelBindingSemanticInterface.ts');
const authority = read('packages/core/src/compiler/semantic/resourceModelBindingAuthority.ts');
const scanner = read('packages/core/src/compiler/scanner/wiring/laravelResourceScanner.ts');
const checks = [
  ['upstream rule set owns candidate derivation relations', ['resource_model_class_origin', 'resource_model_table_origin', 'resource_model_convention_key', 'resource_model_candidate_evidence'].every((value) => model.includes(value))],
  ['controller class and table evidence are declarative rules', /resource-model-controller-class-origin/.test(model) && /resource-model-controller-table-origin/.test(model)],
  ['resource convention candidate is a declarative rule', /resource-model-convention-candidate/.test(model) && /resource_model_short_name/.test(model)],
  ['relation propagation is a declarative recursive rule', /resource-model-relation-propagation/.test(model) && /resource_model_prior_selected_candidate/.test(model)],
  ['precedence and selected candidate are derived by the rule set', /resource-model-precedence-controller-dataflow/.test(model) && /resource-model-select-candidate-at-winning-tier/.test(model)],
  ['candidate provenance is represented as a relation', /resource_model_candidate_provenance/.test(model)],
  ['authority seeds source facts and calls shared semantic executor', /sourceEvidenceFacts/.test(authority) && /semanticRewriteRuntimeExecutor\.executeRelations/.test(authority)],
  ['authority no longer implements controller/model matching locally', !/originMatchesModel|relationPropagationEvidence|conventionBindingEvidence/.test(authority)],
  ['authority no longer performs local precedence selection', !/const selectedPrecedence|selectedPrecedence !== undefined/.test(authority)],
  ['authority rejects incomplete semantic closure rather than claiming success', /if \(!derivation\.closed\)/.test(authority)],
  ['source provenance is reattached to typed evidence', /Missing source provenance/.test(authority) && /evidenceBasisFromAtom/.test(authority)],
  ['resource scanner still delegates binding decisions to authority', /bindingAuthority\.judgeBatch/.test(scanner)],
  ['no semantic foundation dependency introduced', !/semantic\/foundation/.test(model + authority + scanner)],
  ['no unsafe casts added to the authority', !/\sas\s+(unknown|any|ResourceModelBindingEvidence)/.test(authority)],
  ['resource scanner contract version advanced with semantic contract', /contractVersion: 10/.test(scanner) && /contractVersion: 10/.test(read('packages/core/src/types/upstream/laravelResourceScannerInterface.ts'))],
];
let failed = false;
for (const [name, passed] of checks) {
  process.stdout.write(`${passed ? 'PASS' : 'FAIL'} ${name}\n`);
  failed ||= !passed;
}
process.stdout.write(`Phase 1851: ${checks.filter(([, passed]) => passed).length}/${checks.length}\n`);
process.exitCode = failed ? 1 : 0;
