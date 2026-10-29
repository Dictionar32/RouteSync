'use strict';
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const read = relative => fs.readFileSync(path.join(root, relative), 'utf8');
const flowPath = 'packages/core/src/compiler/frontend/php/routeAst/routeDataFlow.ts';
const consumerPath = 'packages/core/src/compiler/scanner/upstream/routeDeclarationComposition.ts';
const flow = read(flowPath);
const consumer = read(consumerPath);
const checks = [
  ['declaration semantic kind has explicit interface', /export interface RouteDeclarationSemanticKindOperationInterface/.test(flow)],
  ['declaration semantic kind uses interface-first frozen export', /export const routeDeclarationSemanticKindOperation:\s*RouteDeclarationSemanticKindOperationInterface\s*=\s*Object\.freeze\(/.test(flow)],
  ['route method semantic kind has explicit interface', /export interface RouteMethodSemanticKindOperationInterface/.test(flow)],
  ['route method semantic kind uses interface-first frozen export', /export const routeMethodSemanticKindOperation:\s*RouteMethodSemanticKindOperationInterface\s*=\s*Object\.freeze\(/.test(flow)],
  ['source file context has explicit operation interface', /export interface RouteSourceFileContextKnowledgeOperationInterface/.test(flow)],
  ['source file context uses interface-first frozen export', /export const routeSourceFileContextKnowledgeOperation:\s*RouteSourceFileContextKnowledgeOperationInterface\s*=\s*Object\.freeze\(/.test(flow)],
  ['legacy declaration semantic kind export removed', !/^export const routeDeclarationSemanticKind\s*=/m.test(flow)],
  ['legacy route method semantic kind export removed', !/^export const routeMethodSemanticKind\s*=/m.test(flow)],
  ['legacy source context export removed', !/^export const routeSourceFileContextKnowledge\s*=/m.test(flow)],
  ['runtime consumer uses source context operation', /routeSourceFileContextKnowledgeOperation\.resolve\(sourceFilePath\)/.test(consumer)],
  ['runtime consumer does not import legacy source context function', !/import\s*\{\s*routeSourceFileContextKnowledge\s*\}/.test(consumer)],
  ['upstream complete/blocked manifest contract is not shadowed', /ManifestBuilderJudgment/.test(read('packages/core/src/types/upstream/PHASE2825_FULLY_TYPED_RUNTIME_SCANNER_MANIFEST_TRACE.md'))],
  ['upstream collections remains empty', fs.statSync(path.join(root, 'packages/core/src/types/upstream/collections.ts')).size === 0],
];
let failed = 0;
console.log('Phase 2828 — Route dataflow domain operation audit');
for (const [label, ok] of checks) { console.log(`${ok ? 'PASS' : 'FAIL'} ${label}`); if (!ok) failed++; }
console.log(`${checks.length - failed}/${checks.length} checks passed`);
if (failed) process.exitCode = 1;
