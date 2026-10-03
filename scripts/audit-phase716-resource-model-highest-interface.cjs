const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const files = {
  binding: 'packages/core/src/compiler/scanner/symbols/resource/resourceBindingTypes.ts',
  resolver: 'packages/core/src/compiler/scanner/resolvers/resource/ResourceModelResolver.ts',
  knowledge: 'packages/core/src/compiler/scanner/subscanners/resource/resourceModelKnowledgeDataFlow.ts',
  closure: 'packages/core/src/compiler/scanner/subscanners/resource/twoPassRelationResolver.ts',
};
const source = Object.fromEntries(Object.entries(files).map(([key, rel]) => [key, fs.readFileSync(path.join(root, rel), 'utf8')]));
const forbidden = {
  if: /\bif\s*\(/g,
  while: /\bwhile\s*\(/g,
  for: /\bfor\s*\(/g,
  switch: /\bswitch\s*\(/g,
  map: /\.map\s*\(/g,
  filter: /\.filter\s*\(/g,
  reduce: /\.reduce\s*\(/g,
  flatMap: /\.flatMap\s*\(/g,
  undefined: /\bundefined\b/g,
  null: /\bnull\b/g,
  '===': /===/g,
  'as unknown': /\bas\s+unknown\b/g,
  any: /\bany\b/g,
  new: /\bnew\s+/g,
};
const checks = {
  bindingSourceClosedAdt: /export type ResourceModelBindingSource\s*=/.test(source.binding) && !/ResourceModelBindingSource\s*=\s*\n?\s*\|\s*'/.test(source.binding),
  bindingReasonValueObject: /readonly reason: StringValue;/.test(source.binding),
  resolutionOriginClosedAdt: /export type ResourceModelResolutionOrigin\s*=/.test(source.knowledge) && !/ResourceModelResolutionOriginCode/.test(source.knowledge),
  resolverUsesCanonicalSource: /ResourceModelBindingSource\.controllerDataflow/.test(source.resolver) && /ResourceModelBindingSource\.relationPropagation/.test(source.resolver) && /ResourceModelBindingSource\.convention/.test(source.resolver) && /ResourceModelBindingSource\.structural/.test(source.resolver),
  resolverUsesValueObjectReason: /stringValue\(/.test(source.resolver),
  noLegacyResolutionOriginType: !/ResourceModelResolutionOriginCode/.test(source.knowledge),
  noOptionalControllerInput: /controllerDataflowMap:\s*Presence</.test(source.closure) && !/controllerDataflowMap\?\s*:/.test(source.closure),
  fixedPointBoundIsValueObject: /maxIterations:\s*NumberValue/.test(source.closure) && /maxIterations\.value/.test(source.closure),
  canonicalModelLookup: /findForControllerOrigin/.test(source.resolver),
};
const forbiddenCounts = Object.fromEntries(Object.entries(forbidden).map(([name, regex]) => [name, Object.values(source).reduce((sum, text) => sum + (text.match(regex) || []).length, 0)]));
const failed = Object.entries(checks).filter(([, ok]) => !ok).map(([name]) => name);
const forbiddenFailed = Object.entries(forbiddenCounts).filter(([, count]) => count !== 0).map(([name]) => `${name}:${forbiddenCounts[name]}`);
const result = { phase: 716, checks, forbiddenCounts, pass: failed.length === 0 && forbiddenFailed.length === 0, failed: [...failed, ...forbiddenFailed] };
console.log(JSON.stringify(result, null, 2));
process.exit(result.pass ? 0 : 1);
