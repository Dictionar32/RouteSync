const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const read = relative => fs.readFileSync(path.join(root, relative), 'utf8');
const routeComposition = read('packages/core/src/compiler/scanner/upstream/routeDeclarationComposition.ts');
const schemaContract = read('packages/core/src/types/upstream/controllerActionSchemaSemanticJudgmentInterface.ts');
const schemaAuthority = read('packages/core/src/types/upstream/controllerActionSchemaSemanticJudgmentAuthority.ts');
const correlationAuthority = read('packages/core/src/types/upstream/laravelControllerActionRouteCorrelationAuthority.ts');
const manifestBuilder = read('packages/core/src/compiler/scanner/wiring/upstreamManifestBuilder.ts');
const cliScan = read('packages/cli/src/commands/scan.ts');
const cliSync = read('packages/cli/src/commands/sync.ts');
const collections = fs.readFileSync(path.join(root, 'packages/core/src/types/upstream/collections.ts'));
const relationsDir = path.join(root, 'packages/core/src/semantic/relations');
const controllerReferenceArm = routeComposition.match(/case 'controller_reference': \{([\s\S]*?)\n            \}/);
const firstOutput = source => Math.min(...['writeFileSync(', 'writeJson(', 'manifestGeneratorOperations.save('].map(token => {
  const index = source.indexOf(token);
  return index < 0 ? Number.POSITIVE_INFINITY : index;
}));
const scanGate = cliScan.indexOf('const completeManifest = scannedManifest.continueForDriftAudit');
const syncGate = cliSync.indexOf('const completeManifest = scannedManifest.continueForDriftAudit');
const checks = {
  controllerReferenceUsesSchemaEvidenceDomainOperation: Boolean(controllerReferenceArm && /schema: schemaProjection\.schema/.test(controllerReferenceArm[1]) && /schemaEvidence: schemaProjection\.schemaEvidence/.test(controllerReferenceArm[1])),
  controllerReferenceDoesNotUseGenericSameBranchVisitor: Boolean(controllerReferenceArm && !/schemaEvidence\.continueWith\(/.test(controllerReferenceArm[1])),
  controllerReferenceRetainsOriginalSchemaEvidence: Boolean(controllerReferenceArm && /schemaEvidence,/.test(controllerReferenceArm[1])),
  schemaEvidenceAvailableArmOwnsCanonicalSchema: /continueToSchema: \(\) => derivation\.schema/.test(schemaAuthority),
  schemaEvidenceUnavailableArmOwnsExplicitEmptySchemaProjection: /continueToSchema: emptyRouteSchemaPayload/.test(schemaAuthority),
  availableEvidenceRetainsSourceIdentityAndOrigin: /sourceIdentity: input\.sourceIdentity/.test(schemaAuthority) && /schemaOrigin: derivation\.kind/.test(schemaAuthority),
  unavailableEvidenceRetainsTypedReason: /reason,/.test(schemaAuthority) && /continueToRouteBoundarySchema: \(\) => Object\.freeze\(\{ schema: emptyRouteSchemaPayload\(\), schemaEvidence: evidence \}\)/.test(schemaAuthority) && !/continueWith: <Result>/.test(schemaAuthority),
  correlationMatchedOutcomeRetainsPublicationAndSchemaEvidence: /kind: 'matched_action_judgment',[\s\S]*?publication: first,[\s\S]*?first\.judgment\.semantic\.schemaEvidence/.test(correlationAuthority),
  ambiguousAndInvalidCorrelationRemainExplicit: /ambiguous_action_judgments/.test(correlationAuthority) && /invalid_action_judgment_publication/.test(correlationAuthority),
  manifestBuilderStillCarriesBlockedProjection: /kind: 'manifest_builder_blocked'[\s\S]*?projection: blockedProjection/.test(manifestBuilder),
  cliScanBlockedGatePrecedesOutputWrites: scanGate >= 0 && scanGate < firstOutput(cliScan) && /manifestBlocked: judgment =>[\s\S]*?process\.exit\(1\)/.test(cliScan),
  cliSyncBlockedGatePrecedesOutputWrites: syncGate >= 0 && syncGate < firstOutput(cliSync) && /manifestBlocked: judgment =>[\s\S]*?process\.exit\(1\)/.test(cliSync),
  noDeletedRelationFoundationRestoration: !['relationMembership.ts', 'relationalSequence.ts', 'semanticRelations.ts'].some(name => fs.existsSync(path.join(relationsDir, name))),
  protectedCollectionsInvariantStillOneNewlineByte: collections.length === 1 && collections[0] === 10,
};
const failed = Object.entries(checks).filter(([, pass]) => !pass);
const result = {
  phase: 3065,
  title: 'Fully Explicit Typed Runtime Scanner Operations — route schema evidence domain continuation',
  status: failed.length ? 'FAIL' : 'PASS',
  passed: Object.keys(checks).length - failed.length,
  total: Object.keys(checks).length,
  checks,
  runtimeTrace: [
    'PHP route/controller reference → controller/action identity correlation',
    'ControllerActionJudgmentRouteSelection → available or unavailable RouteRequestSchemaEvidence',
    'RouteRequestSchemaEvidence.continueToRouteBoundarySchema() → schema + exact evidence projection',
    'RouteBoundaryContract retains the schema and the same schemaEvidence provenance through the domain projection',
    'ManifestBuilderInterface.build() → complete | blocked manifest judgment',
    'CLI scan/sync blocked judgment gates precede output writes',
  ],
  verification: {
    structuralAudit: failed.length ? 'FAIL' : 'PASS',
    endToEndPhpCliManifestFixture: 'NOT_RUN',
    strictTypeScript: 'NOT_RUN_IN_THIS_PHASE; repository has known pre-existing type errors',
    globalPrimitiveElimination: 'NOT_CLAIMED',
  },
  remainingRisks: [
    'This migration removes a redundant generic continuation call in one runtime consumer; it does not eliminate generic continueWith operations from the upstream schema evidence model globally.',
    'Unavailable schema evidence intentionally projects an empty schema payload while retaining an explicit reason in schemaEvidence; downstream manifest consumers must continue preserving that evidence.',
    'Structural source checks do not prove an executed PHP → CLI → manifest/IR runtime.',
  ],
};
for (const [name, pass] of Object.entries(checks)) console.log(`${pass ? 'PASS' : 'FAIL'} ${name}`);
console.log(`${result.passed}/${result.total} checks passed`);
console.log(JSON.stringify(result, null, 2));
fs.writeFileSync(path.join(root, 'PHASE3065_ROUTE_SCHEMA_EVIDENCE_DOMAIN_CONTINUATION_AUDIT.json'), `${JSON.stringify(result, null, 2)}\n`);
if (failed.length) process.exit(1);
