const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const read = relative => fs.readFileSync(path.join(root, relative), 'utf8');
const iface = read('packages/core/src/types/upstream/controllerActionSchemaSemanticJudgmentInterface.ts');
const authority = read('packages/core/src/types/upstream/controllerActionSchemaSemanticJudgmentAuthority.ts');
const composition = read('packages/core/src/compiler/scanner/upstream/routeDeclarationComposition.ts');
const manifestBuilder = read('packages/core/src/compiler/scanner/wiring/upstreamManifestBuilder.ts');
const cliScan = read('packages/cli/src/commands/scan.ts');
const cliSync = read('packages/cli/src/commands/sync.ts');
const collections = fs.readFileSync(path.join(root, 'packages/core/src/types/upstream/collections.ts'));
const relationsDir = path.join(root, 'packages/core/src/semantic/relations');
const outputIndex = source => Math.min(...['writeFileSync(', 'writeJson(', 'manifestGeneratorOperations.save('].map(token => {
  const index = source.indexOf(token);
  return index < 0 ? Number.POSITIVE_INFINITY : index;
}));
const scanGate = cliScan.indexOf('const completeManifest = scannedManifest.continueForDriftAudit');
const syncGate = cliSync.indexOf('const completeManifest = scannedManifest.continueForDriftAudit');
const controllerActionArm = composition.match(/case 'controller_action': \{([\s\S]*?)\n            \}/);
const controllerReferenceArm = composition.match(/case 'controller_reference': \{([\s\S]*?)\n            \}/);
const closureArm = composition.match(/case 'closure': \{([\s\S]*?)\n            \}/);
const checks = {
  upstreamDefinesBoundaryProjectionWithSchemaAndEvidence: /interface RouteRequestSchemaBoundaryProjection<[\s\S]*?readonly schema: RouteSchemaPayload;[\s\S]*?readonly schemaEvidence: RouteRequestSchemaEvidence/.test(iface),
  availableEvidenceExposesBoundaryProjectionOperation: /interface ControllerActionSchemaRouteRequestEvidence<[\s\S]*?continueToRouteBoundarySchema: \(\) => RouteRequestSchemaBoundaryProjection/.test(iface),
  unavailableEvidenceExposesBoundaryProjectionOperation: /interface RouteRequestSchemaEvidenceUnavailable<[\s\S]*?continueToRouteBoundarySchema: \(\) => RouteRequestSchemaBoundaryProjection/.test(iface),
  availableEvidenceProjectionKeepsCanonicalSchemaAndExactEvidence: /continueToRouteBoundarySchema: \(\) => Object\.freeze\(\{ schema: derivation\.schema, schemaEvidence: routeRequestEvidence \}\)/.test(authority),
  unavailableEvidenceProjectionKeepsEmptySchemaAndExactReasonBearingEvidence: /continueToRouteBoundarySchema: \(\) => Object\.freeze\(\{ schema: emptyRouteSchemaPayload\(\), schemaEvidence: evidence \}\)/.test(authority),
  controllerActionBranchConsumesDomainProjection: Boolean(controllerActionArm && /target\.action\.schemaEvidence\.continueToRouteBoundarySchema\(\)/.test(controllerActionArm[1]) && /schema: schemaProjection\.schema/.test(controllerActionArm[1]) && /schemaEvidence: schemaProjection\.schemaEvidence/.test(controllerActionArm[1])),
  controllerReferenceBranchConsumesDomainProjection: Boolean(controllerReferenceArm && /schemaEvidence\.continueToRouteBoundarySchema\(\)/.test(controllerReferenceArm[1]) && /schema: schemaProjection\.schema/.test(controllerReferenceArm[1]) && /schemaEvidence: schemaProjection\.schemaEvidence/.test(controllerReferenceArm[1])),
  closureBranchConsumesDomainProjection: Boolean(closureArm && /schemaEvidence\.continueToRouteBoundarySchema\(\)/.test(closureArm[1]) && /schema: schemaProjection\.schema/.test(closureArm[1]) && /schemaEvidence: schemaProjection\.schemaEvidence/.test(closureArm[1])),
  boundaryCompositionNoLongerSeparatelyProjectsSchemaPayload: !/schema: (?:target\.action\.schemaEvidence|schemaEvidence)\.continueToSchema\(\)/.test(composition),
  boundaryProjectionDoesNotReclassifyEvidenceWithKindChecks: !/schemaEvidence\.kind\s*===/.test(composition),
  schemaEvidenceStillCarriesAvailableOriginAndSourceIdentity: /sourceIdentity: input\.sourceIdentity/.test(authority) && /schemaOrigin: derivation\.kind/.test(authority),
  unavailableEvidenceStillCarriesTypedReason: /reason,/.test(authority) && /action_judgment_unmatched/.test(iface) && /action_judgment_ambiguous/.test(iface),
  manifestBuilderRetainsBlockedProjection: /kind: 'manifest_builder_blocked'[\s\S]*?projection: blockedProjection/.test(manifestBuilder),
  cliScanBlockedGatePrecedesOutputWrites: scanGate >= 0 && scanGate < outputIndex(cliScan) && /manifestBlocked: judgment =>[\s\S]*?process\.exit\(1\)/.test(cliScan),
  cliSyncBlockedGatePrecedesOutputWrites: syncGate >= 0 && syncGate < outputIndex(cliSync) && /manifestBlocked: judgment =>[\s\S]*?process\.exit\(1\)/.test(cliSync),
  noDeletedRelationFoundationRestoration: !['relationMembership.ts', 'relationalSequence.ts', 'semanticRelations.ts'].some(name => fs.existsSync(path.join(relationsDir, name))),
  protectedCollectionsInvariantStillOneNewlineByte: collections.length === 1 && collections[0] === 10,
};
const failed = Object.entries(checks).filter(([, pass]) => !pass);
const result = {
  phase: 3066,
  title: 'Fully Explicit Typed Runtime Scanner Operations — route schema boundary projection',
  status: failed.length ? 'FAIL' : 'PASS',
  passed: Object.keys(checks).length - failed.length,
  total: Object.keys(checks).length,
  checks,
  runtimeTrace: [
    'PHP route/controller evidence → controller action schema judgment',
    'RouteRequestSchemaEvidence available | unavailable owns continueToRouteBoundarySchema()',
    'Domain operation emits one projection containing schema + the exact evidence object',
    'controller_action | controller_reference | closure route branches consume that projection',
    'RouteBoundaryContract retains schema and provenance-bearing schemaEvidence together',
    'ManifestBuilderInterface.build() → complete | blocked judgment',
    'CLI scan/sync blocked handlers gate output writes',
  ],
  verification: {
    structuralAudit: failed.length ? 'FAIL' : 'PASS',
    changedFilesSyntaxTranspile: 'PASS for the three changed TypeScript files',
    executablePhpCliManifestFixture: 'NOT_RUN',
    strictTypeScript: 'BLOCKED by missing ambient type definitions: chai, deep-eql, estree, fs-extra, jsonfile, node, react; no diagnostics were emitted for the three changed files before type resolution stopped',
    globalPrimitiveElimination: 'NOT_CLAIMED',
  },
  remainingRisks: [
    'This phase consolidates schema and schema evidence into one typed domain projection; it does not prove the entire PHP → CLI → manifest/IR runtime by execution.',
    'Strict TypeScript validation is blocked by missing ambient type definition packages in the workspace; syntax transpilation passed for the changed files.',
    'The repository-wide primitive inventory remains open; parser and serialization boundaries still require explicit, evidence-based review.',
    'Deleted relation foundation modules and the protected one-byte collections.ts invariant are intentionally unchanged.',
  ],
};
for (const [name, pass] of Object.entries(checks)) console.log(`${pass ? 'PASS' : 'FAIL'} ${name}`);
console.log(`${result.passed}/${result.total} checks passed`);
console.log(JSON.stringify(result, null, 2));
fs.writeFileSync(path.join(root, 'PHASE3066_ROUTE_SCHEMA_BOUNDARY_PROJECTION_AUDIT.json'), `${JSON.stringify(result, null, 2)}\n`);
if (failed.length) process.exit(1);
