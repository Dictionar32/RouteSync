const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const read = (relative) => fs.readFileSync(path.join(root, relative), 'utf8');
const checks = [
  ['preparation packet extends source input contract', /interface RequestTypeDerivationSemanticInputPreparation extends RequestTypeDerivationInput/.test(read('packages/core/src/types/upstream/requestTypeDerivationInterface.ts'))],
  ['prepared packet preserves original input', /kind: 'request_type_derivation_semantic_input_preparation',[\s\S]*?input,/.test(read('packages/core/src/compiler/semantic/request-type-derivation/requestTypeDerivationSemanticInputPreparation.ts'))],
  ['prepared packet exposes source input fields at top level', /return Object\.freeze\(\{\s*\.\.\.input,\s*kind: 'request_type_derivation_semantic_input_preparation'/.test(read('packages/core/src/compiler/semantic/request-type-derivation/requestTypeDerivationSemanticInputPreparation.ts'))],
  ['manifest preflight carries exact prepared packet', /semanticInput: prepared,/.test(read('packages/core/src/compiler/scanner/wiring/routeManifestRequestResolutionPreflight.ts'))],
  ['preflight type declares prepared semantic packet', /readonly semanticInput: RequestTypeDerivationSemanticInputPreparation/.test(read('packages/core/src/compiler/scanner/wiring/routeManifestProjectionInterface.ts'))],
  ['lowering sends prepared packet to upstream preparation boundary', /operationPreparation\.prepare\(preflight\.semanticInput\)/.test(read('packages/core/src/compiler/scanner/wiring/routeManifestTypeLoweringAuthority.ts'))],
  ['operation preparation rejects raw-only input at its interface', /readonly prepare: \(input: RequestTypeDerivationSemanticInputPreparation\)/.test(read('packages/core/src/types/upstream/requestTypeDerivationInterface.ts'))],
  ['old raw-input lowering call removed', !/operationPreparation\.prepare\(preflight\.input\)/.test(read('packages/core/src/compiler/scanner/wiring/routeManifestTypeLoweringAuthority.ts'))],
  ['no semantic foundation dependency introduced', !/semantic\/foundation/.test(['packages/core/src/types/upstream/requestTypeDerivationInterface.ts','packages/core/src/compiler/semantic/request-type-derivation/requestTypeDerivationSemanticInputPreparation.ts','packages/core/src/compiler/semantic/request-type-derivation/requestTypeDerivationOperationPreparation.ts','packages/core/src/compiler/scanner/wiring/routeManifestProjectionInterface.ts','packages/core/src/compiler/scanner/wiring/routeManifestRequestResolutionPreflight.ts','packages/core/src/compiler/scanner/wiring/routeManifestTypeLoweringAuthority.ts'].map(read).join('\n'))],
];
for (const [name, passed] of checks) console.log(`${passed ? 'PASS' : 'FAIL'} ${name}`);
console.log(`${checks.filter(([, passed]) => passed).length}/${checks.length} assertions passed`);
if (checks.some(([, passed]) => !passed)) process.exitCode = 1;
