const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const resolver = fs.readFileSync(path.join(root, 'packages/core/src/compiler/scanner/resolvers/RouteSecurityResolver.ts'), 'utf8');
const values = fs.readFileSync(path.join(root, 'packages/core/src/types/upstream/valueObjects.ts'), 'utf8');

const checks = {
  numberValueConstructorExists: /export const numberValue\s*=/.test(values),
  resolverUsesNumberValue: /const maxAttempts = numberValue\(/.test(resolver) && /const decayMinutes = numberValue\(/.test(resolver),
  fixedRateLimitUsesTypedNumbers: /kind: 'fixed' as const, limit: Object\.freeze\(\{ kind: 'fixed' as const, maxAttempts, decayMinutes \}\)/.test(resolver),
  noRawRateLimitNumberFields: !/maxAttempts:\s*relationTextNumber|decayMinutes:\s*relationTextNumber/.test(resolver),
  noLegacyResourceNameInRequestDescriptor: !fs.readFileSync(path.join(root, 'packages/core/src/compiler/scanner/descriptors/requestDescriptors.ts'), 'utf8').includes('resourceName:'),
};

const forbidden = {
  if: 0, for: 0, while: 0, switch: 0, map: 0, filter: 0, reduce: 0, flatMap: 0,
  undefined: 0, null: 0, strictEquality: 0, asUnknown: 0, any: 0, new: 0,
};

for (const file of [resolver]) {
  forbidden.if += (file.match(/\bif\b/g) || []).length;
  forbidden.for += (file.match(/\bfor\b/g) || []).length;
  forbidden.while += (file.match(/\bwhile\b/g) || []).length;
  forbidden.switch += (file.match(/\bswitch\b/g) || []).length;
  forbidden.map += (file.match(/\.map\s*\(/g) || []).length;
  forbidden.filter += (file.match(/\.filter\s*\(/g) || []).length;
  forbidden.reduce += (file.match(/\.reduce\s*\(/g) || []).length;
  forbidden.flatMap += (file.match(/\.flatMap\s*\(/g) || []).length;
  forbidden.undefined += (file.match(/\bundefined\b/g) || []).length;
  forbidden.null += (file.match(/\bnull\b/g) || []).length;
  forbidden.strictEquality += (file.match(/===/g) || []).length;
  forbidden.asUnknown += (file.match(/as\s+unknown/g) || []).length;
  forbidden.any += (file.match(/\bany\b/g) || []).length;
  forbidden.new += (file.match(/\bnew\s+/g) || []).length;
}

const status = Object.values(checks).every(Boolean) ? 'PASS' : 'FAIL';
console.log(JSON.stringify({ phase: 711, kind: 'route-security-number-adt-frontier', checks, forbiddenConstructs: { resolver: forbidden }, status }, null, 2));
process.exitCode = status === 'PASS' ? 0 : 1;
