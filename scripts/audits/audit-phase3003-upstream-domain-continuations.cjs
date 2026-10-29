const fs = require('node:fs');
const path = require('node:path');
const root = process.cwd();
const checks = [];
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
const check = (name, predicate, detail) => checks.push({ name, passed: Boolean(predicate), detail });

const authorityInterface = read('packages/core/src/types/upstream/controllerDataflowSemanticJudgmentAuthorityInterface.ts');
const authority = read('packages/core/src/types/upstream/controllerDataflowSemanticJudgmentAuthority.ts');
const pipelineInterface = read('packages/core/src/types/upstream/invocationSemanticPipelineInterface.ts');
const publicationAuthority = read('packages/core/src/types/upstream/invocationSemanticCoveragePublicationAuthority.ts');
const upstreamIndex = read('packages/core/src/types/upstream/index.ts');
const test = read('packages/core/src/compiler/scanner/__test__/ecommerceShopDataflowPhase104.spec.ts');

check('factory-interface-exists', authorityInterface.includes('interface ControllerDataflowSemanticJudgmentAuthorityFactoryInterface'), 'Factory contract is declared in upstream interface module.');
check('factory-is-explicit-const', /export const controllerDataflowSemanticJudgmentAuthorityFactory:\s*ControllerDataflowSemanticJudgmentAuthorityFactoryInterface\s*=\s*Object\.freeze/.test(authority), 'Runtime factory uses export const name: Interface = Object.freeze({...}).');
check('legacy-parameterized-factory-removed', !authority.includes('createControllerDataflowSemanticJudgmentAuthority'), 'Old exported parameterized factory name is absent.');
check('singleton-uses-canonical-factory', /controllerDataflowSemanticJudgmentAuthorityFactory\.create\(Object\.freeze\(/.test(authority), 'Production singleton is composed through the same interface-first factory.');
check('factory-exported-upstream', upstreamIndex.includes('controllerDataflowSemanticJudgmentAuthorityFactory'), 'Upstream barrel exposes the new operation.');
check('dependencies-have-domain-contract', authorityInterface.includes('interface ControllerDataflowSemanticJudgmentAuthorityDependencies'), 'Factory dependencies are part of the upstream interface contract.');
check('publication-result-handlers-exist', pipelineInterface.includes('interface InvocationSemanticCoveragePublicationResultHandlers<Result>'), 'Publication ADT exposes typed validated/rejected handlers.');
check('pipeline-contract-version-synchronized', /interface InvocationSemanticPipelineContract \{\s*readonly kind: 'invocation_semantic_pipeline_contract';\s*readonly version: 62;/.test(pipelineInterface) && /INVOCATION_SEMANTIC_PIPELINE_CONTRACT: InvocationSemanticPipelineContract = Object\.freeze\(\{\s*kind: 'invocation_semantic_pipeline_contract',\s*version: 62,/.test(pipelineInterface), 'Pipeline contract interface and runtime value both declare version 62.');
check('publication-result-has-continuation', /continueWith:\s*<Result>\(handlers: InvocationSemanticCoveragePublicationResultHandlers<Result>\) => Result/.test(pipelineInterface), 'Both publication outcomes require continueWith.');
check('validated-outcome-continues-domain-handler', publicationAuthority.includes('handlers.onValidated(validated)'), 'Validated publication delegates to onValidated without reclassification.');
check('rejected-outcome-continues-domain-handler', publicationAuthority.includes('handlers.onRejected(rejected)'), 'Rejected publication delegates to onRejected while retaining its violation ledger.');
check('consumer-example-uses-continuation', test.includes('response.continueWith({') && !/switch\s*\(response\.kind\)/.test(test), 'Focused scanner test consumes publication ADT through its domain operation.');
check('no-export-function-in-changed-runtime-modules', !/^export\s+(?:async\s+)?function\s+/m.test(authority + '\n' + publicationAuthority), 'Changed runtime authority modules contain no exported function declarations.');
check('collections-remains-empty', fs.statSync(path.join(root, 'packages/core/src/types/upstream/collections.ts')).size === 0, 'Intentionally empty collections.ts remains untouched.');
for (const rel of ['packages/core/src/semantic/relations/relationMembership.ts', 'packages/core/src/semantic/relations/relationalSequence.ts', 'packages/core/src/semantic/relations/semanticRelations.ts']) {
  check(`forbidden-relation-foundation-absent:${path.basename(rel)}`, !fs.existsSync(path.join(root, rel)), `${rel} was not restored.`);
}
const failed = checks.filter(c => !c.passed);
const result = { phase: 3003, title: 'Upstream Domain Continuations and Interface-First Runtime Factory', passed: checks.length - failed.length, total: checks.length, checks };
fs.writeFileSync(path.join(root, 'PHASE3003_AUDIT.json'), JSON.stringify(result, null, 2) + '\n');
console.log(JSON.stringify(result, null, 2));
if (failed.length) process.exit(1);
