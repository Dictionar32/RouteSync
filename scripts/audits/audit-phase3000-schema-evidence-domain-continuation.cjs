const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const read = relative => fs.readFileSync(path.join(root, relative), 'utf8');
const exists = relative => fs.existsSync(path.join(root, relative));
const checks = [];
const check = (name, condition) => checks.push({ name, passed: Boolean(condition) });

const evidenceInterface = read('packages/core/src/types/upstream/controllerActionSchemaSemanticJudgmentInterface.ts');
const authority = read('packages/core/src/types/upstream/controllerActionSchemaSemanticJudgmentAuthority.ts');
const correlation = read('packages/core/src/types/upstream/laravelControllerActionRouteCorrelationAuthority.ts');
const composition = read('packages/core/src/compiler/scanner/upstream/routeDeclarationComposition.ts');
const upstreamBarrel = read('packages/core/src/types/upstream/index.ts');
const coreBarrel = read('packages/core/src/index.ts');
const test = read('packages/core/src/types/__tests__/controller-action-schema-evidence-continuation-phase-3000.test.ts');

check('available schema evidence owns continueWith domain operation', /interface ControllerActionSchemaRouteRequestEvidence[\s\S]*?continueWith: <Result>/.test(evidenceInterface));
check('unavailable schema evidence owns continueWith domain operation', /interface RouteRequestSchemaEvidenceUnavailable[\s\S]*?continueWith: <Result>/.test(evidenceInterface));
check('visitor has separate available and unavailable continuations', /interface RouteRequestSchemaEvidenceHandlers[\s\S]*?onAvailable:[\s\S]*?onUnavailable:/.test(evidenceInterface));
check('schema authority contract version matches v7', /contractVersion: 7/.test(evidenceInterface) && /contractVersion: 7/.test(authority));
check('available evidence continuation dispatches to onAvailable', /continueWith: <Result>\(handlers: RouteRequestSchemaEvidenceHandlers<SourceFile, Result>\): Result => handlers\.onAvailable\(routeRequestEvidence\)/.test(authority));
check('canonical unavailable factory dispatches to onUnavailable', /continueWith: <Result>\(handlers: RouteRequestSchemaEvidenceHandlers<TSourceIdentity, Result>\): Result => handlers\.onUnavailable\(evidence\)/.test(authority));
check('unavailable evidence construction is centralized in correlation', /routeRequestSchemaEvidenceFactory\.unavailable<SourceFile>\(reason\)/.test(correlation));
check('route composition consumes evidence through its domain continuation', /schemaEvidence\.continueWith\(\{\s*onAvailable:[\s\S]*?onUnavailable:/.test(composition));
check('upstream barrel exports evidence continuation contracts and factory', /RouteRequestSchemaEvidenceFactoryInterface/.test(upstreamBarrel) && /routeRequestSchemaEvidenceFactory/.test(upstreamBarrel));
check('core public barrel exports evidence continuation contracts and factory', /RouteRequestSchemaEvidenceFactoryInterface/.test(coreBarrel) && /routeRequestSchemaEvidenceFactory/.test(coreBarrel));
check('focused tests cover available and unavailable outcomes', /continues available evidence/.test(test) && /continues unavailable evidence/.test(test));
check('no scattered unavailable-evidence object literals remain', !/Object\.freeze\(\{\s*kind: 'route_request_schema_evidence_unavailable'/.test(correlation + composition) && !/Object\.freeze\(\{\s*kind: 'route_request_schema_evidence_unavailable'/.test(read('packages/core/src/compiler/scanner/operations/domain-model/request/controllerActionDescriptor.ts')));
check('upstream collections remains intentionally empty', fs.statSync(path.join(root, 'packages/core/src/types/upstream/collections.ts')).size === 0);
check('removed relation foundation modules remain absent', !exists('packages/core/src/semantic/relations/relationMembership.ts') && !exists('packages/core/src/semantic/relations/relationalSequence.ts') && !exists('packages/core/src/semantic/relations/semanticRelations.ts'));
const runtimeFiles = [
  'packages/core/src/compiler/scanner/upstream/routeDeclarationComposition.ts',
  'packages/core/src/types/upstream/controllerActionSchemaSemanticJudgmentAuthority.ts',
  'packages/core/src/types/upstream/laravelControllerActionRouteCorrelationAuthority.ts',
  'packages/cli/src/generators/ManifestGenerator.ts',
  'packages/cli/src/generators/ManifestSerializer.ts',
];
check('no export function declarations in the traced runtime modules', runtimeFiles.every(file => !/\bexport\s+function\s+\w+\s*\(/.test(read(file))));

for (const item of checks) console.log(`${item.passed ? 'PASS' : 'FAIL'} ${item.name}`);
const failed = checks.filter(item => !item.passed);
console.log(`RESULT ${checks.length - failed.length}/${checks.length}`);
if (failed.length) process.exitCode = 1;
