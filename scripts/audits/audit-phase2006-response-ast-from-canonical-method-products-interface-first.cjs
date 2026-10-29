const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const root = path.resolve(__dirname, '../..');
const read = relative => fs.readFileSync(path.join(root, relative), 'utf8');
const iface = read('packages/core/src/types/upstream/laravelControllerResponseSemanticJudgmentInterface.ts');
const pipeline = read('packages/core/src/types/upstream/laravelControllerResponseSemanticPipeline.ts');
const responseScanner = read('packages/core/src/compiler/scanner/operations/responseScanner.ts');
const sourcePipeline = read('packages/core/src/compiler/scanner/wiring/laravelSourceAstPipeline.ts');
const docs = read('packages/core/src/types/upstream/docs/PHASE2006_RESPONSE_AST_FROM_CANONICAL_METHOD_PRODUCTS_INTERFACE.md');
const checks = [
  ['existing upstream pipeline exposes a typed ResponseAst projection interface and contract', () => {
    assert.match(iface, /interface LaravelControllerMethodResponseAstProjectionInterface/);
    assert.match(iface, /interface LaravelControllerMethodResponseAstProjectionContract/);
    assert.match(iface, /readonly methodResponseAstProjection: LaravelControllerMethodResponseAstProjectionInterface/);
  }],
  ['projection consumes canonical method response products, not PHP syntax', () => {
    assert.match(pipeline, /function projectMethodResponseAst\(product: LaravelControllerMethodResponseProduct\)/);
    assert.match(pipeline, /project: projectMethodResponseAst/);
    assert.match(iface, /noReclassificationRule: 'projection-does-not-read-PHP-syntax-or-call-the-legacy-controller-response-classifier'/);
  }],
  ['ResponseDefinition preserves the exact canonical ResponseResult', () => {
    assert.match(pipeline, /outcome: Object\.freeze\(\{ kind: 'success', result: product\.result \}\)/);
    assert.match(iface, /outcome\.success\.result-preserves-the-exact-canonical-ResponseResult/);
  }],
  ['ResponseDefinition retains the exact owning method source span', () => {
    assert.match(pipeline, /source: product\.method\.source/);
    assert.match(iface, /source-is-the-exact-source-span-of-the-method-owning-the-canonical-return-semantic/);
  }],
  ['response AST projection uses canonical action identity deterministically', () => {
    assert.match(pipeline, /createResponseTypeName\(`\$\{product\.method\.action\.action\.value\.value\}Response`\)/);
  }],
  ['output type uncertainty is explicit rather than misrepresented as proven', () => {
    assert.match(pipeline, /const outputTypeJudgment = responseOutputTypeJudgment\.judge\(product\.result\)/);
    assert.match(pipeline, /kind: 'controller_response_output_type_unresolved'/);
    assert.match(iface, /otherwise-mixed-is-retained-as-an-explicit-unresolved-fallback/);
  }],
  ['response scanner accepts the already-completed controller scan', () => {
    assert.match(responseScanner, /scanResponseBundle\(sourceProject: SourceProjectIdentity, controllerScan: LaravelControllerScanJudgment\)/);
    assert.match(sourcePipeline, /scanResponseBundle\(sourceProject, controllerScan\)/);
  }],
  ['production response scanner no longer reopens or reclassifies controller PHP files', () => {
    assert.doesNotMatch(responseScanner, /scanControllerFiles|controllerReturnSemanticFromMethod|kind: 'controller', method/);
    assert.match(responseScanner, /methodResponseAstProjection\.project\(product\)/);
  }],
  ['only complete method response products produce controller ResponseAst values', () => {
    assert.match(responseScanner, /case 'controller_response_method_products_complete'/);
    assert.match(responseScanner, /Unresolved, blocked, rejected, and return-semantic-only judgments do not fabricate ResponseAst values/);
  }],
  ['pipeline contract version is advanced consistently', () => {
    assert.match(iface, /interface LaravelControllerResponseSemanticPipelineInterface \{[\s\S]*?contractVersion: 10/);
    assert.match(iface, /interface LaravelControllerResponseSemanticPipelineContract \{[\s\S]*?contractVersion: 10/);
    assert.match(pipeline, /kind: 'laravel_controller_response_semantic_pipeline_contract',[\s\S]*?contractVersion: 10/);
    assert.match(pipeline, /kind: 'laravel_controller_response_semantic_pipeline',[\s\S]*?contractVersion: 10/);
  }],
  ['no relation/foundation subscanner was introduced', () => {
    assert.match(docs, /No `relation` or `foundation` subscanner was added/);
    assert.doesNotMatch(responseScanner, /operations\/(relation|foundation)/);
  }],
  ['documentation preserves the output-type and typecheck limitations', () => {
    assert.match(docs, /output` remains `mixed`/);
    assert.match(docs, /full build\/typecheck is not claimed as passing/);
  }],
];
const results = checks.map(([name, check]) => {
  try { check(); return { name, passed: true }; }
  catch (error) { return { name, passed: false, error: String(error.message || error) }; }
});
const report = { phase: 2006, audit: 'response-ast-from-canonical-method-products-interface-first', passed: results.filter(result => result.passed).length, total: results.length, checks: results };
fs.writeFileSync(path.join(root, 'PHASE2006_AUDIT.json'), `${JSON.stringify(report, null, 2)}\n`);
console.log(`${report.passed}/${report.total} checks passed`);
for (const result of results) console.log(`${result.passed ? 'PASS' : 'FAIL'} ${result.name}${result.error ? `: ${result.error}` : ''}`);
if (report.passed !== report.total) process.exitCode = 1;
