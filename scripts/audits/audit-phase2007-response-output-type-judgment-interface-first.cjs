const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const root = path.resolve(__dirname, '../..');
const read = relative => fs.readFileSync(path.join(root, relative), 'utf8');
const iface = read('packages/core/src/types/upstream/laravelControllerResponseSemanticJudgmentInterface.ts');
const pipeline = read('packages/core/src/types/upstream/laravelControllerResponseSemanticPipeline.ts');
const responseScanner = read('packages/core/src/compiler/scanner/subscanners/responseScanner.ts');
const docs = read('packages/core/src/types/upstream/docs/PHASE2007_RESPONSE_OUTPUT_TYPE_JUDGMENT_INTERFACE_FIRST.md');
const checks = [
  ['output-type judgment is a discriminated closed ADT', () => {
    assert.match(iface, /kind: 'controller_response_output_type_proven'/);
    assert.match(iface, /kind: 'controller_response_output_type_unresolved'/);
  }],
  ['output-type contract is owned by the canonical ResponseResult ADT', () => {
    assert.match(iface, /interface LaravelControllerResponseOutputTypeJudgmentContract/);
    assert.match(pipeline, /owner: 'canonical-ResponseResult-ADT'/);
  }],
  ['existing pipeline interface owns the output-type judgment', () => {
    assert.match(iface, /readonly responseOutputTypeJudgment: LaravelControllerResponseOutputTypeJudgmentInterface/);
    assert.match(pipeline, /responseOutputTypeJudgment,/);
  }],
  ['pipeline interface and contract versions advance together', () => {
    assert.match(iface, /interface LaravelControllerResponseSemanticPipelineInterface \{[\s\S]*?contractVersion: 10/);
    assert.match(iface, /interface LaravelControllerResponseSemanticPipelineContract \{[\s\S]*?contractVersion: 10/);
    assert.match(pipeline, /kind: 'laravel_controller_response_semantic_pipeline_contract',[\s\S]*?contractVersion: 10/);
    assert.match(pipeline, /kind: 'laravel_controller_response_semantic_pipeline',[\s\S]*?contractVersion: 10/);
  }],
  ['explicit TypeExpression from responsable and json_serializable is preserved', () => {
    assert.match(pipeline, /case 'responsable':\s*case 'json_serializable':\s*return Object\.freeze\(\{ kind: 'proven', output: result\.type \}\)/);
  }],
  ['explicit object and primitive JSON payload types are preserved', () => {
    assert.match(pipeline, /case 'object':\s*case 'primitive':\s*return Object\.freeze\(\{ kind: 'proven', output: payload\.type \}\)/);
  }],
  ['typed/scalar/domain-reference semantic values are mapped conservatively', () => {
    assert.match(pipeline, /case 'typed':\s*return Object\.freeze\(\{ kind: 'proven', output: value\.type \}\)/);
    assert.match(pipeline, /case 'scalar':\s*return Object\.freeze\(\{ kind: 'proven', output: Object\.freeze\(\{ kind: 'primitive', value: value\.primitive \}\) \}\)/);
    assert.match(pipeline, /kind: 'domain', name: value\.name/);
  }],
  ['collection JSON output becomes an array of the proven payload type', () => {
    assert.match(pipeline, /kind: 'array', element: payload\.output/);
  }],
  ['branch output union requires all branch types to be proven', () => {
    assert.match(pipeline, /projectResponseResultTypeSequence/);
    assert.match(pipeline, /kind: 'union', members/);
    assert.match(iface, /branch-output-type-is-proven-only-when-every-branch-has-a-proven-output-type/);
  }],
  ['unknown response forms remain unresolved instead of guessed', () => {
    assert.match(pipeline, /case 'redirect':\s*case 'no_content':\s*case 'resource':\s*return Object\.freeze\(\{ kind: 'unresolved' \}\)/);
    assert.match(iface, /unknown-payload-shapes-remain-unresolved/);
  }],
  ['AST projection consumes output judgment and only uses proven type', () => {
    assert.match(pipeline, /const outputTypeJudgment = responseOutputTypeJudgment\.judge\(product\.result\)/);
    assert.match(pipeline, /outputTypeJudgment\.kind === 'controller_response_output_type_proven'/);
    assert.match(pipeline, /outputTypeJudgment, definition, ast/);
  }],
  ['unresolved type fallback remains explicit in the judgment', () => {
    assert.match(pipeline, /kind: 'controller_response_output_type_unresolved', result, reason:/);
    assert.match(iface, /otherwise-mixed-is-retained-as-an-explicit-unresolved-fallback/);
  }],
  ['production response scanner remains wired to canonical method products', () => {
    assert.match(responseScanner, /methodResponseAstProjection\.project\(product\)/);
    assert.doesNotMatch(responseScanner, /controllerReturnSemanticFromMethod/);
  }],
  ['no relation/foundation subscanner was added', () => {
    assert.match(docs, /No `relation` or `foundation` subscanner was added/);
    assert.doesNotMatch(responseScanner, /subscanners\/(relation|foundation)/);
  }],
  ['documentation does not misstate audit as full typecheck/build', () => {
    assert.match(docs, /not a claim that the full project typecheck\/build passes/);
  }],
];
const results = checks.map(([name, check]) => {
  try { check(); return { name, passed: true }; }
  catch (error) { return { name, passed: false, error: String(error.message || error) }; }
});
const report = { phase: 2007, audit: 'response-output-type-judgment-interface-first', passed: results.filter(result => result.passed).length, total: results.length, checks: results };
fs.writeFileSync(path.join(root, 'PHASE2007_AUDIT.json'), `${JSON.stringify(report, null, 2)}\n`);
console.log(`${report.passed}/${report.total} checks passed`);
for (const result of results) console.log(`${result.passed ? 'PASS' : 'FAIL'} ${result.name}${result.error ? `: ${result.error}` : ''}`);
if (report.passed !== report.total) process.exitCode = 1;
