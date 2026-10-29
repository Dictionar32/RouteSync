const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');
const checks = [];
const check = (name, condition) => checks.push({ name, passed: Boolean(condition) });

const contract = read('packages/core/src/types/upstream/controllerDataflowSemanticJudgmentAuthorityInterface.ts');
const authority = read('packages/core/src/types/upstream/controllerDataflowSemanticJudgmentAuthority.ts');
const analyzer = read('packages/core/src/compiler/frontend/php/controllerDataflowAnalyzer.ts');
const wiring = read('packages/core/src/compiler/scanner/wiring/controllerVariableSemanticRuntimeBinding.ts');
const model = read('packages/core/src/types/upstream/controllerDataflowInvocationSemanticModelInterface.ts');

const deriveInput = contract.split('export interface ControllerDataflowSemanticJudgmentAuthorityInput')[1]?.split('\n}\n')[0] ?? '';
check('authority contract version remains coherent at v11 across interface and implementation',
  contract.includes('readonly contractVersion: 13;') && authority.includes('contractVersion: 13,') && contract.includes('readonly version: 13;') && contract.includes('  version: 13,'));
check('per-invocation derive input packages source evidence and judgment into one correlation value, not orchestration authorities',
  deriveInput.includes('sourceCorrelation: ControllerDataflowSourceCorrelationInterface<Payload>') && deriveInput.includes('definitionProjectionAuthority') && !deriveInput.includes('statementPayloads') && !deriveInput.includes('invocationJudgment') && !deriveInput.includes('correspondenceAuthority') && !deriveInput.includes('variableIdentityAuthority') && !deriveInput.includes('variableFlowCompositionAuthority') && !deriveInput.includes('invocationResponseComposition'));
check('upstream authority owns correspondence, identity, variable flow and integrated-response composition',
  authority.includes('controllerDataflowBindingPayloadCorrespondenceAuthority.judge') && authority.includes('controllerDataflowVariableIdentityAuthority.resolve') && authority.includes('controllerSemanticVariableFlowCompositionAuthority.compose') && authority.includes('invocationSemanticIntegratedResponseComposition.integrate'));
check('analyzer only projects source evidence and invokes one complete judgment authority',
  analyzer.includes('semanticKnowledgeEvidenceAdapter.project') && analyzer.includes('sourcePayloadEvidenceAdapter.collect') && analyzer.includes('semanticJudgmentAuthority.derive') && !analyzer.includes('ControllerDataflowBindingPayloadCorrespondenceAuthorityInterface') && !analyzer.includes('ControllerDataflowVariableIdentityAuthorityInterface') && !analyzer.includes('ControllerSemanticVariableFlowCompositionAuthorityInterface'));
check('scanner wiring no longer passes correspondence, identity, variable-flow or response authorities into analyzer',
  !wiring.includes('controllerDataflowBindingPayloadCorrespondenceAuthority') && !wiring.includes('controllerDataflowVariableIdentityAuthority') && !wiring.includes('controllerSemanticVariableFlowCompositionAuthority') && !wiring.includes('invocationSemanticIntegratedResponseComposition'));
check('binding unresolved/resolved outcomes remain correlated in one discriminated judgment',
  model.includes('controller_dataflow_binding_correspondence_unresolved') && model.includes('controller_dataflow_binding_identity_unresolved') && model.includes('controller_dataflow_binding_semantics_resolved') && model.includes('bindingJudgments'));
check('canonical invocation judgment and integrated response remain separate values',
  model.includes('readonly invocationJudgment: LaravelControllerInvocationSemanticJudgmentInterface;') && model.includes('readonly invocationSemanticIntegratedResponse: InvocationSemanticIntegratedResponseCompositionResult;'));

for (const result of checks) process.stdout.write(`${result.passed ? 'PASS' : 'FAIL'} ${result.name}\n`);
process.stdout.write(`RESULT ${checks.filter((item) => item.passed).length}/${checks.length}\n`);
if (checks.some((item) => !item.passed)) process.exitCode = 1;
