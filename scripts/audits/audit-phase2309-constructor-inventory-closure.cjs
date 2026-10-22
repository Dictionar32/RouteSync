const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const read = (relative) => fs.readFileSync(path.join(root, relative), 'utf8');
const checks = [
  ['upstream selector accepts inventory only', /readonly select: <TMethod>\(inventory: PhpClassMethodDeclarationInventory<TMethod>\)/.test(read('packages/core/src/types/upstream/phpClassConstructorSelectionInterface.ts'))],
  ['upstream selector contract version advanced', /contractVersion: 2/.test(read('packages/core/src/types/upstream/phpClassConstructorSelectionInterface.ts'))],
  ['blocked inventory remains blocked', /php_class_constructor_selection_blocked/.test(read('packages/core/src/types/upstream/phpClassConstructorSelectionAuthority.ts'))],
  ['parser AST carries method inventory', /readonly methodDeclarationInventory: ControllerMethodDeclarationInventory<Semantic>/.test(read('packages/core/src/compiler/scanner/lexer/controllerAstTypes.ts'))],
  ['parser marks dropped method candidates blocked', /controller_method_declaration_inventory_blocked/.test(read('packages/core/src/compiler/scanner/lexer/controllerDeclarationParser.ts'))],
  ['attribute producer consumes parser inventory', /input\.declaration\.methodDeclarationInventory/.test(read('packages/core/src/compiler/scanner/attributeProducer.ts'))],
  ['controller scanner consumes parser inventory', /item\.declaration\.methodDeclarationInventory/.test(read('packages/core/src/compiler/scanner/wiring/laravelControllerScanner.ts'))],
  ['controller scan propagates blocked constructor inventory', /controller_constructor_selection_inventory_blocked/.test(read('packages/core/src/compiler/scanner/wiring/laravelControllerScanner.ts')) && /controller_constructor_selection_inventory_blocked/.test(read('packages/core/src/types/upstream/laravelControllerScannerInterface.ts'))],
  ['attribute scanner preserves blocked constructor inventory', /laravel_attribute_constructor_inventory_blocked/.test(read('packages/core/src/compiler/scanner/laravelAttributeScanner.ts')) && /laravel_attribute_constructor_inventory_blocked/.test(read('packages/core/src/types/upstream/laravelAttributeScannerInterface.ts'))],
  ['attribute scanner contract version advanced', /contractVersion: 20/.test(read('packages/core/src/types/upstream/laravelAttributeScannerInterface.ts')) && /contractVersion: 20/.test(read('packages/core/src/compiler/scanner/laravelAttributeScanner.ts'))],
  ['source AST pipeline stops on blocked controller scan', /laravel_source_ast_projection_controller_scan_blocked/.test(read('packages/core/src/compiler/scanner/wiring/laravelSourceAstPipeline.ts')) && /laravel_source_ast_projection_controller_scan_blocked/.test(read('packages/core/src/types/upstream/laravelSourceAstPipelineInterface.ts'))],
  ['manifest builder rejects blocked controller scan', /Laravel controller scan blocked/.test(read('packages/core/src/compiler/scanner/wiring/upstreamManifestBuilder.ts'))],
  ['source AST pipeline contract version advanced', /contractVersion: 10/.test(read('packages/core/src/types/upstream/laravelSourceAstPipelineInterface.ts')) && /contractVersion: 10/.test(read('packages/core/src/compiler/scanner/wiring/laravelSourceAstPipeline.ts'))],
  ['no foundation dependency introduced in changed files', !['packages/core/src/types/upstream/phpClassConstructorSelectionInterface.ts','packages/core/src/types/upstream/phpClassConstructorSelectionAuthority.ts','packages/core/src/compiler/scanner/lexer/controllerAstTypes.ts','packages/core/src/compiler/scanner/lexer/controllerDeclarationParser.ts','packages/core/src/compiler/scanner/attributeProducer.ts','packages/core/src/compiler/scanner/wiring/laravelControllerScanner.ts'].some((file) => /semantic\/foundation/.test(read(file)))],
];
for (const [name, passed] of checks) process.stdout.write(`${passed ? 'PASS' : 'FAIL'} ${name}\n`);
process.stdout.write(`${checks.filter(([, passed]) => passed).length}/${checks.length} checks passed\n`);
if (checks.some(([, passed]) => !passed)) process.exitCode = 1;
