const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const read = (relative) => fs.readFileSync(path.join(root, relative), 'utf8');
const exists = (relative) => fs.existsSync(path.join(root, relative));
const model = read('packages/core/src/types/upstream/resourceModelBindingSemanticInterface.ts');
const contract = read('packages/core/src/types/upstream/laravelResourceScannerInterface.ts');
const scanner = read('packages/core/src/compiler/scanner/wiring/laravelResourceScanner.ts');
const pipeline = read('packages/core/src/compiler/scanner/wiring/laravelSourceAstPipeline.ts');
const cli = read('packages/cli/src/parsers/php/controllerInvocationManifestComposition.ts');
const authority = read('packages/core/src/compiler/semantic/resourceModelBindingAuthority.ts');
const results = [
  ['semantic judgment model is upgraded to contract version 2', /contractVersion: 2/.test(model) && /ResourceModelBindingSemanticJudgmentModelInterface/.test(model)],
  ['outcome formation is declared for zero, one, and multiple candidates', /zeroCandidates: 'unresolved_with_subject_and_source_evidence'/.test(model) && /oneCandidate: 'resolved_with_candidate_specific_provenance'/.test(model) && /multipleCandidates: 'ambiguous_with_all_distinct_candidates_and_provenance'/.test(model)],
  ['batch closure contract declares stable order and conservative cycle semantics', /stableState: 'publish_all_judgments_in_input_subject_order'/.test(model) && /repeatedState: 'mark_only_non_stable_subjects_unresolved'/.test(model)],
  ['integrated invocation controller judgment is mandatory and detached projection forbidden', /controllerInput: 'complete_laravel_controller_scan_judgment'/.test(model) && /detachedProjection: 'forbidden'/.test(model)],
  ['resource integrated response contract declares projection and provenance invariants', /interface LaravelResourceIntegratedResponseContract/.test(contract) && /candidate_and_relation_evidence_remain_attached_to_judgment/.test(contract)],
  ['scanner interface binds to canonical judgment model and response contract', /semanticJudgmentModel: typeof RESOURCE_MODEL_BINDING_SEMANTIC_JUDGMENT_MODEL/.test(contract) && /responseContract: LaravelResourceIntegratedResponseContract/.test(contract)],
  ['integrated resource response retains the exact controller scan used for binding', /readonly controllerScan: LaravelControllerScanJudgment/.test(contract) && /controllerScan: input\.controllerScan/.test(scanner) && /sourceBinding: 'scan_judgment_carries_the_exact_controller_scan_object_used_for_binding'/.test(contract)],
  ['scanner executor uses canonical model and response contract', /semanticJudgmentModel: RESOURCE_MODEL_BINDING_SEMANTIC_JUDGMENT_MODEL/.test(scanner) && /responseContract: LARAVEL_RESOURCE_INTEGRATED_RESPONSE_CONTRACT/.test(scanner)],
  ['CLI invocation pipeline and source AST resource pipeline remain intact', /buildManifestWithInvocationPipeline/.test(cli) && /laravelResourceScanner\.scan/.test(pipeline)],
  ['legacy ResourceScanner is not recreated and resourceProducer dependency remains explicit', !exists('packages/core/src/compiler/scanner/operations/ResourceScanner.ts') && /resourceProducer\.produceResult/.test(scanner)],
  ['semantic authority still consumes the upstream declarative rule set', /RESOURCE_MODEL_BINDING_SEMANTIC_RULE_SET\.rules/.test(authority)],
  ['new model does not introduce semantic foundation dependency', !/semantic\/foundation/.test(model + contract + scanner)],
];
for (const [name, passed] of results) console.log(`${passed ? 'PASS' : 'FAIL'} ${name}`);
console.log(`RESULT ${results.filter(([, passed]) => passed).length}/${results.length}`);
if (results.some(([, passed]) => !passed)) process.exitCode = 1;
