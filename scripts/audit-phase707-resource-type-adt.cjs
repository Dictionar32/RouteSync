const fs = require('fs');
const path = require('path');
const ts = require('/opt/nvm/versions/node/v22.16.0/lib/node_modules/typescript/lib/typescript.js');
const root = path.resolve(__dirname, '..');
const core = path.join(root, 'packages/core/src');
const resource = path.join(core, 'compiler/scanner/subscanners/semantic/resourceTypeDeriver.ts');
const lowering = path.join(core, 'compiler/domain/common/typeExpressionSemanticType.ts');
const responseReader = path.join(core, 'compiler/scanner/subscanners/controller/responseDtoReader.ts');

const read = file => fs.readFileSync(file, 'utf8');
const parse = file => ts.createSourceFile(file, read(file), ts.ScriptTarget.Latest, true, ts.ScriptKind.TS).parseDiagnostics;
const resourceSource = read(resource);
const loweringSource = read(lowering);
const responseReaderSource = read(responseReader);

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
  resourceSyntaxValid: parse(resource).length === 0,
  loweringSyntaxValid: parse(lowering).length === 0,
  responseReaderSyntaxValid: parse(responseReader).length === 0,
  resourceObjectVariantFold: resourceSource.includes("relationVariantFold(") && resourceSource.includes("'object'"),
  resourceSequenceRelation: resourceSource.includes('relationSequenceToArray'),
  resourcePropertyValueObject: resourceSource.includes('stringValue(name)'),
  resourceNoExtractCast: !/as\s+Extract</.test(resourceSource),
  loweringVariantDispatch: loweringSource.includes('relationVariantFold('),
  loweringNoExtractCast: !/as\s+Extract</.test(loweringSource),
  loweringNoUnknownCast: !/as\s+unknown/.test(loweringSource),
  responseReaderUsesCanonicalTypeExpression: responseReaderSource.includes("import type { TypeExpression }"),
  responseReaderNoParsedPropertyType: !responseReaderSource.includes('PhpPropertyTypeAst'),
  responseReaderUsesVariantFold: responseReaderSource.includes('relationVariantFold('),
  responseReaderNoExtractCast: !/as\s+Extract</.test(responseReaderSource),
};

const report = {
  phase: 707,
  kind: 'resource-type-adt-frontier',
  changed: [path.relative(root, resource), path.relative(root, lowering), path.relative(root, responseReader)],
  checks,
  forbiddenConstructs: {
    resource: forbidden(resourceSource),
    lowering: forbidden(loweringSource),
    responseReader: forbidden(responseReaderSource),
  },
  buildExpectation: {
    TS2339_properties: 'closed object variant is narrowed through relationVariantFold',
    TS18046_child: 'child is narrowed as TypeProperty through the object relation variant',
    TS2322_StringValue: 'property name is constructed through stringValue',
    TS2339_SequenceHeadTail: 'Sequence is consumed through relationSequenceToArray',
  },
  status: Object.values(checks).every(Boolean) ? 'PASS' : 'FAIL',
};
console.log(JSON.stringify(report, null, 2));
process.exitCode = report.status === 'PASS' ? 0 : 1;
