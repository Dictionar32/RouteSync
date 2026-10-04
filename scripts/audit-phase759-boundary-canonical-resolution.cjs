const fs = require('fs');
const path = require('path');
const root = path.resolve(__dirname, '..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
const factory = read('packages/core/src/compiler/scanner/resolvers/boundary/boundaryContractFactory.ts');
const basicsTypes = read('packages/core/src/compiler/scanner/resolvers/boundary/boundaryBasicsTypes.ts');
const input = read('packages/core/src/compiler/scanner/resolvers/boundary/boundaryInputResolution.ts');
const bindingBuilder = read('packages/core/src/compiler/scanner/resolvers/boundary/bindingBuilder.ts');
const capabilityBuilder = read('packages/core/src/compiler/scanner/resolvers/boundary/capabilityBuilder.ts');
const identityBuilder = read('packages/core/src/compiler/scanner/resolvers/boundary/identityBuilder.ts');
const provenanceBuilder = read('packages/core/src/compiler/scanner/resolvers/boundary/provenanceBuilder.ts');
const basics = read('packages/core/src/compiler/scanner/resolvers/boundary/boundaryBasics.ts');
const parsed = [
  'packages/core/src/types/semantic/parsedAstAlgebra.ts',
  'packages/core/src/types/semantic/parsedAstTypes.ts',
  'packages/core/src/types/semantic/__archive__/parsedAstAlgebra.ts',
  'packages/core/src/types/semantic/__archive__/parsedAstTypes.ts',
  'packages/core/src/types/domain/semanticResolutionLegacyAdapter.ts',
];
const forbidden = code => { const body = code.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|\s)\/\/.*$/gm, ''); return !/\b(if|for|while|switch)\b|\.map\(|\.filter\(|\.reduce\(|\.flatMap\(|\?\?|\bundefined\b|\bnull\b|===|\bas\s+(unknown|any|const)\b/.test(body); };
const checks = {
  factoryUsesRelationEquality: factory.includes('relationEqual'),
  factoryUsesResolvedAuthority: factory.includes('resolveRouteBoundaryInput(options)') && factory.includes('buildRouteIdentityContract(resolved') && factory.includes('buildRouteBindingContract(resolved') && factory.includes('buildRouteCapabilityContract(resolved') && factory.includes('buildRouteProvenanceContract(resolved)'),
  resolvedCarriesReturnJudgments: basicsTypes.includes('readonly runtimeReturn: ControllerRuntimeReturn;') && basicsTypes.includes('readonly semanticReturn: ControllerReturnSemantic;'),
  buildersConsumeResolvedModel: [bindingBuilder, capabilityBuilder, identityBuilder].every(code => code.includes('ResolvedRouteBoundaryOptions')),
  provenanceConsumesCoordinateProjection: provenanceBuilder.includes('RouteProvenanceInput') && provenanceBuilder.includes('sourceFile') && provenanceBuilder.includes('sourceLine') && provenanceBuilder.includes('path'),
  boundaryPresenceIsTyped: basics.includes('presenceOf<ControllerName>') && basics.includes('presenceOf<ActionName>') && basics.includes('presenceOf<RouteActionKind>'),
  parsedDescriptorVacuum: parsed.every(file => fs.statSync(path.join(root, file)).size === 0),
  modifiedAuthorityNoForbiddenHostForms: [factory, basicsTypes, input, bindingBuilder, capabilityBuilder, identityBuilder, provenanceBuilder].every(forbidden),
};
const failed = Object.entries(checks).filter(([, value]) => !value).map(([key]) => key);
const result = { phase: 759, model: 'boundary-canonical-resolution-and-upstream-judgment-interface', checks, failed, pass: failed.length === 0 };
console.log(JSON.stringify(result, null, 2));
process.exit(result.pass ? 0 : 1);
