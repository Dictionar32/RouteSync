const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const registry = path.join(root, 'packages/core/src/compiler/passes/mapper/resourceRegistry.ts');
const mappingIntent = path.join(root, 'packages/core/src/types/domain/mappingIntent.ts');
const naming = path.join(root, 'packages/core/src/utils/resource-naming.ts');

const read = file => fs.readFileSync(file, 'utf8');
const stripComments = source => source
  .replace(/\/\*[\s\S]*?\*\//g, '')
  .replace(/(^|\s)\/\/.*$/gm, '$1');

const registrySource = read(registry);
const registryCode = stripComments(registrySource);
const mappingSource = read(mappingIntent);
const namingSource = read(naming);
const mappingCode = stripComments(mappingSource);

const checks = {
  responseUsesVariantAuthority: registryCode.includes('relationVariantFold(\n                requestType.response'),
  mappingIntentUsesVariantAuthority: registryCode.includes('relationVariantFold(\n    intent,'),
  resourceIdentityIsCanonical: registryCode.includes('requestType.identity.resource'),
  childResourceIdentityIsTyped: registryCode.includes('register: (resourceName: ResourceName'),
  mappingGraphAcceptsCanonicalResourceName: mappingSource.includes('resourceName: ResourceName,\n  fields:'),
  responseNameHasSemanticProjection: namingSource.includes('toPascalResponseTypeName'),
  noLegacyResponseValueAccess: !registryCode.includes('requestType.response.value'),
  noLegacyMappingIntentFieldAccess: !registryCode.includes('intent.resourceName.value') && !registryCode.includes('intent.fields'),
  noHostControlFlowTokens: !/\b(?:if|while|for|switch)\s*\(/.test(registryCode),
  noForbiddenCollectionMethods: !/\.(?:map|filter|reduce|flatMap)\s*\(/.test(registryCode),
  noUnsafeTypeEscape: !/\bas\s+(?:unknown|any|const)\b/.test(registryCode),
  noLegacyResourceNameStringBoundary: !/registerResource\(\s*resourceName:\s*string/.test(mappingSource),
  mappingIntentHasNoHostCollectionMap: !/\.map\s*\(/.test(mappingCode),
  mappingIntentHasNoHostStrictEquality: !/===/.test(mappingCode),
};

const failed = Object.entries(checks).filter(([, value]) => !value).map(([key]) => key);
const result = { phase: 754, model: 'highest-resource-registry-semantic-authority', checks, failed, pass: failed.length === 0 };
console.log(JSON.stringify(result, null, 2));
process.exit(result.pass ? 0 : 1);
