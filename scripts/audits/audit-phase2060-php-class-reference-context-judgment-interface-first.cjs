const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const root = process.cwd();
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
const contract = read('packages/core/src/types/upstream/controllerStaticCallOriginInterface.ts');
const authority = read('packages/core/src/types/upstream/controllerStaticCallOriginAuthority.ts');
const sharedResolver = read('packages/core/src/types/upstream/phpClassNameResolutionAuthority.ts');
const parser = read('packages/core/src/compiler/scanner/lexer/astClassifierRuntime.ts');
const dataflow = read('packages/core/src/compiler/scanner/subscanners/controller/controllerDataflowContract.ts');
const modelTest = read('packages/core/src/types/upstream/__tests__/controller-static-call-model-catalog-identity.phase2059.test.ts');
const contextTest = read('packages/core/src/types/upstream/__tests__/controller-static-call-class-reference-context.phase2061.test.ts');
const astTest = read('packages/core/src/compiler/scanner/__test__/ecommerceShopAstPhase87_2.spec.ts');
const pkg = read('package.json');
const docs = read('packages/core/src/types/upstream/docs/PHASE2061_PHP_CLASS_REFERENCE_CONTEXT_JUDGMENT_INTERFACE_FIRST.md');
const checks = [
  ['class-reference evidence distinguishes simple names from context-dependent qualified names', () => { assert.match(contract, /ControllerStaticCallClassReferenceEvidence[\s\S]*?kind: 'simple_name'[\s\S]*?kind: 'qualified_name'/); }],
  ['origin input carries class-reference and lexical-context evidence and authority contract advances to v11', () => { assert.match(contract, /readonly classReference: ControllerStaticCallClassReferenceEvidence/); assert.match(contract, /classNameResolutionContext: ControllerStaticCallClassNameResolutionContextEvidence/); assert.match(contract, /readonly contractVersion: 11/); assert.match(authority, /contractVersion: 11/); }],
  ['qualified references are resolved from explicit namespace/import evidence and exact canonical FQCN', () => { assert.match(sharedResolver, /classImports\.find/); assert.match(authority, /identity\.qualifiedName\.value\.value/); assert.match(sharedResolver, /context\.importInventory === 'incomplete'/); }],
  ['scanner projects explicit class-reference evidence into origin input', () => { assert.match(dataflow, /classReference: classReferenceEvidence\(value\.className\)/); assert.doesNotMatch(dataflow, /controllerStaticCallOriginAuthority/); }],
  ['static-call parser preserves the complete class spelling before ::', () => { assert.match(parser, /const classTokens = relationSlice\(tokens, 0, separatorIndex\)/); assert.match(parser, /classTokens\.map\(token => token\.value\)\.join\(''\)/); }],
  ['fully qualified static-call AST regression is specified', () => { assert.match(astTest, /preserves fully qualified class spelling in static-call AST evidence/); assert.match(astTest, /App\\\\Models\\\\User::query/); }],
  ['class reference resolution has focused alias/FQCN/current-namespace regressions', () => { assert.match(contextTest, /explicit import alias/); assert.match(contextTest, /fully qualified class name/); assert.match(contextTest, /current namespace/); assert.match(contextTest, /namespace-relative class references/); }],
  ['existing origin rule, argument-rule, and catalog contracts remain the single authority', () => { assert.match(authority, /controllerStaticCallOriginRules/); assert.match(authority, /modelClassIdentityRule/); assert.doesNotMatch(authority, /export const .*ClassReferenceAuthority/); }],
  ['no relation/foundation subscanner or parallel invocation/response authority is introduced', () => { assert.match(docs, /No `relation\/foundation` subscanner/); assert.match(docs, /No second authority was added/); }],
  ['audit is registered in package scripts', () => { assert.match(pkg, /audit:phase2060-php-class-reference-context-judgment-interface-first/); }],
];
const results = checks.map(([name, check]) => { try { check(); console.log(`PASS ${name}`); return true; } catch (error) { console.log(`FAIL ${name} — ${error.message}`); return false; } });
const passed = results.filter(Boolean).length;
console.log(`\n${passed}/${checks.length} checks passed`);
if (passed !== checks.length) process.exitCode = 1;
