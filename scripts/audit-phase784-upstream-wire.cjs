const fs = require('fs');
const path = require('path');
const root = path.resolve(__dirname, '..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
const exists = file => fs.existsSync(path.join(root, file));

const expression = read('packages/core/src/types/upstream/expression.ts');
const highLevel = read('packages/core/src/types/upstream/highLevelSourceModel.ts');
const option = read('packages/core/src/types/upstream/collections.ts');
const astSemantic = read('packages/core/src/types/upstream/astSemanticInterface.ts');
const dataflow = read('packages/core/src/types/upstream/astDataflowInterface.ts');
const mapping = read('packages/core/src/types/upstream/astMappingInterface.ts');

const backupFiles = [
  'packages/core/src/types/upstream/ast.ts.bak-interface-property',
  'packages/core/src/types/upstream/property.ts.bak-interface-property',
  'packages/core/src/types/upstream/response.ts.before-interface-response',
];

const report = {
  phase: 784,
  model: 'wire existing upstream closed ADTs into semantic consumers; no parallel descriptor model',
  upstreamAuthorities: {
    optionADT: /export type Option<T> =/.test(option),
    astSemanticInterface: /export type AstSemanticInterface =/.test(astSemantic),
    astDataflowInterface: /export type AstDataflowInterface =/.test(dataflow),
    astMappingInterface: /export type AstMappingInterface =/.test(mapping),
  },
  expressionAbsence: {
    optionImported: /Sequence, Option/.test(expression),
    noFreeUndefined: !/\bundefined\b/.test(expression),
    optionalFieldsUseOption: [
      /alias: Option<Expression>/.test(expression),
      /column: Option<PropertyName>/.test(expression),
      /chunkSize: Option<Expression>/.test(expression),
      /count: Option<Expression>/.test(expression),
      /defaultCallback: Option<Expression>/.test(expression),
      /target: Option<QueryOrderingTarget>/.test(expression),
      /direction: Option<OrderDirection>/.test(expression),
      /constraint: Option<QueryJoinConstraint>/.test(expression),
    ].every(Boolean),
  },
  highLevelWire: {
    relationVariantFoldImported: /relationVariantFold/.test(highLevel),
    noExtractCasts: !/as Extract/.test(highLevel),
    requestTargetUsesFold: /input_collection:[\s\S]*relationVariantFold\(target, 'input_collection'/.test(highLevel),
    endpointRequestUsesFold: /form_request:[\s\S]*relationVariantFold\(request, 'form_request'/.test(highLevel),
    endpointResponseUsesFold: /declared_response:[\s\S]*relationVariantFold\(response, 'declared_response'/.test(highLevel),
    routeTargetUsesFold: /controller_action:[\s\S]*relationVariantFold\(target, 'controller_action'/.test(highLevel),
    sequenceUsesFold: /relationVariantFold\(items, 'cons'/.test(highLevel),
  },
  legacyVacuum: Object.fromEntries(backupFiles.map(file => [file, exists(file) ? fs.statSync(path.join(root, file)).size : 0])),
};

report.allPass = [
  ...Object.values(report.upstreamAuthorities),
  ...Object.values(report.expressionAbsence),
  ...Object.values(report.highLevelWire),
  ...Object.values(report.legacyVacuum).map(bytes => bytes === 0),
].every(Boolean);

fs.writeFileSync(path.join(root, 'docs/PHASE784_UPSTREAM_WIRE_AUDIT.json'), JSON.stringify(report, null, 2) + '\n');
console.log(JSON.stringify(report, null, 2));
process.exitCode = report.allPass ? 0 : 1;
