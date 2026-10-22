const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const root = process.cwd();
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
const contract = read('packages/core/src/types/upstream/phpClassNameResolutionInterface.ts');
const authority = read('packages/core/src/types/upstream/phpClassNameResolutionAuthority.ts');
const staticContract = read('packages/core/src/types/upstream/controllerStaticCallOriginInterface.ts');
const staticAuthority = read('packages/core/src/types/upstream/controllerStaticCallOriginAuthority.ts');
const parser = read('packages/core/src/compiler/scanner/lexer/controllerDeclarationParser.ts');
const tests = read('packages/core/src/types/upstream/__tests__/php-class-name-resolution-authority.phase2063.test.ts');
const packageJson = JSON.parse(read('package.json'));
const checks = [
  ['shared lexical context, input, and rule interface are upstream contracts', () => { assert.match(contract, /interface PhpClassNameResolutionRuleInterface/); assert.match(contract, /PhpClassNameResolutionContext/); assert.match(contract, /PhpClassNameResolutionInput/); }],
  ['one upstream authority closes FQCN, namespace-relative, import-alias, and current-namespace judgments', () => { assert.match(authority, /fully_qualified/); assert.match(authority, /namespace_relative/); assert.match(authority, /class_import/); assert.match(authority, /current_namespace/); }],
  ['incomplete import inventory is a closed blocked judgment, not guessed namespace identity', () => { assert.match(authority, /php_class_name_resolution_blocked/); assert.match(authority, /class_import_inventory_incomplete/); }],
  ['static-call authority delegates to the shared class-name authority and preserves its exact judgment ADT', () => { assert.match(staticAuthority, /phpClassNameResolutionAuthority\.judge/); assert.match(staticAuthority, /switch \(contextEvidence\.kind\)/); assert.match(staticAuthority, /case 'unavailable':/); assert.match(staticAuthority, /return phpClassNameResolutionAuthority\.judge/); assert.doesNotMatch(staticAuthority, /context\.classImports\.find/); assert.match(staticContract, /ControllerStaticCallClassReferenceResolutionJudgment = PhpClassNameResolution/); }],
  ['inheritance scanner projects lexical evidence into the same upstream authority', () => { assert.match(parser, /phpClassNameResolutionAuthority\.judge/); assert.match(parser, /kind: 'php_class_name_resolution_input'/); assert.doesNotMatch(parser, /const normalized = sourceName\.replace/); }],
  ['existing static-call authority contract advances with single-judgment propagation', () => { assert.match(staticContract, /readonly contractVersion: 11/); assert.match(staticAuthority, /contractVersion: 11/); assert.doesNotMatch(staticAuthority, /export const .*ResolutionAuthority/); }],
  ['focused regressions cover FQCN, aliases, qualified aliases, namespace-relative and blocked outcomes', () => { assert.match(tests, /fully qualified names/); assert.match(tests, /qualified class references/); assert.match(tests, /namespace-relative/); assert.match(tests, /incomplete/); }],
  ['no relation/foundation subscanner or duplicate invocation/response/AST authority was introduced', () => { assert.equal(fs.existsSync(path.join(root, 'packages/core/src/compiler/scanner/subscanners/relation')), false); assert.equal(fs.existsSync(path.join(root, 'packages/core/src/compiler/scanner/subscanners/foundation')), false); assert.doesNotMatch(parser, /new .*Authority/i); }],
  ['audit command is registered', () => { assert.equal(packageJson.scripts['audit:phase2063-shared-php-class-name-resolution-interface-first'], 'node scripts/audits/audit-phase2063-shared-php-class-name-resolution-interface-first.cjs'); }],
];
const results = checks.map(([name, check]) => { try { check(); console.log(`PASS ${name}`); return true; } catch (error) { console.log(`FAIL ${name} — ${error.message}`); return false; } });
const passed = results.filter(Boolean).length;
const report = { phase: 2063, audit: 'shared-php-class-name-resolution-interface-first', passed, total: checks.length, checks: checks.map(([name], index) => ({ name, passed: results[index] })), note: 'Structural audit only; no full TypeScript typecheck, build, or Vitest execution is asserted.' };
fs.writeFileSync(path.join(root, 'PHASE2063_AUDIT.json'), `${JSON.stringify(report, null, 2)}\n`);
console.log(`\n${passed}/${results.length} checks passed`);
if (passed !== results.length) process.exitCode = 1;
