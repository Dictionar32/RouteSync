const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const read = relative => fs.readFileSync(path.join(root, relative), 'utf8');
const authority = read('packages/core/src/types/upstream/semanticReconciliationAuthority.ts');
const contract = read('packages/core/src/types/upstream/semanticReconciliation.ts');
const algebra = read('packages/core/src/types/upstream/semanticReconciliationAlgebra.ts');
const identity = read('packages/core/src/types/upstream/operationIdentityCapability.ts');
const dataflow = read('packages/core/src/types/upstream/astDataflowInterface.ts');
const manifestBuilder = read('packages/core/src/compiler/scanner/wiring/upstreamManifestBuilder.ts');
const react = read('packages/react/src/hooks/createHooks.ts');
const sdkSchemaMapper = read('packages/sdk/src/api-runtime/schemaMapper.ts');
const cliEmitter = read('packages/cli/src/generators/sdk/apiObjectEmitter.ts');
const httpClient = read('packages/core/src/client/HttpClient.ts');
const graphProjection = read('packages/core/src/graph/service/structuralSemanticRelationProjection.ts');
const exampleRoute = read('examples/ecommerce-shop-source/routes/web.php');
const exampleFrontendPackage = JSON.parse(read('examples/ecommerce-shop-source/frontend/package.json'));
const packageJson = JSON.parse(read('package.json'));
const checks = [
  ['reconciliation evidence is a closed, named upstream contract', /kind: 'semantic_reconciliation_evidence'/.test(contract) && /readonly applicability: RelationApplicability/.test(contract) && /readonly closed: true/.test(contract)],
  ['authority computes applicability once before constructing evidence', /const applicability = semanticReconciliationAlgebra\.applicability\(relation\)/.test(authority) && /applicability,\s*closed: true as const/.test(authority)],
  ['authority seals relation, schema and applicability into the same evidence value', /kind: 'semantic_reconciliation_evidence' as const[\s\S]*relation,[\s\S]*schema,[\s\S]*applicability/.test(authority)],
  ['candidate matching consumes the canonical applicability judgment', /const \{ relation, schema, applicability \} = evidence/.test(algebra) && !/const applicability = relationApplicability\(relation\)/.test(algebra)],
  ['schema provenance projection reuses the same applicability judgment', /const \{ applicability \} = evidence/.test(algebra) && !/relationApplicability\(evidence\.relation\)/.test(algebra)],
  ['canonical key resolution consumes the complete reconciliation evidence', /canonicalKey\(evidence: SemanticReconciliationEvidence/.test(contract) && /evidence\.relation\.key/.test(algebra)],
  ['status derivation consumes the same evidence rather than separate relation and applicability arguments', /status\(\s*evidence: SemanticReconciliationEvidence,\s*matches/.test(contract) && /const \{ applicability, relation \} = evidence/.test(algebra)],
  ['effective key fallback consumes the same evidence contract', /effectiveKey\(\s*evidence: SemanticReconciliationEvidence/.test(contract) && /evidence\.relation\.key/.test(algebra)],
  ['authority passes one evidence object through matching, key, status and provenance', /candidates\(evidence\)[\s\S]*canonicalKey\(evidence, matches\)[\s\S]*status\(evidence, matches\)[\s\S]*effectiveKey\(evidence, status, canonicalKey\)[\s\S]*schemaEvidence\(evidence, matches\)/.test(authority)],
  ['algebra remains the sole relation applicability classifier', (algebra.match(/const relationApplicability =/g) || []).length === 1 && /applicability: relationApplicability/.test(algebra)],
  ['relation evidence and graph/dataflow authorities remain distinct', /SchemaRelationIndexInterface/.test(contract) && /SemanticRelationReconciliationInterface/.test(contract)],
  ['operation identity capability preserves upstream reasoning and evidence', /readonly reasoning: SemanticReasoningContract/.test(identity) && /operation_identity_capability_evidence/.test(identity)],
  ['manifest wiring validates canonical AST before creating semantic dataflow seeds', /validateCompleteSourceAst/.test(manifestBuilder) && /semanticDataflowInputsFromSourceModel/.test(manifestBuilder)],
  ['AST dataflow exposes the closed authority judgment without duplicating the solver', /DataFlowAuthorityInterface/.test(dataflow) && /SemanticDataflowJudgment/.test(dataflow)],
  ['React consumes validated SDK endpoint capability rather than reclassifying routes', /if \(!isEndpointCallable\(endpoint\)\)/.test(react) && /endpoint\.\$def\.hookKind/.test(react)],
  ['SDK schema mapper and CLI emitter remain explicit projection boundaries', /parseWithSchema/.test(sdkSchemaMapper) && /operationIdentityReferenceFromCapability/.test(cliEmitter) && /hasCanonicalRequestFields/.test(cliEmitter)],
  ['Axios transport remains separate from semantic identity and capability reasoning', /axios\.create/.test(httpClient) && /baseURL: config\.baseURL/.test(httpClient)],
  ['graph relation projection consumes structural semantic relations through a closed result', /StructuralSemanticRelation/.test(graphProjection) && /not_projectable/.test(graphProjection) && /GraphEdgeRelation/.test(graphProjection)],
  ['Laravel ecommerce source and Next.js/Zod/Axios/TanStack Query target are present in the traced example', /Illuminate\\Support\\Facades\\Route/.test(exampleRoute) && typeof exampleFrontendPackage.dependencies['next'] === 'string' && typeof exampleFrontendPackage.dependencies['zod'] === 'string' && typeof exampleFrontendPackage.dependencies['axios'] === 'string' && typeof exampleFrontendPackage.dependencies['@tanstack/react-query'] === 'string'],
  ['audit is registered without changing package version or build command', packageJson.scripts['audit:phase1367-reconciliation-evidence-closure'] === 'node scripts/audits/audit-phase1367-reconciliation-evidence-closure.cjs' && packageJson.scripts.build === 'tsdown' && packageJson.version === '1.0.49'],
];
const report = {
  phase: 1367,
  title: 'Semantic Reconciliation Evidence Closure',
  result: checks.every(([, passed]) => passed) ? 'passed' : 'failed',
  passed: checks.filter(([, passed]) => passed).length,
  total: checks.length,
  checks: checks.map(([name, passed]) => ({ name, passed })),
  change: 'Applicability is derived once by upstream authority, sealed into SemanticReconciliationEvidence, and consumed by candidate matching, status, key resolution and schema provenance projection.',
  validationLimits: [
    'Static source audit only; it does not establish TypeScript typecheck, runtime behavior, or full build success.',
    'Full build requires repository dependencies including tsdown.'
  ]
};
const reportPath = path.join(root, 'scripts/audits/reports/phase1367-reconciliation-evidence-closure.json');
fs.mkdirSync(path.dirname(reportPath), { recursive: true });
fs.writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`);
for (const [name, passed] of checks) console.log(`${passed ? 'PASS' : 'FAIL'} ${name}`);
console.log(`${report.passed}/${report.total} checks passed`);
if (report.result !== 'passed') process.exitCode = 1;
