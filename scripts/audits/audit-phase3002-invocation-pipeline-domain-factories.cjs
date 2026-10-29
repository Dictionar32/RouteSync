#!/usr/bin/env node
'use strict';
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const runtimePath = path.join(root, 'packages/core/src/types/upstream/invocationSemanticPipeline.ts');
const interfacePath = path.join(root, 'packages/core/src/types/upstream/invocationSemanticPipelineInterface.ts');
const indexPath = path.join(root, 'packages/core/src/index.ts');
const collectionsPath = path.join(root, 'packages/core/src/types/upstream/collections.ts');
const runtime = fs.readFileSync(runtimePath, 'utf8');
const contracts = fs.readFileSync(interfacePath, 'utf8');
const index = fs.readFileSync(indexPath, 'utf8');
const checks = [];
function check(name, condition, detail) { checks.push({ name, passed: Boolean(condition), detail }); }
check('pipeline factory is a named explicit interface', /interface InvocationSemanticPipelineFactoryInterface/.test(contracts));
check('integrated response composition factory is a named explicit interface', /interface InvocationSemanticIntegratedResponseCompositionFactoryInterface/.test(contracts));
check('pipeline runtime export is interface typed and frozen', /export const invocationSemanticPipelineFactory:\s*InvocationSemanticPipelineFactoryInterface\s*=\s*Object\.freeze\(/.test(runtime));
check('integrated composition runtime export is interface typed and frozen', /export const invocationSemanticIntegratedResponseCompositionFactory:\s*InvocationSemanticIntegratedResponseCompositionFactoryInterface\s*=\s*Object\.freeze\(/.test(runtime));
check('production pipeline uses canonical factory operation', /invocationSemanticPipelineFactory\.create\(invocationSemanticAuthority, semanticInterproceduralDataFlowAuthority\)/.test(runtime));
check('production integrated composition uses canonical factory operation', /invocationSemanticIntegratedResponseCompositionFactory\.create\(/.test(runtime));
check('legacy parameterized factory exports removed from runtime source', !/createInvocationSemanticPipeline|createInvocationSemanticIntegratedResponseComposition/.test(runtime));
check('public barrel exports new operation objects', /invocationSemanticPipelineFactory, invocationSemanticPipeline, invocationSemanticIntegratedResponseCompositionFactory, invocationSemanticIntegratedResponseComposition/.test(index));
check('public barrel exports factory interface types', /InvocationSemanticPipelineFactoryInterface/.test(index) && /InvocationSemanticIntegratedResponseCompositionFactoryInterface/.test(index));
check('pipeline contract version reflects factory contract change', /version:\s*62,/.test(contracts));
check('pipeline delegates semantic decisions to existing authorities', /invocationAuthority\.analyze\(input\)/.test(runtime) && /batchAuthority\.analyze\(knowledge\)/.test(runtime));
check('integrated composition retains one canonical knowledge projection', /const knowledge = input\.semanticKnowledgeProjection\.knowledge/.test(runtime));
check('upstream collections remains intentionally empty', fs.statSync(collectionsPath).size === 0);
for (const name of ['relationMembership.ts','relationalSequence.ts','semanticRelations.ts']) {
  check(`removed relation foundation remains absent: ${name}`, !fs.existsSync(path.join(root, 'packages/core/src/semantic/relations', name)));
}
const failed = checks.filter(item => !item.passed);
const report = { phase: 3002, title: 'Interface-First Invocation Pipeline Domain Factories', checksPassed: checks.length - failed.length, checksTotal: checks.length, status: failed.length ? 'failed' : 'passed', checks, caveat: 'Structural source audit only. It does not prove full TypeScript type correctness or Laravel CLI end-to-end behavior.' };
fs.writeFileSync(path.join(root, 'PHASE3002_AUDIT.json'), JSON.stringify(report, null, 2) + '\n');
for (const item of checks) process.stdout.write(`${item.passed ? 'PASS' : 'FAIL'} ${item.name}${item.detail ? ` — ${item.detail}` : ''}\n`);
process.stdout.write(`Phase 3002 audit: ${report.checksPassed}/${report.checksTotal}\n`);
if (failed.length) process.exitCode = 1;
