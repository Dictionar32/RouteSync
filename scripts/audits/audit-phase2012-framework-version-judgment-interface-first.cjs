const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const root = path.resolve(__dirname, '../..');
const read = relative => fs.readFileSync(path.join(root, relative), 'utf8');
const iface = read('packages/core/src/types/upstream/laravelControllerResponseSemanticJudgmentInterface.ts');
const pipeline = read('packages/core/src/types/upstream/laravelControllerResponseSemanticPipeline.ts');
const scanner = read('packages/core/src/compiler/scanner/operations/responseScanner.ts');
const docs = read('packages/core/src/types/upstream/docs/PHASE2012_FRAMEWORK_VERSION_COMPATIBILITY_JUDGMENT_INTERFACE_FIRST.md');
const checks = [
  ['lock facts are a typed ADT distinct from compatibility judgment', () => {
    assert.match(iface, /export type LaravelFrameworkVersionLockEvidence =\s*\| Readonly<\{ readonly kind: 'laravel_framework_lock_unavailable'/);
    assert.match(iface, /laravel_framework_version_candidate[\s\S]*?version: StringValue[\s\S]*?sourceFile: SourceFile/);
  }],
  ['compatibility decision is owned by an explicit upstream interface', () => {
    assert.match(iface, /interface LaravelFrameworkVersionCompatibilityJudgmentInterface[\s\S]*?judge: \(input: LaravelFrameworkVersionCompatibilityJudgmentInput\) => LaravelFrameworkVersionCompatibility/);
    assert.match(iface, /interface LaravelControllerPaginationMetadataProfileInterface[\s\S]*?frameworkVersionCompatibility: LaravelFrameworkVersionCompatibilityJudgmentInterface/);
  }],
  ['framework compatibility remains subordinate to existing metadata profile', () => {
    assert.match(pipeline, /const paginationMetadataProfile: LaravelControllerPaginationMetadataProfileInterface = Object\.freeze\([\s\S]*?frameworkVersionCompatibility,/);
    assert.doesNotMatch(pipeline, /export const laravelFrameworkVersionCompatibilityAuthority/);
  }],
  ['scanner acquires composer lock evidence without classifying semver or major', () => {
    assert.match(scanner, /function laravelFrameworkVersionLockEvidence\(sourceProject: SourceProjectIdentity\): LaravelFrameworkVersionLockEvidence/);
    assert.doesNotMatch(scanner, /versionParts|major !== '12'|frameworkVersionCompatibility\(sourceProject/);
    assert.match(scanner, /paginationEnvelope\.metadataProfile\.frameworkVersionCompatibility\.judge/);
  }],
  ['missing, invalid, and absent package facts are retained as explicit evidence', () => {
    assert.match(scanner, /laravel_framework_lock_unavailable/);
    assert.match(scanner, /laravel_framework_lock_invalid/);
    assert.match(scanner, /laravel_framework_package_not_locked/);
  }],
  ['only stable semver major 12 is proven by upstream judgment', () => {
    assert.match(pipeline, /\^v\?\(\\d\+\)\\\.\(\\d\+\)\\\.\(\\d\+\)\$/);
    assert.match(pipeline, /case '12':[\s\S]*?laravel_framework_version_contract_proven/);
    assert.match(pipeline, /laravel-framework-version-outside-verified-contract/);
    assert.match(pipeline, /laravel-framework-version-unrecognized/);
  }],
  ['source version and composer lock provenance survive proven judgment', () => {
    assert.match(pipeline, /version: input\.evidence\.version/);
    assert.match(pipeline, /sourceFile: input\.evidence\.sourceFile/);
    assert.match(scanner, /sourceFile: createSourceFile\(lockFile\)/);
  }],
  ['pagination profile receives compatibility judgment before metadata proof', () => {
    assert.match(pipeline, /case 'laravel_framework_version_contract_unresolved':[\s\S]*?framework-version-not-proven-compatible/);
    assert.match(iface, /frameworkVersion: LaravelFrameworkVersionCompatibility/);
  }],
  ['existing canonical response pipeline contract is advanced consistently', () => {
    assert.match(iface, /interface LaravelControllerResponseSemanticPipelineInterface \{[\s\S]*?contractVersion: 17/);
    assert.match(pipeline, /const pipelineContract: LaravelControllerResponseSemanticPipelineContract = Object\.freeze\(\{[\s\S]*?contractVersion: 17/);
    assert.match(pipeline, /export const laravelControllerResponseSemanticPipeline: LaravelControllerResponseSemanticPipelineInterface = Object\.freeze\([\s\S]*?contractVersion: 17/);
  }],
  ['runtime still consumes canonical method products and does not reparse return syntax', () => {
    assert.match(scanner, /controller_response_method_products_complete/);
    assert.doesNotMatch(scanner, /controllerReturnSemanticFromMethod/);
  }],
  ['no relation/foundation subscanner is introduced', () => {
    assert.doesNotMatch(scanner, /operations\/(relation|foundation)/);
    assert.match(docs, /No `relation` or `foundation` subscanner is added/);
  }],
  ['official documentation and verification limits are recorded', () => {
    assert.match(docs, /PaginatedResourceResponse/);
    assert.match(docs, /does not claim a full-project typecheck or build pass/i);
  }],
];
const results = checks.map(([name, check]) => {
  try { check(); return { name, passed: true }; }
  catch (error) { return { name, passed: false, error: String(error.message || error) }; }
});
const report = { phase: 2012, audit: 'framework-version-judgment-interface-first', passed: results.filter(result => result.passed).length, total: results.length, checks: results };
fs.writeFileSync(path.join(root, 'PHASE2012_AUDIT.json'), `${JSON.stringify(report, null, 2)}\n`);
console.log(`${report.passed}/${report.total} checks passed`);
for (const result of results) console.log(`${result.passed ? 'PASS' : 'FAIL'} ${result.name}${result.error ? `: ${result.error}` : ''}`);
if (report.passed !== report.total) process.exitCode = 1;
