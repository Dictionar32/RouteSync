const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const root = path.resolve(__dirname, '../..');
const read = relative => fs.readFileSync(path.join(root, relative), 'utf8');
const iface = read('packages/core/src/types/upstream/controllerActionSchemaSemanticJudgmentInterface.ts');
const authority = read('packages/core/src/types/upstream/controllerActionSchemaSemanticJudgmentAuthority.ts');
const composition = read('packages/core/src/compiler/scanner/upstream/routeDeclarationComposition.ts');
const test = read('packages/core/src/types/__tests__/controller-action-schema-evidence-continuation-phase-3000.test.ts');
const collections = fs.readFileSync(path.join(root, 'packages/core/src/types/upstream/collections.ts'));
const relationsDir = path.join(root, 'packages/core/src/semantic/relations');
const checks = {
  genericSchemaEvidenceHandlerContractRemoved: !/RouteRequestSchemaEvidenceHandlers/.test(iface + authority),
  availableEvidenceExposesDomainBoundaryProjection: /interface ControllerActionSchemaRouteRequestEvidence[\s\S]*?continueToRouteBoundarySchema: \(\) => RouteRequestSchemaBoundaryProjection/.test(iface),
  unavailableEvidenceExposesDomainBoundaryProjection: /interface RouteRequestSchemaEvidenceUnavailable[\s\S]*?continueToRouteBoundarySchema: \(\) => RouteRequestSchemaBoundaryProjection/.test(iface),
  availableConstructorRetainsCanonicalSchemaAndEvidenceIdentity: /continueToRouteBoundarySchema: \(\) => Object\.freeze\(\{ schema: derivation\.schema, schemaEvidence: routeRequestEvidence \}\)/.test(authority),
  unavailableConstructorRetainsReasonAndEvidenceIdentity: /reason,\s*continueToSchema: emptyRouteSchemaPayload,\s*continueToRouteBoundarySchema: \(\) => Object\.freeze\(\{ schema: emptyRouteSchemaPayload\(\), schemaEvidence: evidence \}\)/.test(authority),
  availableAndUnavailableNoLongerExposeGenericContinueWith: !/readonly continueWith: <Result>/.test(iface),
  routeCompositionUsesSingleBoundaryProjectionForControllerAction: /const schemaProjection = target\.action\.schemaEvidence\.continueToRouteBoundarySchema\(\)/.test(composition),
  routeCompositionUsesSingleBoundaryProjectionForControllerReference: /const schemaProjection = schemaEvidence\.continueToRouteBoundarySchema\(\)/.test(composition),
  closureTargetUsesUnavailableEvidenceProjection: /routeRequestSchemaEvidenceFactory\.unavailable<SourceFile>\('non_controller_route_target'\)[\s\S]*?continueToRouteBoundarySchema\(\)/.test(composition),
  routeCompositionDoesNotDispatchOnSchemaEvidenceKind: !/schemaEvidence\.kind\s*===/.test(composition),
  regressionTestsAssertEvidenceIdentityAndReason: /boundaryProjection\.schemaEvidence\)\.toBe\(evidence\)/.test(test) && /action_judgment_ambiguous/.test(test) && /sourceIdentity/.test(test),
  manifestBuilderBlockedProjectionStillExists: /kind: 'manifest_builder_blocked'[\s\S]*?projection: blockedProjection/.test(read('packages/core/src/compiler/scanner/wiring/upstreamManifestBuilder.ts')),
  cliScanBlockedGatePrecedesOutputWrites: (() => { const source = read('packages/cli/src/commands/scan.ts'); const gate = source.indexOf('const completeManifest = scannedManifest.continueForDriftAudit'); const writes = Math.min(...['writeFileSync(', 'writeJson(', 'manifestGeneratorOperations.save('].map(token => { const i = source.indexOf(token); return i < 0 ? Number.POSITIVE_INFINITY : i; })); return gate >= 0 && gate < writes && /manifestBlocked: judgment =>[\s\S]*?process\.exit\(1\)/.test(source); })(),
  cliSyncBlockedGatePrecedesOutputWrites: (() => { const source = read('packages/cli/src/commands/sync.ts'); const gate = source.indexOf('const completeManifest = scannedManifest.continueForDriftAudit'); const writes = Math.min(...['writeFileSync(', 'writeJson(', 'manifestGeneratorOperations.save('].map(token => { const i = source.indexOf(token); return i < 0 ? Number.POSITIVE_INFINITY : i; })); return gate >= 0 && gate < writes && /manifestBlocked: judgment =>[\s\S]*?process\.exit\(1\)/.test(source); })(),
  deletedRelationFoundationRemainsAbsent: !['relationMembership.ts', 'relationalSequence.ts', 'semanticRelations.ts'].some(name => fs.existsSync(path.join(relationsDir, name))),
  protectedCollectionsInvariantOneNewlineByte: collections.length === 1 && collections[0] === 10,
};
const failed = Object.entries(checks).filter(([, pass]) => !pass);
const regression = spawnSync(process.execPath, [path.join(root, 'scripts/audits/audit-phase3066-route-schema-boundary-projection.cjs')], { cwd: root, encoding: 'utf8' });
const result = {
  phase: 3067,
  title: 'Fully Explicit Typed Runtime Scanner Operations — remove generic route schema evidence continuation',
  status: failed.length === 0 && regression.status === 0 ? 'PASS' : 'FAIL',
  passed: Object.keys(checks).length - failed.length,
  total: Object.keys(checks).length,
  checks,
  phase3066BoundaryProjectionRegression: regression.status === 0 ? 'PASS' : 'FAIL',
  runtimeTrace: [
    'Laravel PHP route/controller source → source-correlated controller action schema judgment',
    'Available schema evidence owns canonical schema and source origin',
    'Unavailable schema evidence owns an explicit absence reason',
    'Both evidence variants expose the domain-specific continueToRouteBoundarySchema operation',
    'The operation projects schema and the exact provenance-bearing evidence as one value',
    'Route boundary → manifest builder complete/blocked judgment → CLI scan/sync terminal gate',
  ],
  verification: {
    structuralAudit: failed.length === 0 && regression.status === 0 ? 'PASS' : 'FAIL',
    phase3066Regression: regression.status === 0 ? 'PASS' : 'FAIL',
    targetedVitest: 'NOT_RUN — Vitest package is incomplete in this workspace; the npx invocation timed out',
    endToEndPhpCliManifestFixture: 'NOT_RUN',
    strictTypeScript: 'NOT_RUN_IN_THIS_PHASE',
    globalPrimitiveElimination: 'NOT_CLAIMED',
  },
  remainingRisks: [
    'This phase removes a generic continuation from route schema evidence only; unrelated ADTs may still have generic continuation APIs.',
    'The full PHP → CLI → manifest/IR path has not been executed as an end-to-end fixture.',
    'The repository-wide strict TypeScript build remains unverified in this phase.',
  ],
};
for (const [name, pass] of Object.entries(checks)) console.log(`${pass ? 'PASS' : 'FAIL'} ${name}`);
console.log(`${result.passed}/${result.total} checks passed`);
console.log(`Phase 3066 boundary projection regression: ${result.phase3066BoundaryProjectionRegression}`);
fs.writeFileSync(path.join(root, 'PHASE3067_SCHEMA_EVIDENCE_DOMAIN_OPERATIONS_AUDIT.json'), `${JSON.stringify(result, null, 2)}\n`);
if (result.status !== 'PASS') process.exit(1);
