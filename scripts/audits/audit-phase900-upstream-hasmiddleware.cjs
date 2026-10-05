const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const read = p => fs.readFileSync(path.join(root, p), 'utf8');
const files = {
  astTypes: read('packages/core/src/compiler/scanner/lexer/controllerAstTypes.ts'),
  methodParser: read('packages/core/src/compiler/scanner/lexer/controllerMethodParser.ts'),
  declarationParser: read('packages/core/src/compiler/scanner/lexer/controllerDeclarationParser.ts'),
  canonical: read('packages/core/src/compiler/scanner/subscanners/controller/controllerAstCanonical.ts'),
  producer: read('packages/core/src/compiler/scanner/subscanners/controller/controllerProducer.ts'),
  scanner: read('packages/core/src/compiler/scanner/subscanners/ControllerScanner.ts'),
  upstream: read('packages/core/src/types/upstream/controller.ts'),
  regression: read('packages/core/src/compiler/scanner/subscanners/controller/controllerHasMiddleware.phase900.test.ts'),
};
const checks = {
  methodStorageClosed: files.astTypes.includes("ControllerMethodStorageAst = 'instance' | 'static'"),
  parserProjectsStaticStorage: files.methodParser.includes('storage: controllerMethodStorage(tokens, functionIndex)'),
  declarationCarriesInterfaces: files.astTypes.includes('readonly interfaces: readonly AstIdentifier[]'),
  declarationRecognizesHasMiddleware: files.declarationParser.includes("relationEqual(token.value, 'HasMiddleware')"),
  controllerMiddlewareOriginClosed: files.upstream.includes("kind: 'has_middleware'"),
  canonicalRecognizesStaticMiddleware: files.canonical.includes("relationEqual(method.name, 'middleware')") && files.canonical.includes("relationEqual(method.storage, 'static')"),
  canonicalProjectsHasMiddleware: files.canonical.includes("origin: { kind: 'has_middleware' as const }"),
  canonicalPreservesOnlyExcept: files.canonical.includes("argument.name.value.value === 'only'") && files.canonical.includes("argument.name.value.value === 'except'"),
  producerCarriesInterfaces: files.producer.includes('controllerInterfaces') && files.producer.includes('controllerMethods'),
  scannerExcludesHasMiddlewareFromActions: files.scanner.includes('relationEqual(method.name, \'middleware\')') && files.scanner.includes('relationEqual(method.storage, \'static\')'),
  regressionCoversStaticAndScopes: files.regression.includes("implements HasMiddleware") && files.regression.includes("public static function middleware") && files.regression.includes("only: ['show']") && files.regression.includes("except: ['store']"),
  noMethodNameOnlyRecognition: !files.canonical.match(/method\.name.*middleware.*without.*storage/i),
};
const failed = Object.entries(checks).filter(([,v]) => !v).map(([k]) => k);
const result = { phase: 900, checks, allPassed: failed.length === 0, failed };
console.log(JSON.stringify(result, null, 2));
process.exit(failed.length ? 1 : 0);
