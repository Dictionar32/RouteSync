const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const read = (relative) => fs.readFileSync(path.join(root, relative), 'utf8');
const contract = read('packages/core/src/types/upstream/laravelSourceAstPipelineInterface.ts');
const executor = read('packages/core/src/compiler/scanner/wiring/laravelSourceAstPipeline.ts');
const builder = read('packages/core/src/compiler/scanner/wiring/upstreamManifestBuilder.ts');
const checks = [
  ['pipeline ADT includes DTO-inventory blocked variant', contract.includes("kind: 'laravel_source_ast_projection_dto_declaration_inventory_blocked'")],
  ['DTO blocked variant retains exact incomplete inventory judgment', contract.includes("scan: Extract<import('./laravelControllerResponseDtoDeclarationInterface').LaravelProjectDtoDeclarationInventoryInterface, { readonly kind: 'laravel_project_dto_declaration_inventory_incomplete' }>")],
  ['DTO blocked variant retains source project and invocation receipt', /laravel_source_ast_projection_dto_declaration_inventory_blocked'[\s\S]*?sourceProject:[\s\S]*?invocationInventoryReceipt:[\s\S]*?scan: Extract/.test(contract)],
  ['pipeline contract version incremented', contract.includes('readonly contractVersion: 12;')],
  ['runtime executor returns DTO blocker instead of throwing', /if \(dtoDeclarationInventory\.kind === 'laravel_project_dto_declaration_inventory_incomplete'\)\s*\{\s*return Object\.freeze\(\{\s*kind: 'laravel_source_ast_projection_dto_declaration_inventory_blocked'/.test(executor)],
  ['DTO blocker gate occurs before controller scanner call', executor.indexOf("kind: 'laravel_source_ast_projection_dto_declaration_inventory_blocked'") < executor.indexOf('const controllerScan = await controllerScanner.scan')],
  ['runtime executor contract version matches upstream interface', executor.includes('contractVersion: 12,')],
  ['manifest builder explicitly rejects DTO blocked result', builder.includes("projection.kind === 'laravel_source_ast_projection_dto_declaration_inventory_blocked'") && builder.includes('Laravel DTO declaration inventory blocked:')],
  ['no foundation/relations imports added in changed execution path', !/(?:from\s+['"][^'"]*semantic\/(?:foundation|relations)|import\(['"][^'"]*semantic\/(?:foundation|relations))/.test(contract + executor.slice(0, executor.indexOf('export function createLaravelSourceAstPipeline')) + builder.slice(0, builder.indexOf('export async function constructRouteSyncManifest')))],
];
for (const [label, passed] of checks) console.log(`${passed ? 'PASS' : 'FAIL'} ${label}`);
console.log(`\n${checks.filter(([, passed]) => passed).length}/${checks.length} checks passed`);
if (checks.some(([, passed]) => !passed)) process.exitCode = 1;
