'use strict';
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const read = relative => fs.readFileSync(path.join(root, relative), 'utf8');
const dataflow = read('packages/core/src/compiler/frontend/php/routeAst/routeDataFlow.ts');
const composition = read('packages/core/src/compiler/scanner/upstream/routeDeclarationComposition.ts');
const packageJson = JSON.parse(read('package.json'));
const operations = ['declarationFlow','declarationFlows','resourceFlow','resourceFlows','declarationGraph','declarationGraphs','resourceGraph'];
const checks = [
  ['existing RouteDeclarationAst and RouteResourceDeclarationAst remain the source contracts', /import type \{ RouteDeclarationAst, RouteTargetAst, LaravelRouteMethod, RouteConstraintArgumentAst \}/.test(dataflow) && /import type \{ RouteResourceDeclarationAst \}/.test(dataflow)],
  ['RouteDataFlowOperationsInterface explicitly owns seven domain operations', /export interface RouteDataFlowOperationsInterface\s*\{/.test(dataflow) && operations.every(name => new RegExp(`readonly ${name}:`).test(dataflow))],
  ['runtime operation export is interface-first and frozen', /export const routeDataFlowOperations:\s*RouteDataFlowOperationsInterface\s*=\s*Object\.freeze\(/.test(dataflow)],
  ['legacy exported function-shaped flow operations are removed', !/^\s*export\s+(?:async\s+)?function\s+|^\s*export\s+const\s+(?:routeDeclarationFlow|routeDeclarationDataFlow|routeResourceFlow|routeResourceDataFlow|routeDeclarationDataFlowGraph|routeDataFlowGraph|routeResourceDataFlowGraph)\s*=/m.test(dataflow)],
  ['domain operation maps each public operation to a private implementation', operations.every(name => dataflow.includes(`${name}: create`) )],
  ['declaration composition imports the runtime operation object', /import \{ routeDataFlowOperations, routeSourceFileContextKnowledgeOperation \} from ['"]\.\.\/\.\.\/frontend\/php\/routeAst\/routeDataFlow['"]/.test(composition)],
  ['active manifest composition derives target and bindings through route dataflow operation', /routeDataFlowOperations\.declarationFlow\(declaration\)/.test(composition) && /switch \(routeFlow\.target\.value\.kind\)/.test(composition) && /routeFlow\.bindings\.value\.map/.test(composition)],
  ['existing source context operation remains interface-first and used by runtime consumer', /routeSourceFileContextKnowledgeOperation\.resolve\(/.test(composition) && /export const routeSourceFileContextKnowledgeOperation:\s*RouteSourceFileContextKnowledgeOperationInterface\s*=\s*Object\.freeze/.test(dataflow)],
  ['Phase 2831 audit package script is registered', packageJson.scripts?.['audit:phase2831-route-dataflow-domain-operations'] === 'node scripts/audits/audit-phase2831-route-dataflow-domain-operations.cjs'],
  ['upstream collections remains empty', fs.statSync(path.join(root, 'packages/core/src/types/upstream/collections.ts')).size === 0],
];
let failed = false;
for (const [name, ok] of checks) { console.log(`${ok ? 'PASS' : 'FAIL'} ${name}`); if (!ok) failed = true; }
console.log(`Phase 2831 route-dataflow domain operation audit: ${checks.filter(([,ok]) => ok).length}/${checks.length}`);
if (failed) process.exitCode = 1;
