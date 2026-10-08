const fs = require('node:fs');
const path = require('node:path');
const root = process.cwd();
const failures = [];
const passed = [];
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');
const has = (file, pattern, label) => {
  if (pattern.test(read(file))) passed.push(label);
  else failures.push(`${file}: missing ${label}`);
};
const lacks = (file, pattern, label) => {
  if (pattern.test(read(file))) failures.push(`${file}: forbidden downstream semantic construction: ${label}`);
  else passed.push(label);
};

has('packages/core/src/types/domain/routes.ts', /readonly operationIdentityCapability:\s*OperationIdentityCapabilityContract/, 'RouteSemanticFlow carries the closed operation identity capability');
has('packages/core/src/compiler/scanner/descriptors/route/routeDeclarations.ts', /operationIdentityCapability:\s*operationIdentityCapabilityFromRoute\(capability\)/, 'canonical route semantic producer creates identity capability upstream');
has('packages/core/src/compiler/scanner/subscanners/routeProducerRelations.ts', /operationIdentityCapability:\s*operationIdentityCapabilityFromRoute\(boundary\.capability\)/, 'route boundary producer preserves identity capability in semantic flow');
has('packages/cli/src/generators/sdk/apiObjectEmitter.ts', /operationIdentityReferenceFromCapability\(route\.raw\.operationIdentityCapability\)/, 'CLI emitter projects the already-closed capability');
has('packages/core/src/compiler/scanner/wiring/operationIdentityProjection.ts', /UpstreamWiringInterface|OperationIdentityProjectionInterface/, 'identity projection remains an explicit wiring interface');
has('packages/sdk/src/defineApi.ts', /missing the upstream operation identity projection/, 'SDK fails closed when projected identity is absent');
has('packages/sdk/src/generateHooks.ts', /endpoint\.\$queryKey\(options\)/, 'generic query hook consumes the canonical endpoint query key');
has('packages/react/src/hooks/useQuery.ts', /endpoint\.\$queryKey\(options\)/, 'React query hooks consume the canonical endpoint query key');
has('examples/ecommerce-shop-source/frontend/src/lib/generic/generic-hooks.ts', /queryKey:\s*queryKey\.list\(\)|queryKey:\s*queryKey\.detail\(validId\)/, 'fixture handwritten generic hooks use service-provided keys, not RouteSync identity authority');
lacks('packages/cli/src/generators/sdk/apiObjectEmitter.ts', /operationIdentityCapabilityFromRoute\s*\(/, 'CLI does not construct semantic identity capability');
lacks('packages/sdk/src/defineApi.ts', /operationIdentityCapabilityFromRoute|operationIdentityReferenceFromCapability\s*\(/, 'SDK does not mint or reproject semantic identity');
lacks('packages/react/src/hooks/useQuery.ts', /operationIdentityCapabilityFromRoute|operationIdentityReferenceFromCapability\s*\(/, 'React does not mint or reproject semantic identity');
lacks('packages/sdk/src/generateHooks.ts', /method\s*===\s*['"](?:GET|POST|PUT|PATCH|DELETE)['"]/, 'hook generator does not classify hook kind from HTTP method');

const result = { audit: 'phase1343-operation-identity-upstream-wiring', passed: failures.length === 0, passedChecks: passed.length, failures };
process.stdout.write(JSON.stringify(result, null, 2) + '\n');
process.exitCode = failures.length ? 1 : 0;
