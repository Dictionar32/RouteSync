const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const root = path.resolve(__dirname, '../..');
const read = relative => fs.readFileSync(path.join(root, relative), 'utf8');
const iface = read('packages/core/src/types/upstream/laravelControllerResponseSemanticJudgmentInterface.ts');
const pipeline = read('packages/core/src/types/upstream/laravelControllerResponseSemanticPipeline.ts');
const responseScanner = read('packages/core/src/compiler/scanner/operations/responseScanner.ts');
const sourcePipeline = read('packages/core/src/compiler/scanner/wiring/laravelSourceAstPipeline.ts');
const docs = read('packages/core/src/types/upstream/docs/PHASE2009_PAGINATION_ENVELOPE_JUDGMENT_INTERFACE_FIRST.md');
const checks = [
  ['existing output-type authority owns the pagination sub-contract', () => {
    assert.match(iface, /interface LaravelControllerResponseOutputTypeJudgmentInterface[\s\S]*?paginationEnvelope: LaravelControllerResponsePaginationEnvelopeJudgmentInterface/);
    assert.match(pipeline, /const paginationEnvelopeJudgment: LaravelControllerResponsePaginationEnvelopeJudgmentInterface/);
  }],
  ['pagination input retains canonical response, resolved resources, and source provenance', () => {
    assert.match(iface, /interface LaravelControllerResponsePaginationEnvelopeInput[\s\S]*?result: ResponseResult[\s\S]*?resourceDefinitions: readonly ResourceDefinition\[\][\s\S]*?source: SourceSpan/);
  }],
  ['pagination judgment is a closed discriminated ADT', () => {
    assert.match(iface, /controller_response_pagination_envelope_proven/);
    assert.match(iface, /controller_response_pagination_envelope_unresolved/);
  }],
  ['pipeline contract is advanced to version 12', () => {
    assert.match(iface, /interface LaravelControllerResponseSemanticPipelineInterface \{[\s\S]*?contractVersion: 12/);
    assert.match(iface, /interface LaravelControllerResponseSemanticPipelineContract \{[\s\S]*?contractVersion: 12/);
    assert.match(pipeline, /kind: 'laravel_controller_response_semantic_pipeline_contract',[\s\S]*?contractVersion: 12/);
    assert.match(pipeline, /kind: 'laravel_controller_response_semantic_pipeline',[\s\S]*?contractVersion: 12/);
  }],
  ['output-type contract version 3 records the pagination envelope rule', () => {
    assert.match(iface, /interface LaravelControllerResponseOutputTypeJudgmentContract \{[\s\S]*?contractVersion: 3/);
    assert.match(pipeline, /kind: 'laravel_controller_response_output_type_judgment_contract',[\s\S]*?contractVersion: 3/);
    assert.match(iface, /pagination-output-is-a-closed-data-links-meta-object/);
  }],
  ['paginated ADT dispatches through the pagination envelope judgment', () => {
    assert.match(pipeline, /case 'paginated': \{[\s\S]*?paginationEnvelopeJudgment\.judge/);
  }],
  ['proven envelope contains typed data, links, and meta properties', () => {
    assert.match(pipeline, /name: 'data', type: Object\.freeze\(\{ kind: 'array', element: payload\.output \}\)/);
    assert.match(pipeline, /name: 'links'/);
    assert.match(pipeline, /name: 'meta'/);
  }],
  ['parent output-type judgment preserves pagination unresolved reasons', () => {
    assert.match(iface, /pagination-payload-output-type-unresolved/);
    assert.match(pipeline, /function judgeResponseOutputType\([\s\S]*?reason: envelope\.reason/);
  }],
  ['length-aware pagination has canonical page metadata fields', () => {
    assert.match(pipeline, /name: 'current_page'/);
    assert.match(pipeline, /name: 'last_page'/);
    assert.match(pipeline, /name: 'total'/);
  }],
  ['simple pagination and cursor pagination retain distinct metadata fields', () => {
    assert.match(pipeline, /case 'simple_paginate':[\s\S]*?name: 'current_page'/);
    assert.match(pipeline, /case 'cursor_paginate':[\s\S]*?name: 'next_cursor'/);
    assert.match(pipeline, /name: 'prev_cursor'/);
  }],
  ['resource pagination output requires a unique closed resource definition', () => {
    assert.match(pipeline, /lookupResourceDefinition\(input\.result\.body\.shape\.payload\.resource, input\.resourceDefinitions\)/);
    assert.match(pipeline, /resource-pagination-output-shape-not-closed/);
  }],
  ['resource and collection pagination customizations block envelope proof', () => {
    assert.match(pipeline, /definition\.framework\.paginationInformation\.kind/);
    assert.match(pipeline, /definition\.framework\.collection\.paginationInformation\.kind/);
    assert.match(pipeline, /with_response_absent/);
  }],
  ['framework envelope fields retain method source provenance', () => {
    assert.match(pipeline, /kind: 'type_property', name: createPropertyName\(specification\.name\), type: specification\.type, source/);
    assert.match(pipeline, /source: product\.method\.source/);
  }],
  ['AST projection consumes the typed output judgment without controller reclassification', () => {
    assert.match(pipeline, /responseOutputTypeJudgment\.judge\(Object\.freeze\(\{ kind: 'laravel_controller_response_output_type_input'[\s\S]*?source: product\.method\.source/);
    assert.match(responseScanner, /controller_response_method_products_complete/);
    assert.doesNotMatch(responseScanner, /controllerReturnSemanticFromMethod/);
  }],
  ['resolved resources are passed before response projection', () => {
    assert.ok(sourcePipeline.indexOf('const resourceScan = await laravelResourceScanner.scan') < sourcePipeline.indexOf('const responseBundle = await scanResponseBundle'));
    assert.match(sourcePipeline, /scanResponseBundle\(sourceProject, controllerScan, resourceDefinitions\)/);
  }],
  ['no relation/foundation subscanner is introduced', () => {
    assert.doesNotMatch(responseScanner, /operations\/(relation|foundation)/);
    assert.match(docs, /No `relation` or `foundation` subscanner was added/);
  }],
  ['verification documentation does not claim full build/typecheck', () => {
    assert.match(docs, /full project typecheck and build are not claimed to pass/i);
  }],
];
const results = checks.map(([name, check]) => {
  try { check(); return { name, passed: true }; }
  catch (error) { return { name, passed: false, error: String(error.message || error) }; }
});
const report = { phase: 2009, audit: 'pagination-envelope-judgment-interface-first', passed: results.filter(result => result.passed).length, total: results.length, checks: results };
fs.writeFileSync(path.join(root, 'PHASE2009_AUDIT.json'), `${JSON.stringify(report, null, 2)}\n`);
console.log(`${report.passed}/${report.total} checks passed`);
for (const result of results) console.log(`${result.passed ? 'PASS' : 'FAIL'} ${result.name}${result.error ? `: ${result.error}` : ''}`);
if (report.passed !== report.total) process.exitCode = 1;
