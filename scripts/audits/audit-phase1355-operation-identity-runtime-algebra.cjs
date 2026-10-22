const fs = require('node:fs');
const path = require('node:path');
const root = process.cwd();
const passed = [];
const failures = [];
const read = relative => fs.readFileSync(path.join(root, relative), 'utf8');
const requireText = (relative, needle, label) => {
  if (read(relative).includes(needle)) passed.push(label);
  else failures.push(`${relative}: missing ${label}`);
};
const forbidText = (relative, needle, label) => {
  if (!read(relative).includes(needle)) passed.push(label);
  else failures.push(`${relative}: ${label}`);
};

requireText('packages/core/src/types/upstream/operationIdentityCapability.ts', 'interface OperationIdentityCapabilityContractMaterializerInterface', 'type-only module declares a distinct upstream contract materializer');
requireText('packages/core/src/types/upstream/operationIdentityCapability.ts', 'materialize(input: OperationIdentityCapabilityInput): OperationIdentityCapabilityContract', 'materializer binds resolved upstream evidence to the closed capability result');
requireText('packages/core/src/types/upstream/operationIdentityCapabilityAlgebra.ts', 'operationIdentityCapabilityContractMaterializer: OperationIdentityCapabilityContractMaterializerInterface', 'canonical materializer implements its explicit contract');
requireText('packages/core/src/types/upstream/operationIdentityCapabilityAlgebra.ts', 'Object.freeze({', 'runtime algebra and capability result are sealed');
requireText('packages/core/src/types/upstream/operationIdentityCapabilityAlgebra.ts', 'const reasoning: SemanticReasoningContract = input.reasoning', 'algebra preserves upstream reasoning evidence');
requireText('packages/core/src/types/upstream/operationIdentityCapabilityAlgebra.ts', 'derivation: input.derivation', 'algebra preserves upstream derivation');
requireText('packages/core/src/types/upstream/operationIdentityCapabilityAlgebra.ts', 'provenance: input.provenance', 'algebra preserves upstream provenance');
requireText('packages/core/src/types/upstream/operationIdentityCapabilityAuthority.ts', 'materializer.materialize(input)', 'authority delegates construction to the injected materializer');
forbidText('packages/core/src/types/upstream/operationIdentityCapabilityAuthority.ts', "kind: 'operation_identity_capability'", 'authority does not reconstruct capability fields');
requireText('packages/core/src/types/upstream/index.ts', "export * from './operationIdentityCapabilityAlgebra'", 'upstream barrel exposes canonical materializer');
requireText('packages/core/src/index.ts', "export { operationIdentityCapabilityAlgebra } from './types/upstream/operationIdentityCapabilityAlgebra'", 'core public barrel exposes runtime algebra');
requireText('packages/core/src/index.ts', 'OperationIdentityCapabilityContractMaterializerInterface', 'core public barrel exposes the materializer contract type');
requireText('packages/core/src/compiler/scanner/subscanners/routeProducerRelations.ts', 'operationIdentityCapabilityFromRoute(boundary.capability)', 'route producer continues to enter through the upstream authority');
requireText('packages/cli/src/generators/sdk/apiObjectEmitter.ts', 'operationIdentityReferenceFromCapability(route.raw.operationIdentityCapability)', 'CLI remains a projection-only consumer');

const result = { phase: 1355, audit: 'operation-identity-runtime-algebra', passed: failures.length === 0, passedChecks: passed.length, failures };
process.stdout.write(JSON.stringify(result, null, 2) + '\n');
process.exitCode = failures.length ? 1 : 0;
