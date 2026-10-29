const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const read = relative => fs.readFileSync(path.join(root, relative), 'utf8');
const exists = relative => fs.existsSync(path.join(root, relative));
const iface = read('packages/core/src/types/upstream/laravelControllerInvocationSemanticJudgmentPreparationInterface.ts');
const authority = read('packages/core/src/types/upstream/laravelControllerInvocationSemanticJudgmentPreparationAuthority.ts');
const composition = read('packages/cli/src/parsers/php/controllerInvocationManifestComposition.ts');
const barrel = read('packages/core/src/types/upstream/index.ts');
const pipelineAuthority = read('packages/core/src/types/upstream/phpSourceInvocationSemanticPipelineAuthority.ts');
const pipelineRuntime = read('packages/cli/src/parsers/php/sourceInvocationPipeline.ts');
const coreBarrel = read('packages/core/src/index.ts');
const checks = [
  ['preparation input owns continueToPreparation operation', /interface LaravelControllerInvocationSemanticJudgmentPreparationInput[\s\S]*?continueToPreparation:\s*\([\s\S]*?\)\s*=>\s*LaravelControllerInvocationSemanticJudgmentPreparationJudgment/.test(iface)],
  ['input factory has explicit interface annotation and frozen object', /export const laravelControllerInvocationSemanticJudgmentPreparationInputFactory:\s*LaravelControllerInvocationSemanticJudgmentPreparationInputFactoryInterface\s*=\s*Object\.freeze/.test(authority)],
  ['input factory constructs canonical frozen input', /input\s*=\s*Object\.freeze\(\{[\s\S]*?continueToPreparation:\s*\(dependencies[\s\S]*?laravelControllerInvocationSemanticJudgmentPreparationFactory\.prepare\(input, dependencies\)/.test(authority)],
  ['runtime composition constructs input through canonical factory', /laravelControllerInvocationSemanticJudgmentPreparationInputFactory\.create\(Object\.freeze\(/.test(composition)],
  ['runtime composition continues via ADT-owned domain operation', /preparationInput\.continueToPreparation\(Object\.freeze\(/.test(composition)],
  ['runtime composition no longer calls preparation factory directly', !/laravelControllerInvocationSemanticJudgmentPreparationFactory\.prepare\(/.test(composition)],
  ['input factory exported from upstream barrel', /laravelControllerInvocationSemanticJudgmentPreparationInputFactory/.test(barrel)],
  ['legacy preparation operation remains available for compatible callers', /readonly prepare:\s*\(/.test(iface) && /laravelControllerInvocationSemanticJudgmentPreparationFactory:\s*LaravelControllerInvocationSemanticJudgmentPreparationFactoryInterface/.test(authority)],
  ['pipeline authority factory is an explicitly typed frozen interface object', /export const phpSourceInvocationSemanticPipelineAuthorityFactory:\s*PhpSourceInvocationSemanticPipelineAuthorityFactoryInterface\s*=\s*Object\.freeze/.test(pipelineAuthority)],
  ['pipeline authority factory exposes a named create operation', /interface PhpSourceInvocationSemanticPipelineAuthorityFactoryInterface[\s\S]*?readonly create:/.test(pipelineAuthority)],
  ['CLI runtime calls the typed factory create operation', /phpSourceInvocationSemanticPipelineAuthorityFactory\.create\(/.test(pipelineRuntime)],
  ['old callable pipeline factory export removed from source barrels', !/createPhpSourceInvocationSemanticPipelineAuthority/.test(barrel + coreBarrel + pipelineAuthority + pipelineRuntime)],
  ['collections.ts remains whitespace-only', fs.readFileSync(path.join(root, 'packages/core/src/types/upstream/collections.ts'), 'utf8').trim().length === 0],
  ['deleted relationMembership foundation remains absent', !exists('packages/core/src/semantic/relations/relationMembership.ts')],
  ['deleted relationalSequence foundation remains absent', !exists('packages/core/src/semantic/relations/relationalSequence.ts')],
  ['deleted semanticRelations foundation remains absent', !exists('packages/core/src/semantic/relations/semanticRelations.ts')],
];
const result = { phase: 3012, title: 'Preparation Input Operational ADT', checks: checks.map(([name, passed]) => ({ name, passed })), passed: checks.filter(([, passed]) => passed).length, total: checks.length };
console.log(JSON.stringify(result, null, 2));
process.exitCode = result.passed === result.total ? 0 : 1;
