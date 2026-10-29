const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const root = process.cwd();
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
const parser = read('packages/core/src/compiler/frontend/php/controllerDeclarationParser.ts');
const previousRegression = read('packages/core/src/compiler/frontend/php/controllerDeclarationClassIdentity.phase2019.test.ts');
const tests = read('packages/core/src/compiler/frontend/php/controllerDeclarationGroupedImports.phase2062.test.ts');
const contract = read('packages/core/src/types/upstream/phpClassNameResolutionInterface.ts');
const originContract = read('packages/core/src/types/upstream/controllerStaticCallOriginInterface.ts');
const originAuthority = read('packages/core/src/types/upstream/controllerStaticCallOriginAuthority.ts');
const facadeTests = read('packages/core/src/types/upstream/__tests__/controller-static-call-facade-alias.phase2062.test.ts');
const packageJson = JSON.parse(read('package.json'));
const checks = [
  ['grouped import parser preserves prefix and expands each member', () => { assert.match(parser, /const parseClassImportStatement/); assert.match(parser, /const openGroup = statement\.findIndex/); assert.match(parser, /groupPrefix/); assert.match(parser, /importSegments\(statement\.slice\(openGroup \+ 1, closeGroup\)\)/); }],
  ['grouped aliases produce canonical target and alias bindings', () => { assert.match(parser, /const aliasIndex = tokens\.findIndex/); assert.match(parser, /target: createPhpQualifiedClassName\(target\)/); assert.match(tests, /BaseController as ParentController/); }],
  ['known function and constant imports in a mixed group do not invalidate class inventory', () => { assert.match(parser, /statement\[0\]\?\.value === 'function' \|\| statement\[0\]\?\.value === 'const'/); assert.match(tests, /function helper, const VERSION/); }],
  ['multiple ungrouped class imports are split into independent bindings', () => { assert.match(parser, /for \(const segment of importSegments\(statement\)\)/); assert.match(tests, /ParentController, App\\\\SharedController/); }],
  ['malformed or unsupported import syntax still marks the inventory incomplete', () => { assert.match(parser, /importsComplete = importsComplete && parsed\.complete/); assert.match(parser, /complete: false/); }],
  ['the previous grouped-import regression now expects successful canonical resolution', () => { assert.match(previousRegression, /resolves grouped class imports to canonical parent identity/); assert.match(previousRegression, /App\\\\BaseController/); assert.doesNotMatch(previousRegression, /blocks short parent-name resolution when grouped class imports are not inventoried/); }],
  ['the resolution contract continues to represent alias and canonical qualified-name identity', () => { assert.match(contract, /interface PhpClassImportBinding/); assert.match(contract, /target: PhpQualifiedClassName/); }],
  ['dedicated regression coverage includes aliases, nested members, mixed imports, and comma-separated imports', () => { assert.match(tests, /aliased and nested members/); assert.match(tests, /function and constant imports/); assert.match(tests, /multiple ungrouped class imports/); }],
  ['facade rules match canonical PHP class identities instead of short DB spellings', () => { assert.match(originContract, /qualified_class_method/); assert.match(originContract, /ControllerStaticCallClassReferenceResolutionRuleInterface/); assert.match(originAuthority, /Illuminate\\\\Support\\\\Facades\\\\DB/); assert.doesNotMatch(originAuthority, /createClassName\('DB'\)/); }],
  ['facade alias, FQCN, and unimported-short-name regressions are represented', () => { assert.match(facadeTests, /DB facade alias/); assert.match(facadeTests, /fully qualified DB facade/); assert.match(facadeTests, /unimported short DB name/); }],
  ['origin authority exposes the evolved class-reference rule contract', () => { assert.match(originContract, /contractVersion: 11/); assert.match(originAuthority, /contractVersion: 11/); assert.match(originAuthority, /classReferenceResolutionRule/); }],
  ['audit command is registered in package.json', () => { assert.equal(packageJson.scripts['audit:phase2062-grouped-class-import-resolution-interface-first'], 'node scripts/audits/audit-phase2062-grouped-class-import-resolution-interface-first.cjs'); }],
  ['no relation/foundation subscanner or duplicate authority was introduced', () => { assert.equal(fs.existsSync(path.join(root, 'packages/core/src/compiler/scanner/operations/relation')), false); assert.equal(fs.existsSync(path.join(root, 'packages/core/src/compiler/scanner/operations/foundation')), false); assert.doesNotMatch(parser, /new .*Authority/i); }],
];
const results = checks.map(([name, check]) => { try { check(); console.log(`PASS ${name}`); return true; } catch (error) { console.log(`FAIL ${name} — ${error.message}`); return false; } });
const passed = results.filter(Boolean).length;
const report = { phase: 2062, audit: 'grouped-class-import-resolution-interface-first', passed, total: checks.length, checks: checks.map(([name], index) => ({ name, passed: results[index] })), note: 'Structural audit only; no full TypeScript typecheck, build, or Vitest execution is asserted.' };
fs.writeFileSync(path.join(root, 'PHASE2062_AUDIT.json'), `${JSON.stringify(report, null, 2)}\n`);
console.log(`\n${passed}/${results.length} checks passed`);
if (passed !== results.length) process.exitCode = 1;
