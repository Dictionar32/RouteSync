'use strict';
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const core = path.join(root, 'packages/core/src');
const target = path.join(core, 'compiler/scanner/upstream/route/controllerMiddlewareProjection.ts');
const facade = path.join(core, 'compiler/scanner/wiring/route/controllerMiddlewareProjection.ts');
const tests = [
  path.join(core, 'compiler/scanner/upstream/route/controllerMiddlewareProjection.phase901.test.ts'),
  path.join(core, 'compiler/scanner/wiring/route/controllerMiddlewareProjection.phase901.test.ts'),
];
const read = p => fs.readFileSync(p, 'utf8');
const walk = dir => fs.existsSync(dir) ? fs.readdirSync(dir, {withFileTypes:true}).flatMap(e => e.isDirectory() ? walk(path.join(dir,e.name)) : [path.join(dir,e.name)]) : [];
const coreTs = walk(core).filter(p => /\.tsx?$/.test(p));
const checks = [];
const check = (name, ok, detail='') => checks.push({name, ok:!!ok, detail});
const src = read(target);
check('controller middleware projection imports no relations/foundation', !/semantic\/(?:relations|foundation)\//.test(src));
check('runtime implementation is not an exported free function', !/export\s+function\s+projectControllerMiddlewareRelations/.test(src));
check('fully typed operations interface exists', /export interface ControllerMiddlewareProjectionOperationsInterface/.test(src));
check('runtime exports interface-typed frozen operation object', /export const controllerMiddlewareProjectionOperations:\s*ControllerMiddlewareProjectionOperationsInterface\s*=\s*Object\.freeze/.test(src));
check('sequence ADT is exhaustively handled', /case 'empty'/.test(src) && /case 'cons'/.test(src) && /const exhaustive: never = sequence/.test(src));
check('action scope ADT is exhaustively handled', /const exhaustive: never = relation\.actions/.test(src));
check('declaration and exclusion projection preserves filtering', /if \(relation\.exclusion\)/.test(src) && /declarations\.push\(item\)/.test(src) && /exclusions\.push\(item\)/.test(src));
check('wiring facade exports operation object', /export \{ controllerMiddlewareProjectionOperations \}/.test(read(facade)));
check('both focused tests use runtime operation object', tests.every(p => /controllerMiddlewareProjectionOperations\.project/.test(read(p))));
check('focused tests no longer import relations/foundation', tests.every(p => !/semantic\/(?:relations|foundation)\//.test(read(p))));
check('semantic relations directory remains empty', fs.existsSync(path.join(core,'semantic/relations')) && fs.readdirSync(path.join(core,'semantic/relations')).length===0);
check('semantic foundation directory remains empty', fs.existsSync(path.join(core,'semantic/foundation')) && fs.readdirSync(path.join(core,'semantic/foundation')).length===0);
check('subscanners directory remains absent', !fs.existsSync(path.join(core,'compiler/scanner/subscanners')));
check('descriptors directory remains absent', !fs.existsSync(path.join(core,'compiler/scanner/descriptors')));
const unresolved = coreTs.filter(p => /semantic\/(?:relations|foundation)\//.test(read(p)));
check('unresolved relations/foundation references inventoried', unresolved.length >= 1, `${unresolved.length} TS/TSX files still contain references; intentionally not hidden`);
console.log(`Phase 2749 controller middleware runtime operation audit: ${checks.filter(c=>c.ok).length}/${checks.length}`);
for (const c of checks) console.log(`${c.ok?'PASS':'FAIL'} ${c.name}${c.detail?` — ${c.detail}`:''}`);
if (checks.some(c=>!c.ok)) process.exitCode=1;
