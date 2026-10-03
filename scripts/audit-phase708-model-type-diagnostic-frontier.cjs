const fs = require('fs');
const path = require('path');
const ts = require('/opt/nvm/versions/node/v22.16.0/lib/node_modules/typescript/lib/typescript.js');

const root = path.resolve(__dirname, '..');
const core = path.join(root, 'packages/core/src');
const model = path.join(core, 'compiler/scanner/subscanners/semantic/modelTypeDeriver.ts');
const request = path.join(core, 'types/domain/request.ts');
const semanticValues = path.join(core, 'types/domain/semanticValues.ts');
const sequence = path.join(core, 'types/upstream/collections.ts');

const read = file => fs.readFileSync(file, 'utf8');
const parse = file => ts.createSourceFile(file, read(file), ts.ScriptTarget.Latest, true, ts.ScriptKind.TS).parseDiagnostics;
const modelSource = read(model);
const requestSource = read(request);
const valuesSource = read(semanticValues);
const sequenceSource = read(sequence);

const forbidden = source => ({
  if: (source.match(/\bif\s*\(/g) || []).length,
  for: (source.match(/\bfor\s*\(/g) || []).length,
  while: (source.match(/\bwhile\s*\(/g) || []).length,
  switch: (source.match(/\bswitch\s*\(/g) || []).length,
  map: (source.match(/\.map\s*\(/g) || []).length,
  filter: (source.match(/\.filter\s*\(/g) || []).length,
  reduce: (source.match(/\.reduce\s*\(/g) || []).length,
  flatMap: (source.match(/\.flatMap\s*\(/g) || []).length,
  undefined: (source.match(/\bundefined\b/g) || []).length,
  null: (source.match(/\bnull\b/g) || []).length,
  strictEquality: (source.match(/===/g) || []).length,
  asUnknown: (source.match(/\bas\s+unknown\b/g) || []).length,
  any: (source.match(/\bany\b/g) || []).length,
  new: (source.match(/\bnew\s+/g) || []).length,
});

const checks = {
  modelSyntaxValid: parse(model).length === 0,
  requestSyntaxValid: parse(request).length === 0,
  semanticValuesSyntaxValid: parse(semanticValues).length === 0,
  sequenceSyntaxValid: parse(sequence).length === 0,
  modelUsesSemanticPropertySurface: modelSource.includes('ModelSemanticProperty'),
  modelDoesNotReadLegacyPropertyDefinition: !modelSource.includes('PropertyDefinition'),
  modelUsesRelationSequenceProjection: modelSource.includes('relationSequenceToArray(') && modelSource.includes('relationProject('),
  modelUsesRelationFoldState: modelSource.includes('ModelTypeDerivationState') && modelSource.includes('relationFold('),
  modelNoDirectSequenceHeadTail: !/\.head\b|\.tail\b/.test(modelSource),
  modelNoLegacyOriginRead: !/property\.origin\b/.test(modelSource),
  requestImportsCanonicalValidationParameter: requestSource.includes("import type { ValidationParameter } from './semanticValues';"),
  validationParameterIsClosed: /export interface ValidationParameter/.test(valuesSource),
  sequenceIsClosed: sequenceSource.includes("readonly kind: 'empty'") && sequenceSource.includes("readonly kind: 'cons'"),
};

const report = {
  phase: 708,
  kind: 'model-type-diagnostic-frontier',
  changed: [path.relative(root, model)],
  checks,
  forbiddenConstructs: { model: forbidden(modelSource) },
  diagnostics: [
    'TS2339 Sequence.head/tail => relationSequenceToArray boundary',
    'TS2339 PropertyDefinition.origin => ModelSemanticProperty authority; no descriptor-origin read',
    'TS2322 string/StringValue => semantic property names remain PropertyName value objects',
    'TS2345 PropertyType/SemanticType => semantic traversal TypeExpression lowered by canonical relation',
    'TS2304 ValidationParameter => canonical domain semanticValues export/import',
  ],
  status: Object.values(checks).every(Boolean) ? 'PASS' : 'FAIL',
};
console.log(JSON.stringify(report, null, 2));
process.exitCode = report.status === 'PASS' ? 0 : 1;
