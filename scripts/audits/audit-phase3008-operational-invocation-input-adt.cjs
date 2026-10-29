const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const read = p => fs.readFileSync(path.join(root, p), 'utf8');
const exists = p => fs.existsSync(path.join(root, p));
const checks = [
  ['input variants expose continueWith', /LaravelControllerInvocationPipelineNotProvidedInput[\s\S]*?continueWith:[\s\S]*?LaravelControllerInvocationPipelineProvidedInput[\s\S]*?continueWith:/.test(read('packages/core/src/types/upstream/laravelControllerInvocationSemanticJudgmentInterface.ts'))],
  ['input factory has explicit interface type', /export const laravelControllerInvocationSemanticInputFactory:\s*LaravelControllerInvocationSemanticInputFactoryInterface\s*=\s*Object\.freeze/.test(read('packages/core/src/types/upstream/laravelControllerInvocationSemanticJudgmentAuthority.ts'))],
  ['runtime judge dispatches through input operation', /return input\.continueWith<LaravelControllerInvocationSemanticJudgment>/.test(read('packages/core/src/types/upstream/laravelControllerInvocationSemanticJudgmentAuthority.ts'))],
  ['runtime judge has no input.kind switch', !/switch\s*\(input\.kind\)/.test(read('packages/core/src/types/upstream/laravelControllerInvocationSemanticJudgmentAuthority.ts'))],
  ['provided pipeline construction uses canonical factory', /laravelControllerInvocationSemanticInputFactory\.withPipeline\(/.test(read('packages/core/src/types/upstream/laravelControllerInvocationSemanticJudgmentPreparationAuthority.ts'))],
  ['absent pipeline production call uses canonical factory', /laravelControllerInvocationSemanticInputFactory\.withoutPipeline\(/.test(read('packages/core/src/compiler/scanner/operations/middlewareAstCanonical.ts'))],
  ['input contract version aligned', /version:\s*17/.test(read('packages/core/src/types/upstream/laravelControllerInvocationSemanticJudgmentAuthority.ts')) && /readonly version:\s*17/.test(read('packages/core/src/types/upstream/laravelControllerInvocationSemanticJudgmentInterface.ts'))],
  ['factory exported from upstream barrel', /laravelControllerInvocationSemanticInputFactory/.test(read('packages/core/src/types/upstream/index.ts'))],
  ['no legacy raw not-provided input callsites remain', !/judge\(\s*\{\s*kind:\s*'controller_invocation_pipeline_not_provided'/.test(fs.readFileSync(path.join(root,'packages/core/src/compiler/scanner/operations/middlewareAstCanonical.ts'),'utf8'))],
  ['collections.ts intentionally empty', fs.readFileSync(path.join(root,'packages/core/src/types/upstream/collections.ts'),'utf8').trim().length === 0],
  ['removed relationMembership foundation remains absent', !exists('packages/core/src/semantic/relations/relationMembership.ts')],
  ['removed relationalSequence foundation remains absent', !exists('packages/core/src/semantic/relations/relationalSequence.ts')],
  ['removed semanticRelations foundation remains absent', !exists('packages/core/src/semantic/relations/semanticRelations.ts')],
];
const result = { phase: 3008, title: 'Operational Invocation Input ADT', checks: checks.map(([name, passed]) => ({name, passed})), passed: checks.filter(([,passed])=>passed).length, total: checks.length };
console.log(JSON.stringify(result, null, 2));
process.exitCode = result.passed === result.total ? 0 : 1;
