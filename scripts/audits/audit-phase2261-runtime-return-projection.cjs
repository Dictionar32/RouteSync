const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const resolverPath = path.join(root, 'packages/core/src/compiler/scanner/descriptors/request/controllerActionContract.ts');
const wiringPath = path.join(root, 'packages/core/src/compiler/scanner/wiring/laravelControllerExecutionDependencies.ts');
const adapterPath = path.join(root, 'packages/core/src/compiler/scanner/lexer/routeAst/controllerRuntimeReturnProjection.ts');
const interfacePath = path.join(root, 'packages/core/src/types/upstream/controllerRuntimeReturnProjectionInterface.ts');
const testPath = path.join(root, 'packages/core/src/compiler/scanner/descriptors/request/controllerActionContract.phase10.test.ts');
const actionScannerPath = path.join(root, 'packages/core/src/compiler/scanner/subscanners/controller/actionScanner.ts');
const resolver = fs.readFileSync(resolverPath, 'utf8');
const wiring = fs.readFileSync(wiringPath, 'utf8');
const adapter = fs.readFileSync(adapterPath, 'utf8');
const contract = fs.readFileSync(interfacePath, 'utf8');
const tests = fs.readFileSync(testPath, 'utf8');
const actionScanner = fs.readFileSync(actionScannerPath, 'utf8');
const checks = [
  ['upstream projection interface exists', contract.includes('ControllerRuntimeReturnProjectionInterface') && contract.includes('ControllerRuntimeReturnProjectionInput')],
  ['runtime projection is an explicit ADT projection contract', contract.includes("kind: 'controller_runtime_return_projection'") && contract.includes('ControllerRuntimeReturn')],
  ['AST adapter preserves exact source file', adapter.includes('sourceFile.value.value') && !adapter.includes("'<controller-action>'")],
  ['resolver consumes injected projection', resolver.includes('context.runtimeReturnProjection.project')],
  ['resolver no longer defines local runtime-return classifier', !resolver.includes('function resolveRuntimeReturn')],
  ['resolver no longer imports expression mapper', !resolver.includes('mapResourcePhpAstToUpstream')],
  ['composition root injects production projection', wiring.includes('runtimeReturnProjection: controllerRuntimeReturnProjection')],
  ['legacy action scanner supplies required projection', actionScanner.includes('runtimeReturnProjection: controllerRuntimeReturnProjection')],
  ['resolver fixtures use the same projection contract', (tests.match(/runtimeReturnProjection: controllerRuntimeReturnProjection/g) || []).length === 4],
  ['resolver has no foundation or relations imports', !/semantic\/(foundation|relations)/.test(resolver)],
];
for (const [name, passed] of checks) console.log(`${passed ? 'PASS' : 'FAIL'} ${name}`);
if (checks.some(([, passed]) => !passed)) process.exitCode = 1;
console.log(`Phase 2261 audit: ${checks.filter(([, passed]) => passed).length}/${checks.length}`);
