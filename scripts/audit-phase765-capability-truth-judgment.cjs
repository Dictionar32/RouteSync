#!/usr/bin/env node
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const read = p => fs.readFileSync(path.join(root, p), 'utf8');
const result = {};

const basics = read('packages/core/src/compiler/scanner/resolvers/boundary/boundaryBasicsTypes.ts');
const input = read('packages/core/src/compiler/scanner/resolvers/boundary/boundaryInputResolution.ts');
const capability = read('packages/core/src/compiler/scanner/resolvers/boundary/capabilityResolution.ts');
const builder = read('packages/core/src/compiler/scanner/resolvers/boundary/capabilityBuilder.ts');
const factory = read('packages/core/src/compiler/scanner/resolvers/boundary/boundaryContractFactory.ts');
const security = read('packages/core/src/compiler/scanner/resolvers/RouteSecurityResolver.ts');
const valueObjects = read('packages/core/src/types/upstream/valueObjects.ts');

result.truthValueAuthority = /export interface TruthValue/.test(valueObjects) && /export const truthValue/.test(valueObjects);
result.resolvedAuthIsNominal = /readonly auth: import\('\.\.\/\.\.\/\.\.\/\.\.\/types\/upstream\/valueObjects'\)\.TruthValue;/.test(basics);
result.boundaryCanonicalizesAuth = /truthValue\(params\.auth\)/.test(input);
result.capabilityJudgmentConsumesTruth = /readonly auth: Presence<TruthValue>/.test(capability);
result.securityProducesTruth = /readonly auth: TruthValue/.test(security) && /truthValue\(relationAny/.test(security);
result.builderConsumesCanonicalAuth = /RouteSecurityResolver\.resolve\(middleware, params\.auth\)/.test(builder);
result.factoryDoesNotReresolveCapability = !/resolveRouteCapability\(/.test(factory);
result.capabilityBuilderUsesResolvedFields = /invalidation: params\.invalidation/.test(builder) && /errorResponses: params\.errorResponses/.test(builder);
result.legacyAdapterEmpty = fs.statSync(path.join(root, 'packages/core/src/types/domain/semanticResolutionLegacyAdapter.ts')).size === 0;

result.noRawBooleanAuthInSemanticContracts = !/readonly auth: boolean/.test(basics) && !/readonly auth: Presence<boolean>/.test(capability) && !/readonly auth: boolean/.test(security);
result.noDuplicateCapabilityResolution = !/resolveRouteCapability\(/.test(factory);

for (const [k,v] of Object.entries(result)) console.log(`${k}=${v}`);
const pass = Object.values(result).every(Boolean);
console.log(`ALL_PASS=${pass}`);
process.exit(pass ? 0 : 1);
