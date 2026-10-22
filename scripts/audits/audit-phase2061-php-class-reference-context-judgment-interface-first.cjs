const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const root = process.cwd();
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
const contract = read('packages/core/src/types/upstream/controllerStaticCallOriginInterface.ts');
const authority = read('packages/core/src/types/upstream/controllerStaticCallOriginAuthority.ts');
const sharedResolver = read('packages/core/src/types/upstream/phpClassNameResolutionAuthority.ts');
const modelScanner = read('packages/core/src/compiler/scanner/subscanners/ModelScanner.ts');
const controllerParser = read('packages/core/src/compiler/scanner/lexer/controllerDeclarationParser.ts');
const controllerAst = read('packages/core/src/compiler/scanner/lexer/controllerAstTypes.ts');
const actionScanner = read('packages/core/src/compiler/scanner/subscanners/controller/actionScanner.ts');
const resolver = read('packages/core/src/compiler/scanner/descriptors/request/controllerActionContract.ts');
const dataflow = read('packages/core/src/compiler/scanner/subscanners/controller/controllerDataflowContract.ts');
const pipeline = read('packages/core/src/compiler/scanner/wiring/laravelSourceAstPipeline.ts');
const tests = read('packages/core/src/types/upstream/__tests__/controller-static-call-class-reference-context.phase2061.test.ts');
const checks = [
  ['static-call origin input carries typed namespace and class-import context', () => { assert.match(contract, /ControllerStaticCallClassNameResolutionContext/); assert.match(contract, /classNameResolutionContext: ControllerStaticCallClassNameResolutionContextEvidence/); }],
  ['model catalog identities retain fully qualified class identity', () => { assert.match(contract, /qualifiedName: PhpQualifiedClassName/); assert.match(modelScanner, /qualifiedName: createPhpQualifiedClassName/); assert.match(modelScanner, /classIdentities: Object\.freeze/); }],
  ['model scanner derives the declared namespace instead of assuming App\Models', () => { assert.match(modelScanner, /declaredNamespaceName/); assert.match(modelScanner, /tokens\.findIndex/); assert.doesNotMatch(modelScanner, /createPhpQualifiedClassName\(`App\\Models/); }],
  ['source pipeline consumes the canonical model class identity catalog', () => { assert.match(pipeline, /modelBundle\.classIdentities/); assert.doesNotMatch(pipeline, /modelDefinitions\.map\(definition/); }],
  ['controller declaration parser captures namespace/import context once per declaration', () => { assert.match(controllerParser, /methodResolutionContext/); assert.match(controllerParser, /classImports: nameEnvironment\.imports/); assert.match(controllerParser, /importInventory: nameEnvironment\.importsComplete/); }],
  ['class-resolution context is carried by controller method AST and action wiring', () => { assert.match(controllerAst, /classNameResolutionContext\?: ControllerMethodClassNameResolutionContext/); assert.match(actionScanner, /classNameResolutionContext: method\.classNameResolutionContext/); assert.match(resolver, /context\.classNameResolutionContext/); }],
  ['scanner projects context into static-call evidence without owning resolution', () => { assert.match(dataflow, /classNameResolutionContext: classNameResolutionContext/); assert.doesNotMatch(dataflow, /controllerStaticCallOriginAuthority/); }],
  ['authority resolves FQCN, namespace-relative names, and import aliases against canonical catalog identities', () => { assert.match(sharedResolver, /classImports\.find/); assert.match(sharedResolver, /namespaceName\.value\.value/); assert.match(authority, /identity\.qualifiedName\.value\.value/); }],
  ['incomplete import evidence remains blocked instead of becoming an empty import table', () => { assert.match(sharedResolver, /context\.importInventory === 'incomplete'/); assert.match(tests, /import inventory is complete/); }],
  ['regression coverage includes aliases, FQCN, current namespace, and namespace-relative references', () => { assert.match(tests, /explicit import alias/); assert.match(tests, /fully qualified class name/); assert.match(tests, /current namespace/); assert.match(tests, /namespace-relative class references/); }],
  ['contract and authority versions are advanced together', () => { assert.match(contract, /contractVersion: 11/); assert.match(authority, /contractVersion: 11/); }],
  ['no relation/foundation subscanner or duplicate authority is introduced', () => { assert.doesNotMatch(contract, /relation\/foundation/); assert.doesNotMatch(authority, /new.*Authority/i); }],
];
const results = checks.map(([name, check]) => { try { check(); console.log(`PASS ${name}`); return true; } catch (error) { console.log(`FAIL ${name} — ${error.message}`); return false; } });
const passed = results.filter(Boolean).length;
console.log(`\n${passed}/${results.length} checks passed`);
if (passed !== results.length) process.exitCode = 1;
