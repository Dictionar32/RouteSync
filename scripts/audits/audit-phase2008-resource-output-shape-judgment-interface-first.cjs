const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const root = path.resolve(__dirname, '../..');
const read = relative => fs.readFileSync(path.join(root, relative), 'utf8');
const iface = read('packages/core/src/types/upstream/laravelControllerResponseSemanticJudgmentInterface.ts');
const pipeline = read('packages/core/src/types/upstream/laravelControllerResponseSemanticPipeline.ts');
const responseScanner = read('packages/core/src/compiler/scanner/subscanners/responseScanner.ts');
const sourcePipeline = read('packages/core/src/compiler/scanner/wiring/laravelSourceAstPipeline.ts');
const docs = read('packages/core/src/types/upstream/docs/PHASE2008_RESOURCE_OUTPUT_SHAPE_JUDGMENT_INTERFACE_FIRST.md');
const checks = [
  ['output judgment receives canonical result plus resolved resource definitions', () => {
    assert.match(iface, /interface LaravelControllerResponseOutputTypeInput[\s\S]*?result: ResponseResult[\s\S]*?resourceDefinitions: readonly ResourceDefinition\[\]/);
    assert.match(iface, /judge: \(input: LaravelControllerResponseOutputTypeInput\)/);
  }],
  ['AST projection receives typed resource definitions before projection', () => {
    assert.match(iface, /interface LaravelControllerMethodResponseAstProjectionInput[\s\S]*?product: LaravelControllerMethodResponseProduct[\s\S]*?resourceDefinitions: readonly ResourceDefinition\[\]/);
    assert.match(responseScanner, /methodResponseAstProjection\.project\(Object\.freeze\(\{ kind: 'laravel_controller_method_response_ast_projection_input', product, resourceDefinitions \}\)\)/);
  }],
  ['existing pipeline and contract are version 11', () => {
    assert.match(iface, /interface LaravelControllerResponseSemanticPipelineInterface \{[\s\S]*?contractVersion: 11/);
    assert.match(iface, /interface LaravelControllerResponseSemanticPipelineContract \{[\s\S]*?contractVersion: 11/);
    assert.match(pipeline, /kind: 'laravel_controller_response_semantic_pipeline_contract',[\s\S]*?contractVersion: 11/);
    assert.match(pipeline, /kind: 'laravel_controller_response_semantic_pipeline',[\s\S]*?contractVersion: 11/);
  }],
  ['resource definitions are matched uniquely instead of inferred from model names', () => {
    assert.match(pipeline, /function lookupResourceDefinition/);
    assert.match(pipeline, /kind: 'multiple_matches'/);
    assert.match(pipeline, /resource-schema-is-not-closed/);
  }],
  ['resource output requires no dynamic entries or custom response extensions', () => {
    assert.match(pipeline, /function resourceDefinitionHasClosedShape/);
    assert.match(pipeline, /definition\.contract\.dynamicEntries\.items\.kind/);
    assert.match(pipeline, /response_customization_absent/);
    assert.match(pipeline, /with_absent/);
    assert.match(pipeline, /with_response_absent/);
  }],
  ['resource fields preserve typed shape, source span, and presence', () => {
    assert.match(pipeline, /function projectResourceFieldSequence/);
    assert.match(pipeline, /kind: 'type_property', name: fields\.head\.name, type: fieldType\.output, source: fields\.head\.source/);
    assert.match(pipeline, /function nullableOutputType/);
    assert.match(pipeline, /function optionalOutputType/);
  }],
  ['resource collection cardinality produces an array of the proven resource object', () => {
    assert.match(pipeline, /result\.cardinality\.kind/);
    assert.match(pipeline, /kind: 'array', element: resource\.output/);
  }],
  ['mixed and error field types are not promoted to proven output types', () => {
    assert.match(pipeline, /case 'mixed':[\s\S]*?case 'error':[\s\S]*?return false/);
    assert.match(pipeline, /isClosedTypeExpression\(field\.type\)/);
  }],
  ['paginated response output remains unresolved with a dedicated reason', () => {
    assert.match(iface, /pagination-envelope-is-not-closed/);
    assert.match(pipeline, /case 'paginated':[\s\S]*?return Object\.freeze\(\{ kind: 'unresolved' \}\)/);
    assert.match(pipeline, /return 'pagination-envelope-is-not-closed'/);
  }],
  ['resource scan runs before response projection and passes resolved definitions', () => {
    assert.ok(sourcePipeline.indexOf('const resourceScan = await laravelResourceScanner.scan') < sourcePipeline.indexOf('const responseBundle = await scanResponseBundle'));
    assert.match(sourcePipeline, /scanResponseBundle\(sourceProject, controllerScan, resourceDefinitions\)/);
  }],
  ['response scanner continues to consume canonical method response products', () => {
    assert.match(responseScanner, /controller_response_method_products_complete/);
    assert.doesNotMatch(responseScanner, /controllerReturnSemanticFromMethod/);
  }],
  ['no new relation/foundation subscanner is introduced', () => {
    assert.doesNotMatch(responseScanner, /subscanners\/(relation|foundation)/);
    assert.match(docs, /No `relation` or `foundation` subscanner was added/);
  }],
  ['pagination limitation and no-build claim are explicit', () => {
    assert.match(docs, /Paginated resource output remains unresolved/);
    assert.match(docs, /Full project typecheck\/build is not claimed to pass/);
  }],
];
const results = checks.map(([name, check]) => {
  try { check(); return { name, passed: true }; }
  catch (error) { return { name, passed: false, error: String(error.message || error) }; }
});
const report = { phase: 2008, audit: 'resource-output-shape-judgment-interface-first', passed: results.filter(result => result.passed).length, total: results.length, checks: results };
fs.writeFileSync(path.join(root, 'PHASE2008_AUDIT.json'), `${JSON.stringify(report, null, 2)}\n`);
console.log(`${report.passed}/${report.total} checks passed`);
for (const result of results) console.log(`${result.passed ? 'PASS' : 'FAIL'} ${result.name}${result.error ? `: ${result.error}` : ''}`);
if (report.passed !== report.total) process.exitCode = 1;
