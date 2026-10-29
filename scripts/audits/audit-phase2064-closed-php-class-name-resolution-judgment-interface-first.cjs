const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const root = process.cwd();
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
const contract = read('packages/core/src/types/upstream/phpClassNameResolutionInterface.ts');
const authority = read('packages/core/src/types/upstream/phpClassNameResolutionAuthority.ts');
const regression = read('packages/core/src/types/upstream/__tests__/php-class-name-resolution-authority.phase2063.test.ts');
const parser = read('packages/core/src/compiler/frontend/php/controllerDeclarationParser.ts');
const staticAuthority = read('packages/core/src/types/upstream/controllerStaticCallOriginAuthority.ts');
const invocation = read('packages/core/src/types/upstream/laravelControllerInvocationSemanticJudgmentInterface.ts');
const invocationAuthority = read('packages/core/src/types/upstream/laravelControllerInvocationSemanticJudgmentAuthority.ts');
const runtime = read('packages/core/src/types/upstream/invocationSemanticRuntimeExecutor.ts');
const packageJson = JSON.parse(read('package.json'));
const checks = [
  ['class-name resolution remains one upstream interface and one closed ADT', () => { assert.match(contract, /interface PhpClassNameResolutionRuleInterface/); assert.match(contract, /kind: 'php_class_name_resolved'/); assert.match(contract, /kind: 'php_class_name_resolution_blocked'/); }],
  ['malformed names are closed before any namespace/import projection', () => { assert.match(authority, /reason: 'malformed_class_name'/); assert.match(authority, /normalized\.length === 0/); assert.match(authority, /segments\.some\(segment => segment\.length === 0\)/); }],
  ['malformed inputs do not manufacture empty or doubled-separator class identities', () => { assert.match(regression, /malformed empty and separator-only references/); assert.match(regression, /namespace\\\\/); assert.match(regression, /Vendor\\\\\\\\Model/); }],
  ['inheritance adapts lexical evidence to the shared resolver rather than resolving independently', () => { assert.match(parser, /phpClassNameResolutionAuthority\.judge/); assert.match(parser, /kind: 'php_class_name_resolution_input'/); assert.doesNotMatch(parser, /const normalized = sourceName\.replace/); }],
  ['static-call/model identity consumes the exact shared class-name judgment', () => { assert.match(staticAuthority, /phpClassNameResolutionAuthority\.judge/); assert.match(staticAuthority, /const classReferenceJudgment = classReferenceResolutionRule\.judge\(input\)/); assert.match(staticAuthority, /rulePatternMatches\(rule\.pattern, input, classReferenceJudgment\)/); assert.match(staticAuthority, /matchingRule\.judge\(input, classReferenceJudgment\)/); assert.doesNotMatch(staticAuthority, /context\.classImports\.find/); }],
  ['invocation semantic judgment remains an outcome-indexed value, not a second class resolver', () => { assert.match(invocation, /response: Extract<PhpSourceInvocationSemanticPipelineIntegrationResult/); assert.match(invocation, /singleCanonicalModelRule/); assert.doesNotMatch(invocation, /PhpClassNameResolutionRuleInterface/); }],
  ['existing invocation authority delegates source binding and integrated response projection', () => { assert.match(invocationAuthority, /dependencies\.sourceBinding\.bind/); assert.match(invocationAuthority, /dependencies\.integration\.project/); assert.doesNotMatch(invocationAuthority, /phpClassNameResolutionAuthority/); }],
  ['runtime executor remains a downstream execution boundary and does not own class-name resolution', () => { assert.match(runtime, /interface|contract|execute|project/i); assert.doesNotMatch(runtime, /phpClassNameResolutionAuthority|classImports\.find/); }],
  ['no relation/foundation subscanner or parallel invocation/response/AST authority was introduced', () => { assert.equal(fs.existsSync(path.join(root, 'packages/core/src/compiler/scanner/operations/relation')), false); assert.equal(fs.existsSync(path.join(root, 'packages/core/src/compiler/scanner/operations/foundation')), false); assert.doesNotMatch(parser, /new .*Authority/i); }],
  ['audit command is registered', () => { assert.equal(packageJson.scripts['audit:phase2064-closed-php-class-name-resolution-judgment-interface-first'], 'node scripts/audits/audit-phase2064-closed-php-class-name-resolution-judgment-interface-first.cjs'); }],
];
const results = checks.map(([name, check]) => { try { check(); console.log(`PASS ${name}`); return true; } catch (error) { console.log(`FAIL ${name} — ${error.message}`); return false; } });
const passed = results.filter(Boolean).length;
const report = { phase: 2064, audit: 'closed-php-class-name-resolution-judgment-interface-first', passed, total: checks.length, checks: checks.map(([name], index) => ({ name, passed: results[index] })), note: 'Structural audit only; full TypeScript typecheck, build, and Vitest are not asserted.' };
fs.writeFileSync(path.join(root, 'PHASE2064_AUDIT.json'), `${JSON.stringify(report, null, 2)}\n`);
console.log(`\n${passed}/${results.length} checks passed`);
if (passed !== results.length) process.exitCode = 1;
