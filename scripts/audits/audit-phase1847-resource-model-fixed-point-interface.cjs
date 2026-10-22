const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const read = relative => fs.readFileSync(path.join(root, relative), 'utf8');
const semantic = read('packages/core/src/types/upstream/laravelScannerSemanticJudgment.ts');
const authority = read('packages/core/src/compiler/semantic/resourceModelBindingAuthority.ts');
const scanner = read('packages/core/src/compiler/scanner/wiring/laravelResourceScanner.ts');
const contract = read('packages/core/src/types/upstream/laravelResourceScannerInterface.ts');
const pipeline = read('packages/core/src/compiler/scanner/wiring/laravelSourceAstPipeline.ts');
const packageJson = JSON.parse(read('package.json'));
const checks = [
  ['semantic judgment contract version advances to 9', /readonly version: 9/.test(semantic) && /version: 9/.test(semantic)],
  ['resource binding authority exposes a batch judgment interface', /readonly judgeBatch: \(input: ResourceModelBindingBatchJudgmentInput\) => ResourceModelBindingBatchJudgment/.test(semantic)],
  ['batch input owns all resource subjects and complete controller judgment', /readonly subjects: readonly ResourceModelBindingSubject\[\]/.test(semantic) && /readonly controllerScan: LaravelControllerScanJudgment/.test(semantic)],
  ['batch result carries an explicit closed fixed-point receipt', /kind: 'resource_model_binding_fixed_point_closure'/.test(semantic) && /readonly closed: true/.test(semantic) && /whole-resource-model-candidate-lattice/.test(semantic)],
  ['authority propagates relation candidates from resolved or ambiguous prior child judgments', /input\.knownBindings/.test(authority) && /relationVariantFold\([\s\S]*?judgment\.outcome,[\s\S]*?'resolved'/.test(authority) && /'ambiguous'/.test(authority)],
  ['authority computes whole-subject fixed-point closure and closes batch completeness before scanner projection', /const judgeBatch = \(input: ResourceModelBindingBatchJudgmentInput\)/.test(authority) && /sameState\(current, next\)/.test(authority) && /const completeness: ResourceModelBindingBatchCompleteness/.test(authority) && /contractVersion: 3/.test(authority) && /judgeBatch,/.test(authority)],
  ['non-convergent relation cycles become explicit unresolved judgments instead of guessed models', /unresolvedCycleJudgment/.test(authority) && /kind: 'cycle_conservative'/.test(authority) && /relation_binding_unresolved/.test(authority)],
  ['resource scanner collects all subjects and calls batch authority exactly once', /const subjects = Object\.freeze\(resourceSubjects\.map/.test(scanner) && /resourceModelBindingAuthority\.judgeBatch\(/.test(scanner) && !/resourceModelBindingAuthority\.judge\(/.test(scanner)],
  ['scanner projects each source-ordered evidence item through exact-subject authority correspondence', /resourceSubjects\.map\(subjectEntry =>/.test(scanner) && /bindingAuthority\.bindingForSubject\(bindingBatch, subject\)/.test(scanner) && !/bindingBatch\.judgments\[index\]/.test(scanner)],
  ['resource scan judgment retains the closure receipt', /readonly bindingClosure: ResourceModelBindingBatchClosure/.test(contract) && /bindingClosure,/.test(scanner)],
  ['batch completeness is judged upstream and folded without scanner-side completeness reasoning', /ResourceModelBindingBatchCompleteness/.test(semantic) && /resourceModelBindingBatchCompletenessFold\.fold/.test(scanner) && !/if \(rejectedArtifacts\.length > 0\)/.test(scanner)],
  ['resource scanner and scan judgments remain aligned at contract version 19', /contractVersion: 19/.test(contract) && /contractVersion: 19/.test(scanner)],
  ['pipeline still forwards integrated controller judgment without reconstructing invocation semantics', /controllerScan,/.test(pipeline) && /resourceScanner\.scan/.test(pipeline) && !/semantic\/foundation/.test(pipeline)],
  ['resource producer remains a projection and does not own binding decisions', /resourceProducerOperations\.produceResult/.test(scanner) && !/ResourceNamingConvention|modelRelation/.test(scanner)],
  ['public package exports the batch closure and completeness contracts', /ResourceModelBindingBatchJudgmentInput, ResourceModelBindingBatchJudgment, ResourceModelBindingSubjectJudgment, ResourceModelBindingBatchClosure/.test(read('packages/core/src/index.ts')) && /ResourceModelBindingBatchCompleteness/.test(read('packages/core/src/index.ts'))],
  ['audit command is registered', packageJson.scripts?.['audit:phase1847-resource-model-fixed-point-interface'] === 'node scripts/audits/audit-phase1847-resource-model-fixed-point-interface.cjs'],
];
for (const [label, passed] of checks) console.log(`${passed ? 'PASS' : 'FAIL'} ${label}`);
const passed = checks.filter(([, value]) => value).length;
console.log(`${passed}/${checks.length} checks passed`);
if (passed !== checks.length) process.exitCode = 1;
