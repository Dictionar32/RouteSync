const fs = require('node:fs');
const path = require('node:path');
const root = process.cwd();
const read = relative => fs.readFileSync(path.join(root, relative), 'utf8');
const pipeline = read('packages/core/src/types/upstream/invocationSemanticPipelineInterface.ts');
const scanner = read('packages/core/src/types/upstream/laravelControllerScannerInterface.ts');
const index = read('packages/core/src/index.ts');
const checks = [];
const check = (name, passed) => checks.push({ name, passed: Boolean(passed) });
const namedTypes = [
  'InvocationStaticPositionalEvidenceJudgment',
  'InvocationStaticTargetResolutionJudgment',
  'InvocationStaticArgumentBindingStageJudgment',
  'InvocationStaticEffectProjectionStageJudgment',
  'InvocationStaticSemanticJudgmentCandidate',
];
check('generic stage judgment abstraction is removed from upstream model', !pipeline.includes('InvocationStaticSemanticStageJudgment<'));
check('all five invocation stage outputs have domain-owned interfaces', namedTypes.every(name => new RegExp(`export interface ${name}\\s*\\{`).test(pipeline)));
check('each stage judgment carries source-bound context and a semantically named result field',
  /interface InvocationStaticPositionalEvidenceJudgment\s*\{[\s\S]*?readonly context: InvocationStaticResolvedSourceContext;[\s\S]*?readonly evidenceJudgment: InvocationStaticPositionalEvidenceResult;/.test(pipeline) &&
  /interface InvocationStaticTargetResolutionJudgment\s*\{[\s\S]*?readonly context: InvocationStaticResolvedSourceContext;[\s\S]*?readonly resolution: InvocationStaticTargetResolution;/.test(pipeline) &&
  /interface InvocationStaticArgumentBindingStageJudgment\s*\{[\s\S]*?readonly context: InvocationStaticResolvedSourceContext;[\s\S]*?readonly binding: InvocationStaticArgumentBindingJudgment;/.test(pipeline) &&
  /interface InvocationStaticEffectProjectionStageJudgment\s*\{[\s\S]*?readonly context: InvocationStaticResolvedSourceContext;[\s\S]*?readonly projection: InvocationStaticEffectProjectionJudgment;/.test(pipeline) &&
  /interface InvocationStaticSemanticJudgmentCandidate\s*\{[\s\S]*?readonly context: InvocationStaticResolvedSourceContext;[\s\S]*?readonly judgment: InvocationStaticSemanticJudgment;/.test(pipeline));
check('binding requires target-resolution and positional-evidence domain judgments', /interface InvocationStaticArgumentBindingAlgebraInput\s*\{[\s\S]*?readonly targetResolution: InvocationStaticTargetResolutionJudgment;[\s\S]*?readonly positionalEvidence: InvocationStaticPositionalEvidenceJudgment;/.test(pipeline));
check('effect projection requires the target-resolution domain judgment', /interface InvocationStaticEffectProjectionAlgebraInput\s*\{\s*readonly targetResolution: InvocationStaticTargetResolutionJudgment;\s*\}/.test(pipeline));
check('assembly requires target, binding, and effect judgments of their exact domain types', /interface InvocationStaticJudgmentAssemblyInput\s*\{[\s\S]*?readonly targetResolution: InvocationStaticTargetResolutionJudgment;[\s\S]*?readonly argumentBinding: InvocationStaticArgumentBindingStageJudgment;[\s\S]*?readonly effects: InvocationStaticEffectProjectionStageJudgment;/.test(pipeline));
check('derived algebra result hands a named judgment candidate to authority', /readonly kind: 'derived';[\s\S]*?readonly candidate: InvocationStaticSemanticJudgmentCandidate;/.test(pipeline));
check('authority receives the derived result only and does not accept detached knowledge or judgment', /interface InvocationStaticSemanticAuthorityValidationInput\s*\{[\s\S]*?readonly derivation: Extract<InvocationStaticSemanticAlgebraResult, \{ readonly kind: 'derived' \}>;/.test(pipeline) && !/interface InvocationStaticSemanticAuthorityValidationInput\s*\{[^}]*readonly knowledge: SemanticKnowledgeDataFlow/.test(pipeline) && !/interface InvocationStaticSemanticAuthorityValidationInput\s*\{[^}]*readonly judgment: InvocationStaticSemanticJudgment/.test(pipeline));
check('algebra type/value contract synchronized at v6', /interface InvocationStaticSemanticAlgebraContract\s*\{[\s\S]*?readonly version: 6;/.test(pipeline) && /INVOCATION_STATIC_SEMANTIC_ALGEBRA_CONTRACT[\s\S]*?version: 6,/.test(pipeline));
check('authority contract and validation receipt synchronized at v9', /interface InvocationStaticSemanticAuthorityValidationContract\s*\{[\s\S]*?readonly version: 9;/.test(pipeline) && /INVOCATION_STATIC_SEMANTIC_AUTHORITY_VALIDATION_CONTRACT[\s\S]*?version: 9,/.test(pipeline) && /interface InvocationStaticSemanticAuthorityValidationReceipt\s*\{[\s\S]*?contractVersion: 9;/.test(pipeline));
check('pipeline type/value contract synchronized at v46 and states named stage judgments', /interface InvocationSemanticPipelineContract\s*\{[\s\S]*?readonly version: 46;[\s\S]*?staticStageBinding: 'each-static-rule-returns-a-domain-specific-context-bound-judgment-and-downstream-rules-consume-the-required-domain-judgment'/.test(pipeline) && /kind: 'invocation_semantic_pipeline_contract',[\s\S]*?version: 46,[\s\S]*?staticStageBinding: 'each-static-rule-returns-a-domain-specific-context-bound-judgment-and-downstream-rules-consume-the-required-domain-judgment'/.test(pipeline));
check('Laravel scanner boundary v25 preserves scanner-only collection/delegation responsibility', /interface LaravelControllerInvocationSemanticBoundaryContract\s*\{[\s\S]*?readonly version: 25;[\s\S]*?scannerRuntime: 'source-artifact-collection-only-no-semantic-judgment-construction'/.test(scanner) && /LARAVEL_CONTROLLER_INVOCATION_SEMANTIC_BOUNDARY_CONTRACT[\s\S]*?version: 25,/.test(scanner));
check('all named domain judgment interfaces are publicly exported', namedTypes.every(name => index.includes(name)));
check('no semantic/foundation dependency or any/as-any escape hatch introduced', !pipeline.includes('semantic/foundation') && !scanner.includes('semantic/foundation') && !/\b(?:readonly\s+)?[A-Za-z_$][\w$]*:\s*any\b|\bas\s+any\b/.test(pipeline.slice(pipeline.indexOf('export interface InvocationStaticPositionalEvidenceJudgment'), pipeline.indexOf('export interface InvocationStaticSemanticAlgebraContract'))));
const failed = checks.filter(item => !item.passed);
for (const item of checks) process.stdout.write(`${item.passed ? 'PASS' : 'FAIL'} ${item.name}\n`);
process.stdout.write(`\n${checks.length - failed.length}/${checks.length} Phase 1723 interface checks passed.\n`);
process.stdout.write('SCOPE: interface/model correction only; no static algebra runtime, authority implementation, or production scanner wiring is claimed.\n');
fs.writeFileSync(path.join(root, 'PHASE1723_AUDIT.json'), JSON.stringify({ phase: 1723, name: 'domain-owned-invocation-stage-judgments', total: checks.length, passed: checks.length - failed.length, failed: failed.length, checks }, null, 2) + '\n');
if (failed.length) process.exit(1);
