const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const root = path.resolve(__dirname, '../..');
const read = relative => fs.readFileSync(path.join(root, relative), 'utf8');
const iface = read('packages/core/src/types/upstream/laravelControllerResponseSemanticJudgmentInterface.ts');
const pipeline = read('packages/core/src/types/upstream/laravelControllerResponseSemanticPipeline.ts');
const responseScanner = read('packages/core/src/compiler/scanner/operations/responseScanner.ts');
const sourcePipeline = read('packages/core/src/compiler/scanner/wiring/laravelSourceAstPipeline.ts');
const docs = read('packages/core/src/types/upstream/docs/PHASE2010_PAGINATION_METADATA_PROFILE_INTERFACE_FIRST.md');
const checks = [
  ['metadata profile is a typed contract owned under existing envelope authority', () => {
    assert.match(iface, /interface LaravelControllerPaginationMetadataProfileInterface/);
    assert.match(iface, /interface LaravelControllerResponsePaginationEnvelopeJudgmentInterface[\s\S]*?metadataProfile: LaravelControllerPaginationMetadataProfileInterface/);
    assert.match(pipeline, /const paginationMetadataProfile: LaravelControllerPaginationMetadataProfileInterface/);
  }],
  ['metadata profile receives canonical PaginationKind and method source provenance', () => {
    assert.match(iface, /interface LaravelControllerPaginationMetadataProfileInput[\s\S]*?pagination: import\('\.\/response'\)\.PaginationKind[\s\S]*?source: SourceSpan/);
  }],
  ['proven profile retains pagination, links, meta, source and framework contract identity', () => {
    assert.match(iface, /controller_pagination_metadata_profile_proven[\s\S]*?links: TypeExpression[\s\S]*?meta: TypeExpression[\s\S]*?source: SourceSpan[\s\S]*?frameworkContract: 'laravel-paginated-resource-response-default-metadata-v1'/);
  }],
  ['metadata profile contract explicitly distinguishes shape from runtime values', () => {
    assert.match(iface, /metadata-fields-are-derived-from-the-canonical-pagination-ADT-under-the-framework-default-contract-not-from-inferred-runtime-values/);
    assert.match(pipeline, /frameworkContract: 'laravel-paginated-resource-response-default-metadata-v1'/);
  }],
  ['paginate metadata profile retains total and last_page fields', () => {
    assert.match(pipeline, /case 'paginate':[\s\S]*?name: 'last_page'[\s\S]*?name: 'total'/);
  }],
  ['simple pagination profile omits total and last_page', () => {
    const simple = pipeline.match(/case 'simple_paginate':[\s\S]*?frameworkContract: 'laravel-paginated-resource-response-default-metadata-v1'/)?.[0] ?? '';
    assert.match(simple, /name: 'current_page'/);
    assert.doesNotMatch(simple, /name: 'last_page'|name: 'total'/);
  }],
  ['cursor pagination profile retains cursor-specific fields', () => {
    const cursor = pipeline.match(/case 'cursor_paginate':[\s\S]*?frameworkContract: 'laravel-paginated-resource-response-default-metadata-v1'/)?.[0] ?? '';
    assert.match(cursor, /name: 'next_cursor'/);
    assert.match(cursor, /name: 'prev_cursor'/);
    assert.doesNotMatch(cursor, /name: 'total'|name: 'last_page'/);
  }],
  ['envelope judgment delegates metadata construction to the interface', () => {
    assert.match(pipeline, /paginationMetadataProfile\.project\(Object\.freeze\(\{ kind: 'laravel_controller_pagination_metadata_profile_input'/);
    assert.match(pipeline, /metadataProfile\s*\}\)/);
    assert.doesNotMatch(pipeline, /function paginationLinksType\(|function paginationMetaType\(/);
  }],
  ['envelope proven judgment retains the exact metadata profile', () => {
    assert.match(iface, /controller_response_pagination_envelope_proven[\s\S]*?metadataProfile: Extract<LaravelControllerPaginationMetadataProfileJudgment/);
    assert.match(pipeline, /metadataProfile\s*\}\)/);
  }],
  ['resource customization must be ruled out before profile projection', () => {
    assert.match(pipeline, /lookupResourceDefinition[\s\S]*?resourceDefinitionHasClosedShape[\s\S]*?paginationMetadataProfile\.project/);
    assert.match(pipeline, /definition\.framework\.paginationInformation\.kind/);
    assert.match(pipeline, /definition\.framework\.collection\.paginationInformation\.kind/);
  }],
  ['method source span is retained on every metadata field', () => {
    assert.match(pipeline, /kind: 'type_property', name: createPropertyName\(specification\.name\), type: specification\.type, source/);
    assert.match(pipeline, /source,\s*frameworkContract: 'laravel-paginated-resource-response-default-metadata-v1'/);
  }],
  ['output type and envelope contract versions are advanced', () => {
    assert.match(iface, /interface LaravelControllerResponseOutputTypeJudgmentContract[\s\S]*?contractVersion: 4/);
    assert.match(pipeline, /kind: 'laravel_controller_response_output_type_judgment_contract',[\s\S]*?contractVersion: 4/);
    assert.match(iface, /interface LaravelControllerResponsePaginationEnvelopeContract[\s\S]*?contractVersion: 2/);
    assert.match(pipeline, /kind: 'laravel_controller_response_pagination_envelope_contract',[\s\S]*?contractVersion: 2/);
  }],
  ['pipeline contract version 13 owns metadata profile and provenance rule', () => {
    assert.match(iface, /interface LaravelControllerResponseSemanticPipelineInterface \{[\s\S]*?contractVersion: 13/);
    assert.match(iface, /interface LaravelControllerResponseSemanticPipelineContract \{[\s\S]*?contractVersion: 13[\s\S]*?paginationMetadataProfileOwner/);
    assert.match(pipeline, /kind: 'laravel_controller_response_semantic_pipeline_contract',[\s\S]*?contractVersion: 13[\s\S]*?paginationMetadataProfileOwner/);
    assert.match(pipeline, /kind: 'laravel_controller_response_semantic_pipeline',[\s\S]*?contractVersion: 13/);
  }],
  ['existing response AST path still consumes canonical method products', () => {
    assert.match(responseScanner, /controller_response_method_products_complete/);
    assert.doesNotMatch(responseScanner, /controllerReturnSemanticFromMethod/);
    assert.ok(sourcePipeline.indexOf('const resourceScan = await laravelResourceScanner.scan') < sourcePipeline.indexOf('const responseBundle = await scanResponseBundle'));
  }],
  ['no relation/foundation subscanner was added', () => {
    assert.doesNotMatch(responseScanner, /operations\/(relation|foundation)/);
    assert.match(docs, /No `relation` or `foundation` subscanner was added/);
  }],
  ['documentation does not claim full typecheck or build success', () => {
    assert.match(docs, /Full build\/typecheck is not claimed to pass/);
  }],
];
const results = checks.map(([name, check]) => {
  try { check(); return { name, passed: true }; }
  catch (error) { return { name, passed: false, error: String(error.message || error) }; }
});
const report = { phase: 2010, audit: 'pagination-metadata-profile-interface-first', passed: results.filter(result => result.passed).length, total: results.length, checks: results };
fs.writeFileSync(path.join(root, 'PHASE2010_AUDIT.json'), `${JSON.stringify(report, null, 2)}\n`);
console.log(`${report.passed}/${report.total} checks passed`);
for (const result of results) console.log(`${result.passed ? 'PASS' : 'FAIL'} ${result.name}${result.error ? `: ${result.error}` : ''}`);
if (report.passed !== report.total) process.exitCode = 1;
