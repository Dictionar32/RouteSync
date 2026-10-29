const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const serializerPath = path.join(root, 'packages/cli/src/generators/ManifestSerializer.ts');
const compositionPath = path.join(root, 'packages/cli/src/parsers/php/controllerInvocationManifestComposition.ts');
const compositionTypesPath = path.join(root, 'packages/cli/src/parsers/php/controllerInvocationManifestCompositionInterface.ts');
const upstreamPath = path.join(root, 'packages/core/src/types/upstream');
const serializer = fs.readFileSync(serializerPath, 'utf8');
const composition = fs.readFileSync(compositionPath, 'utf8');
const compositionTypes = fs.readFileSync(compositionTypesPath, 'utf8');
const checks = [
  ['route serializer has explicit operation interface', /interface ManifestRouteSerializationOperationInterface/.test(serializer)],
  ['contract serializer has explicit operation interface', /interface ManifestContractSerializationOperationInterface/.test(serializer)],
  ['runtime serializer is interface-owned and frozen', /export const manifestRuntimeSerializationOperation: ManifestRuntimeSerializationOperationInterface = Object\.freeze\(/.test(serializer)],
  ['public serialization entrypoint delegates to typed runtime operation', /export const manifestSerializationOperations: ManifestSerializationOperationsInterface = Object\.freeze\(\{\s*serialize: manifestRuntimeSerializationOperation\.serialize/s.test(serializer)],
  ['route serialization preserves binding provenance without reconstructing it', /binding: route\.binding/.test(serializer)],
  ['manifest contract projection preserves request body schema', /schema: serialized\.request\.body\.schema/.test(serializer)],
  ['serialization terminal ADT owns a continuation operation', /readonly continueWith: <Result>\(handlers: ManifestSerializationHandlers<Result>\) => Result/.test(serializer)],
  ['CLI invocation manifest builder remains interface-first', /export const controllerInvocationManifestBuilder: ControllerInvocationManifestBuilderInterface = Object\.freeze\(/.test(composition)],
  ['CLI invocation manifest terminal ADT owns domain continuation', /readonly continueForDriftAudit: <Result>\(handlers: ControllerInvocationManifestDriftAuditHandlersInterface<Result>\) => Result/.test(compositionTypes)],
  ['no exported function declarations in traced runtime modules', !/^export\s+function\s/m.test(serializer + '\n' + composition + '\n' + compositionTypes)],
  ['upstream collections module remains intentionally empty', fs.readFileSync(path.join(upstreamPath, 'collections.ts'), 'utf8').trim().length === 0],
  ['deleted relation foundation modules remain absent', !['relationMembership.ts', 'relationalSequence.ts', 'semanticRelations.ts'].some(name => fs.existsSync(path.join(root, 'packages/core/src/semantic/relations', name)))],
];
let failed = 0;
for (const [label, passed] of checks) {
  process.stdout.write(`${passed ? 'PASS' : 'FAIL'} ${label}\n`);
  if (!passed) failed += 1;
}
process.stdout.write(`\n${checks.length - failed}/${checks.length} checks passed\n`);
process.exitCode = failed === 0 ? 0 : 1;
