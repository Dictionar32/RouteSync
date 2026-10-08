const fs = require('node:fs');
const path = require('node:path');

const root = process.cwd();
const read = rel => fs.readFileSync(path.join(root, rel), 'utf8');
const checks = [];
const failures = [];

function must(rel, needle, label) {
  const ok = read(rel).includes(needle);
  checks.push({ label, ok });
  if (!ok) failures.push(`${rel}: ${label}`);
}

function mustNot(rel, pattern, label) {
  const ok = !(pattern instanceof RegExp ? pattern : new RegExp(pattern)).test(read(rel));
  checks.push({ label, ok });
  if (!ok) failures.push(`${rel}: forbidden semantic reconstruction: ${label}`);
}

const reasoning = read('packages/core/src/types/upstream/semanticReasoning.ts');
checks.push({
  label: 'public SemanticReasoningInterface is read-only consumer boundary',
  ok: /export interface SemanticReasoningInterface[\s\S]*extends SemanticReasoningConsumerInterface/.test(reasoning),
});
if (!checks.at(-1).ok) failures.push('semanticReasoning.ts: public reasoning interface is not consumer-facing');

must('packages/core/src/types/upstream/semanticReasoning.ts', 'SemanticReasoningExecutionAlgebraInterface', 'reasoning execution algebra is separately named');
must('packages/core/src/types/upstream/semanticReasoning.ts', 'SemanticReasoningContractInterface', 'reasoning proof contract exists');
must('packages/core/src/types/upstream/semanticReasoning.ts', 'SemanticReasoningWiringInterface', 'reasoning wiring contract exists');
must('packages/core/src/types/upstream/semanticCapability.ts', 'SemanticCapabilityContractInterface', 'semantic capability contract exists');
must('packages/core/src/types/upstream/semanticDataflow.ts', 'SemanticDataflowContractInterface', 'semantic dataflow contract exists');
must('packages/core/src/types/dataflow/dataFlowInterface.ts', 'DataFlowConsumerInterface', 'generic dataflow consumer boundary exists');
must('packages/core/src/types/dataflow/dataFlowInterface.ts', 'DataFlowWiringInterface', 'generic dataflow wiring boundary exists');
must('packages/core/src/types/interfaces/interfaceDependencyBoundary.ts', 'upstream_to_downstream', 'directional wiring contract exists');
must('packages/core/src/types/upstream/route.ts', 'readonly actionName: ActionName', 'route action name is upstream capability');
mustNot('packages/cli/src/generators/classifier/routeGrouper.ts', /matchCrudRole|method\.toLowerCase\(\)/, 'CLI does not derive action semantics from HTTP method');
mustNot('packages/react/src/hooks/define/intentWrapper.ts', /operationId\.split\(['"]\.['"]\)/, 'React does not reconstruct operation identity');
mustNot('packages/sdk/src/generateHooks.ts', /method\s*===\s*['"](?:GET|POST|PUT|PATCH|DELETE)['"]/, 'SDK hooks do not classify from HTTP method');
must('packages/core/src/types/interfaces/operationIdentityProjectionInterface.ts', 'UpstreamWiringInterface', 'operation identity uses explicit upstream wiring');

const result = {
  audit: 'semantic-interface-contract-phase1305',
  topology: 'reasoning execution -> proof contract -> public interface -> capability/dataflow -> upstream wiring -> downstream',
  passed: failures.length === 0,
  passedChecks: checks.filter(c => c.ok).length,
  totalChecks: checks.length,
  failures,
};
process.stdout.write(JSON.stringify(result, null, 2) + '\n');
process.exitCode = failures.length ? 1 : 0;
