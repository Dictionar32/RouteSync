#!/usr/bin/env node
'use strict';
const fs = require('node:fs');
const path = require('node:path');
const ts = require('/opt/nvm/versions/node/v22.16.0/lib/node_modules/typescript/lib/typescript.js');
const root = path.resolve(__dirname, '../..');
const upstream = path.join(root, 'packages/core/src/types/upstream');
const checks = [];
function check(name, ok, detail = '') { checks.push({ name, passed: Boolean(ok), detail }); }
function read(relative) { return fs.readFileSync(path.join(root, relative), 'utf8'); }
const iface = read('packages/core/src/types/upstream/phpSourceInvocationSemanticPipelineInterface.ts');
const authority = read('packages/core/src/types/upstream/phpSourceInvocationSemanticPipelineAuthority.ts');
const integration = read('packages/core/src/types/upstream/phpSourceInvocationSemanticPipelineIntegration.ts');
const binding = read('packages/core/src/types/upstream/phpSourceInvocationSemanticSourceBindingAuthority.ts');
const invocation = read('packages/core/src/types/upstream/laravelControllerInvocationSemanticJudgmentAuthority.ts');
const test = read('packages/core/src/compiler/scanner/operations/controller/controllerHasMiddleware.phase900.test.ts');
check('pipeline result handlers define complete and blocked continuations', /onComplete:.*PhpSourceInvocationSemanticPipelineComplete/s.test(iface) && /onBlocked:.*PhpSourceInvocationSemanticPipelineBlocked/s.test(iface));
check('pipeline result ADT exposes continueWith', /PhpSourceInvocationSemanticPipelineCompletePayload & PhpSourceInvocationSemanticPipelineTerminalOperations/.test(iface) && /PhpSourceInvocationSemanticPipelineBlockedPayload & PhpSourceInvocationSemanticPipelineTerminalOperations/.test(iface));
check('composition evidence exposes domain continuation', /PhpSourceInvocationSemanticPipelineCompositionEvidenceOperations/.test(iface) && /onNotConnected/.test(iface) && /onConnected/.test(iface) && /onSourceBindingRejected/.test(iface));
check('pipeline contract type/runtime version both 3', /readonly version: 3/.test(iface) && /kind: 'php_source_invocation_semantic_pipeline_contract',[\s\S]*?version: 3/.test(iface));
check('blocked result factory binds onBlocked', /handlers\.onBlocked\(judgment\)/.test(authority));
check('complete result factory binds onComplete', /handlers\.onComplete\(judgment\)/.test(authority));
check('pipeline completion constructor uses operational factory', /return completed\(\{[\s\S]*?php_source_invocation_semantic_pipeline_complete/.test(authority));
check('connected pipeline integration consumes continueWith', /pipelineResult\.continueWith/.test(integration) && !/switch\s*\(evidence\.sourceBinding\.pipelineResult\.kind\)/.test(integration));
check('integration dispatch consumes composition ADT continuation', /evidence\.continueWith<PhpSourceInvocationSemanticPipelineIntegrationResult>/.test(integration) && !/switch\s*\(evidence\.kind\)/.test(integration));
check('source identity binding consumes identity judgment continuation', /identityJudgment\.continueWith<PhpSourceInvocationSemanticSourceBindingJudgment>/.test(binding) && !/switch\s*\(identityJudgment\.kind\)/.test(binding));
check('connected composition evidence owns continuation operation', /handlers\.onConnected\(evidence\)/.test(binding));
check('rejected composition evidence owns continuation operation', /handlers\.onSourceBindingRejected\(evidence\)/.test(binding));
check('not-connected composition evidence owns continuation operation', /handlers\.onNotConnected\(evidence\)/.test(invocation));
check('not-connected runtime path uses operational evidence', /integration\.project\(notConnectedPipelineEvidence\(\)\)/.test(invocation));
check('test fixture updated to use operational evidence', /evidence: notConnectedPipelineEvidence\(\)/.test(test));
check('no exported function declaration in touched runtime modules', ![iface, authority, integration, binding, invocation].some(source => /^export\s+function\s/m.test(source)));
check('collections.ts remains intentionally empty', fs.statSync(path.join(upstream, 'collections.ts')).size === 0);
const forbidden = [
  'packages/core/src/semantic/relations/relationMembership.ts',
  'packages/core/src/semantic/relations/relationalSequence.ts',
  'packages/core/src/semantic/relations/semanticRelations.ts',
];
check('removed relation foundation files remain absent', forbidden.every(relative => !fs.existsSync(path.join(root, relative))));
const syntaxFiles = [
  'packages/core/src/types/upstream/phpSourceInvocationSemanticPipelineInterface.ts',
  'packages/core/src/types/upstream/phpSourceInvocationSemanticPipelineAuthority.ts',
  'packages/core/src/types/upstream/phpSourceInvocationSemanticPipelineIntegrationInterface.ts',
  'packages/core/src/types/upstream/phpSourceInvocationSemanticPipelineIntegration.ts',
  'packages/core/src/types/upstream/phpSourceInvocationSemanticSourceBindingAuthority.ts',
  'packages/core/src/types/upstream/laravelControllerInvocationSemanticJudgmentAuthority.ts',
  'packages/core/src/compiler/scanner/operations/controller/controllerHasMiddleware.phase900.test.ts',
];
const syntax = [];
for (const relative of syntaxFiles) {
  const source = read(relative);
  const result = ts.transpileModule(source, { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext }, reportDiagnostics: true });
  const diagnostics = (result.diagnostics || []).map(d => ts.flattenDiagnosticMessageText(d.messageText, ' '));
  syntax.push({ file: relative, diagnosticCount: diagnostics.length, diagnostics });
}
check('syntax transpilation has zero diagnostics', syntax.every(entry => entry.diagnosticCount === 0), `${syntax.length} files checked`);
const result = { phase: 3006, audit: 'operational-pipeline-adt', passed: checks.filter(c => c.passed).length, total: checks.length, checks, syntax };
fs.writeFileSync(path.join(root, 'PHASE3006_AUDIT.json'), JSON.stringify(result, null, 2) + '\n');
fs.writeFileSync(path.join(root, 'PHASE3006_AUDIT.log'), checks.map(c => `${c.passed ? 'PASS' : 'FAIL'} ${c.name}${c.detail ? ` — ${c.detail}` : ''}`).join('\n') + `\n\n${result.passed}/${result.total} structural checks passed. Syntax: ${syntax.length} files, ${syntax.reduce((n, e) => n + e.diagnosticCount, 0)} diagnostics.\n`);
fs.writeFileSync(path.join(root, 'PHASE3006_SYNTAX_CHECK.json'), JSON.stringify({ files: syntax, totalFiles: syntax.length, totalDiagnostics: syntax.reduce((n, e) => n + e.diagnosticCount, 0) }, null, 2) + '\n');
console.log(`${result.passed}/${result.total} structural checks passed`);
for (const c of checks.filter(c => !c.passed)) console.log(`FAIL ${c.name}${c.detail ? ` — ${c.detail}` : ''}`);
console.log(`Syntax: ${syntax.length} files, ${syntax.reduce((n, e) => n + e.diagnosticCount, 0)} diagnostics`);
process.exitCode = result.passed === result.total ? 0 : 1;
