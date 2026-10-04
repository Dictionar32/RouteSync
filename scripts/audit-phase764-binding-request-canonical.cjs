const fs = require('fs');
const path = require('path');
const root = path.resolve(__dirname, '..');
const read = p => fs.readFileSync(path.join(root, p), 'utf8');
const exists = p => fs.existsSync(path.join(root, p));
const binding = read('packages/core/src/types/domain/routes.ts');
const input = read('packages/core/src/compiler/scanner/resolvers/boundary/boundaryInputResolution.ts');
const builder = read('packages/core/src/compiler/scanner/resolvers/boundary/bindingBuilder.ts');
const factory = read('packages/core/src/compiler/scanner/resolvers/boundary/boundaryContractFactory.ts');
const capability = read('packages/core/src/compiler/scanner/resolvers/boundary/capabilityResolution.ts');
const basics = read('packages/core/src/compiler/scanner/resolvers/boundary/boundaryBasicsTypes.ts');
const resolverPath = 'packages/core/src/compiler/scanner/resolvers/boundary/bindingResolution.ts';
const legacy = [
  'packages/core/src/types/semantic/parsedAstAlgebra.ts',
  'packages/core/src/types/semantic/parsedAstTypes.ts',
  'packages/core/src/types/semantic/__archive__/parsedAstAlgebra.ts',
  'packages/core/src/types/semantic/__archive__/parsedAstTypes.ts',
  'packages/core/src/types/domain/semanticResolutionLegacyAdapter.ts',
];
const checks = {
  resolvedBindingIsDomainAdt: /interface ResolvedRouteBinding\s*{[\s\S]*readonly operation: RouteOperationBinding;[\s\S]*readonly request: RouteRequestBinding;/.test(binding),
  boundaryOwnsResolvedBinding: /readonly binding: ResolvedRouteBinding;/.test(basics),
  boundaryReusesCanonicalBinding: /const binding = params\.binding;/.test(input),
  capabilityConsumesCanonicalRequest: /resolveRouteCapability\(params, basics, basics\.resolvedParameters\.length, binding\.request\)/.test(input),
  factoryConsumesCanonicalRequest: /resolveRouteCapability\(resolved, basics, identity\.parameters\.all\.length, resolved\.binding\.request\)/.test(factory),
  capabilityNoFreeRequestField: !/params\.request\b/.test(capability),
  builderConsumesCanonicalOperation: /operation:\s*resolved\.operation/.test(builder),
  builderConsumesCanonicalRequest: /const request = resolved\.request/.test(builder),
  legacyResolutionFileEmpty: exists(resolverPath) && fs.statSync(path.join(root, resolverPath)).size === 0,
  parsedDescriptorReservoirsEmpty: legacy.every(p => fs.statSync(path.join(root, p)).size === 0),
};
for (const [name, value] of Object.entries(checks)) console.log(`${name}=${value}`);
const failed = Object.entries(checks).filter(([, v]) => !v);
if (failed.length) process.exitCode = 1;
