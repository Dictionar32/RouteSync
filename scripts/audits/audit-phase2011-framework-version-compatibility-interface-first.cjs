const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const root = path.resolve(__dirname, '../..');
const read = relative => fs.readFileSync(path.join(root, relative), 'utf8');
const iface = read('packages/core/src/types/upstream/laravelControllerResponseSemanticJudgmentInterface.ts');
const pipeline = read('packages/core/src/types/upstream/laravelControllerResponseSemanticPipeline.ts');
const scanner = read('packages/core/src/compiler/scanner/operations/responseScanner.ts');
const docs = read('packages/core/src/types/upstream/docs/PHASE2011_FRAMEWORK_VERSION_COMPATIBILITY_INTERFACE_FIRST.md');
const checks = [
  ['framework version compatibility is an explicit closed ADT', () => {
    assert.match(iface, /export type LaravelFrameworkVersionCompatibility =\s*\| Readonly<\{[\s\S]*?laravel_framework_version_contract_proven[\s\S]*?\| Readonly<\{[\s\S]*?laravel_framework_version_contract_unresolved/);
  }],
  ['proof requires exact composer.lock package version and source file provenance', () => {
    assert.match(scanner, /path\.join\(sourceProject\.root\.value\.value, 'composer\.lock'\)/);
    assert.match(scanner, /entry\.name === 'laravel\/framework'/);
    assert.match(scanner, /sourceFile: createSourceFile\(lockFile\)/);
    assert.match(scanner, /function laravelFrameworkVersionLockEvidence/);
  }],
  ['composer lock absence and invalidity remain unresolved evidence', () => {
    assert.match(scanner, /laravel_framework_lock_unavailable/);
    assert.match(scanner, /laravel_framework_lock_invalid/);
  }],
  ['missing or unrecognized framework package remains unresolved', () => {
    assert.match(scanner, /laravel_framework_package_not_locked/);
    assert.match(pipeline, /laravel-framework-version-unrecognized/);
  }],
  ['only verified Laravel 12 major is admitted', () => {
    assert.match(pipeline, /\^v\?\(\\d\+\)\\\.\(\\d\+\)\\\.\(\\d\+\)\$/);
    assert.match(pipeline, /case '12'/);
    assert.match(iface, /major: '12'/);
    assert.match(iface, /frameworkVersionRule: 'profile-is-proven-only-after-LaravelControllerPaginationMetadataProfileInterface\.frameworkVersionCompatibility-judges-lock-evidence-as-verified-Laravel-12\.x'/);
  }],
  ['metadata profile consumes compatibility evidence before proving metadata', () => {
    assert.match(iface, /interface LaravelControllerPaginationMetadataProfileInput[\s\S]*?frameworkVersion: LaravelFrameworkVersionCompatibility/);
    assert.match(pipeline, /case 'laravel_framework_version_contract_unresolved':[\s\S]*?framework-version-not-proven-compatible/);
  }],
  ['proven metadata profile retains the exact framework version evidence', () => {
    assert.match(iface, /controller_pagination_metadata_profile_proven[\s\S]*?frameworkVersion: Extract<LaravelFrameworkVersionCompatibility/);
    assert.match(pipeline, /frameworkVersion: input\.frameworkVersion/);
  }],
  ['compatibility judgment propagates through envelope and output type inputs', () => {
    assert.match(iface, /interface LaravelControllerResponsePaginationEnvelopeInput[\s\S]*?frameworkVersion: LaravelFrameworkVersionCompatibility/);
    assert.match(iface, /interface LaravelControllerResponseOutputTypeInput[\s\S]*?frameworkVersion: LaravelFrameworkVersionCompatibility/);
    assert.match(pipeline, /source, frameworkVersion: input\.frameworkVersion/);
  }],
  ['existing AST projection passes compatibility evidence into output judgment', () => {
    assert.match(iface, /interface LaravelControllerMethodResponseAstProjectionInput[\s\S]*?frameworkVersion: LaravelFrameworkVersionCompatibility/);
    assert.match(scanner, /methodResponseAstProjection\.project\(Object\.freeze\(\{ kind: 'laravel_controller_method_response_ast_projection_input', product, resourceDefinitions, frameworkVersion \}\)\)/);
  }],
  ['pipeline contract records framework-version evidence ownership and compatibility rule', () => {
    assert.match(iface, /interface LaravelControllerResponseSemanticPipelineInterface \{[\s\S]*?contractVersion: 17/);
    assert.match(pipeline, /frameworkVersionEvidenceOwner: 'composer\.lock laravel\/framework package entry'/);
    assert.match(pipeline, /frameworkVersionCompatibilityRule: 'scanner-acquires-composer-lock-facts-only;the-existing-pagination-metadata-profile-interface-judges-version-compatibility-and-only-verified-Laravel-12\.x-is-admitted'/);
  }],
  ['existing canonical response product flow remains; no new semantic authority', () => {
    assert.match(scanner, /controller_response_method_products_complete/);
    assert.doesNotMatch(scanner, /controllerReturnSemanticFromMethod/);
    assert.doesNotMatch(scanner, /operations\/(relation|foundation)/);
  }],
  ['documentation records conservative behavior and no full build claim', () => {
    assert.match(docs, /Other major versions remain unresolved/);
    assert.match(docs, /Full project typecheck\/build is not claimed to pass/);
  }],
];
const results = checks.map(([name, check]) => {
  try { check(); return { name, passed: true }; }
  catch (error) { return { name, passed: false, error: String(error.message || error) }; }
});
const report = { phase: 2011, audit: 'framework-version-compatibility-interface-first', passed: results.filter(result => result.passed).length, total: results.length, checks: results };
fs.writeFileSync(path.join(root, 'PHASE2011_AUDIT.json'), `${JSON.stringify(report, null, 2)}\n`);
console.log(`${report.passed}/${report.total} checks passed`);
for (const result of results) console.log(`${result.passed ? 'PASS' : 'FAIL'} ${result.name}${result.error ? `: ${result.error}` : ''}`);
if (report.passed !== report.total) process.exitCode = 1;
