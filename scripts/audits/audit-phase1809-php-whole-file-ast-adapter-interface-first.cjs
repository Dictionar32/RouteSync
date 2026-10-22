const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const read = relative => fs.readFileSync(path.join(root, relative), 'utf8');
const adapter = read('packages/cli/src/parsers/php/sourceFrontendAstAdapter.ts');
const pipeline = read('packages/cli/src/parsers/php/sourceInvocationPipeline.ts');
const parserIndex = read('packages/cli/src/parsers/php/index.ts');
const coreIndex = read('packages/core/src/index.ts');
const scanner = read('packages/core/src/compiler/scanner/lexer/controllerDataflowAnalyzer.ts');
const checks = [
  ['adapter uses existing php-parser dependency', adapter.includes("from 'php-parser'")],
  ['adapter implements upstream frontend interface', adapter.includes('PhpSourceFrontendInterface') && adapter.includes('phpSourceFrontendAstAdapter: PhpSourceFrontendInterface')],
  ['adapter uses canonical frontend contract', adapter.includes('PHP_SOURCE_FRONTEND_CONTRACT')],
  ['AST parser retains source positions', adapter.includes('withPositions: true')],
  ['adapter parses complete source document', adapter.includes('parser.parseCode(sourceText, file.value.value)')],
  ['whole-file source extent binds offsets to document length', adapter.includes('span(file, 0, sourceText.length)')],
  ['parse failures produce incomplete evidence', adapter.includes('catch {') && adapter.includes('return incompleteExtraction(document)')],
  ['AST traversal recursively visits child structures', adapter.includes('const walk = (root: unknown)') && adapter.includes('Object.entries(value).forEach')],
  ['namespace regions are inventoried', adapter.includes("nodeKind(node) === 'namespace'") && adapter.includes('PhpNamespaceRegionIdentity')],
  ['namespace-prefix imports are distinct', adapter.includes("kind: 'php_namespace_import_binding'")],
  ['function imports are distinct', adapter.includes("kind: 'php_function_import_binding'")],
  ['named function declarations are inventoried', adapter.includes("nodeKind(node) === 'function'") && adapter.includes('php_declared_function_symbol')],
  ['ordinary named function calls are inventoried without method-call classification', adapter.includes("nodeKind(node) !== 'call'") && adapter.includes("nodeKind(callee) !== 'name'")],
  ['callee name segments retain source spans', adapter.includes('makeSyntax(callee, sourceText, file)') && adapter.includes('php_function_name_segment')],
  ['arguments preserve positional, named, and unpacked forms', adapter.includes("kind: 'named'") && adapter.includes("kind: unpacked ? 'unpacked' : 'positional'")],
  ['argument expressions keep parser source spans', adapter.includes("kind: 'unsupported_expression'") && adapter.includes('nodeSpan(valueNode, file)')],
  ['whole-file traversal evidence is explicit', adapter.includes("kind: 'php_source_whole_file_ast_traversal'") && adapter.includes('unvisitedSyntaxFamilies: Object.freeze([])')],
  ['unmappable syntax downgrades extraction coverage', adapter.includes('sourceInventoryMappingComplete = false') && adapter.includes('invocationMappingComplete = false') && adapter.includes("kind: 'php_source_frontend_coverage_incomplete'" )],
  ['CLI composition injects AST frontend into upstream pipeline', pipeline.includes('frontend: phpSourceFrontendAstAdapter')],
  ['CLI composition wires all upstream authorities', ['extractionValidation:', 'sourceInventory:', 'environmentProjection:', 'nameResolution:', 'invocationBatch:'].every(value => pipeline.includes(value))],
  ['adapter avoids semantic foundation and relation imports', !adapter.includes('semantic/foundation') && !adapter.includes('semantic/relations')],
  ['adapter is exported by PHP parser module', parserIndex.includes("export { phpSourceFrontendAstAdapter } from './sourceFrontendAstAdapter'")],
  ['pipeline entry is exported by PHP parser module', parserIndex.includes("export { analyzePhpSourceInvocationSemanticPipeline, phpSourceInvocationSemanticPipeline } from './sourceInvocationPipeline'")],
  ['core exports frontend and name-resolution contracts', coreIndex.includes("export * from './types/upstream/phpSourceFrontendInterface'") && coreIndex.includes("export * from './types/upstream/phpFunctionNameResolutionInterface'")],
  ['core exports source invocation pipeline result contract', coreIndex.includes("export * from './types/upstream/phpSourceInvocationSemanticPipelineInterface'")],
  ['scanner does not import php-parser directly', !scanner.includes("from 'php-parser'")],
];
let failures = 0;
for (const [label, passed] of checks) {
  process.stdout.write(`${passed ? 'PASS' : 'FAIL'} ${label}\n`);
  if (!passed) failures += 1;
}
process.stdout.write(`\nPhase 1809 audit: ${checks.length - failures}/${checks.length} passed\n`);
process.exitCode = failures === 0 ? 0 : 1;
