const fs = require('node:fs');
const path = require('node:path');
const root = process.cwd();
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
const exists = file => fs.existsSync(path.join(root, file));

const sourceRoots = ['packages/core/src', 'packages/cli/src', 'packages/sdk/src', 'packages/react/src', 'examples/ecommerce-shop-source'];
const excluded = /(?:^|\/)(?:__tests__|tests?|docs|audits|reports)(?:\/|$)|\.(?:test|spec)\.[cm]?[jt]sx?$/;
const files = [];
const walk = relative => {
  const absolute = path.join(root, relative);
  if (!fs.existsSync(absolute)) return;
  for (const entry of fs.readdirSync(absolute, { withFileTypes: true })) {
    const child = `${relative}/${entry.name}`;
    if (excluded.test(child)) continue;
    if (entry.isDirectory()) walk(child);
    else if (/\.[cm]?[jt]sx?$/.test(entry.name)) files.push(child);
  }
};
sourceRoots.forEach(walk);
const sourceText = new Map(files.map(file => [file, read(file)]));
const candidateContracts = [
  {
    name: 'ValidationRuleDefinition',
    declaration: 'packages/core/src/types/upstream/request.ts',
    canonicalAlternative: 'CanonicalRouteValidationRuleEntry -> RouteSemanticFlowValidationRuleSet -> RequestField.validation (ValidationRuleNode ADT)',
    disposition: 'preserve_unwired_candidate',
    rationale: 'The active scanner pipeline already emits canonical typed validation nodes. No producer/consumer for this separate definition was found; wiring it in would risk a second validation authority.',
  },
  {
    name: 'ControllerExpressionFact',
    declaration: 'packages/core/src/types/upstream/controller.ts',
    canonicalAlternative: 'ControllerSemanticVariableFlow and canonical Expression AST/dataflow facts',
    disposition: 'preserve_unwired_candidate',
    rationale: 'No production consumer was found. Do not add a parallel expression-fact producer until an actual missing semantic distinction is demonstrated.',
  },
  {
    name: 'ExpressionDefinition',
    declaration: 'packages/core/src/types/upstream/expression.ts',
    canonicalAlternative: 'Expression AST nodes with SourceSpan provenance and semantic dataflow identities',
    disposition: 'preserve_unwired_candidate',
    rationale: 'No production consumer was found. Its expression-plus-source tuple may overlap existing AST provenance; keep it public and unmodified pending a semantic need.',
  },
  {
    name: 'SchemaRelationTarget',
    declaration: 'packages/core/src/types/upstream/schemaRelation.ts',
    canonicalAlternative: 'SchemaRelationInterface / SchemaRelationIndexInterface -> StructuralSemanticRelation -> GraphEdgeRelation',
    disposition: 'preserve_unwired_candidate',
    rationale: 'No production consumer was found, while active schema relation indexing and graph projection already exist. Do not wire a second table/model tuple without a missing target identity requirement.',
  },
];
const occurrences = (symbol, sourceMap) => [...sourceMap.entries()]
  .map(([file, content]) => ({ file, count: (content.match(new RegExp(`\\b${symbol}\\b`, 'g')) || []).length }))
  .filter(item => item.count > 0);
const checks = [];
const check = (name, ok) => checks.push({ name, ok: Boolean(ok) });

for (const contract of candidateContracts) {
  const declarationSource = read(contract.declaration);
  const declarationExists = new RegExp(`\\b(?:type|interface)\\s+${contract.name}\\b`).test(declarationSource);
  const refs = occurrences(contract.name, sourceText);
  const externalRefs = refs.filter(item => item.file !== contract.declaration);
  check(`${contract.name} declaration remains intact`, declarationExists);
  check(`${contract.name} has no production consumer outside its declaration`, externalRefs.length === 0);
}

const sdk = read('packages/sdk/src/defineApi.ts');
const requestTypes = read('packages/core/src/types/request.ts');
const operationProjection = read('packages/core/src/compiler/scanner/wiring/operationIdentityProjection.ts');
const operationAlgebra = read('packages/core/src/types/upstream/operationIdentityCapabilityAlgebra.ts');
const operationAuthority = read('packages/core/src/types/upstream/operationIdentityCapabilityAuthority.ts');
const manifestSerializer = read('packages/cli/src/generators/ManifestSerializer.ts');
const reactHookTypes = read('packages/react/src/hooks/define/hookTypes.ts');
check('SDK RouteDefinition carries OperationIdentityReference as a typed optional contract', /operationIdentity\?: OperationIdentityReference/.test(requestTypes));
check('SDK defineApi narrows required operation identity before attaching query keys', /if \(!route\.operationIdentity\)[\s\S]*?const operationIdentity = route\.operationIdentity;/.test(sdk));
check('SDK defineApi does not cast operation identity to its own contract', !/route\.operationIdentity\s+as\s+OperationIdentityReference/.test(sdk) && !/type OperationIdentityReference/.test(sdk));
check('Operation identity wiring only projects the closed upstream capability', /capability\.identity\.route/.test(operationProjection) && !/route\.method.*derive|infer.*method/i.test(operationProjection));
check('Operation identity authority delegates to the canonical runtime algebra', /algebra\.fromRoute\(input\)/.test(operationAuthority) && /createOperationIdentityCapabilityAuthority/.test(operationAuthority));
check('Operation identity algebra preserves upstream identity and reasoning', /route: input\.identity/.test(operationAlgebra) && /input\.reasoning/.test(operationAlgebra));
check('Manifest serializer forwards the already-resolved route capability', /capability: route\.capability/.test(manifestSerializer));
check('React hook types index the already-closed hookKind capability', /\$def: \{ hookKind: infer K \}/.test(reactHookTypes));
check('Phase 1362 schema-shape ownership audit remains present', exists('scripts/audits/audit-phase1362-canonical-schema-shape-ownership.cjs'));
check('Build script and declared TypeScript 7 version are preserved', JSON.parse(read('package.json')).scripts.build === 'tsdown' && JSON.parse(read('package.json')).devDependencies.typescript === '7.0.2');

const report = {
  phase: 1363,
  audit: 'upstream-contract-closure-and-operation-identity-consumption',
  purpose: 'Separate truly unconsumed upstream type contracts from active identity/capability paths, and remove an unnecessary SDK identity cast without creating artificial consumers.',
  scope: sourceRoots,
  candidateContracts: candidateContracts.map(contract => ({
    ...contract,
    productionOccurrences: occurrences(contract.name, sourceText),
    action: 'Preserve declaration; do not auto-delete or force-wire. Revisit only when a concrete producer/consumer gap is identified.',
  })),
  operationIdentityTrace: [
    'OperationIdentityCapabilityRuntimeAlgebraInterface -> operationIdentityCapabilityAlgebra.fromRoute',
    'operationIdentityCapabilityAuthority -> canonical runtime algebra',
    'operationIdentityProjection -> OperationIdentityReference representation',
    'ManifestSerializer -> serialized capability/reference fields',
    'SDK RouteDefinition.operationIdentity -> defineApi $key / $queryKey',
    'React ClosedHookKind -> $def.hookKind',
  ],
  checks: checks.map(item => ({ name: item.name, ok: item.ok })),
  passedChecks: checks.filter(item => item.ok).length,
  totalChecks: checks.length,
  decision: 'The four zero-consumer candidates remain preserved but explicitly classified. Runtime identity is consumed through a typed reference; the redundant SDK cast was removed. No fake producer/consumer or duplicate semantic authority was introduced.',
  validationLimits: [
    'Static source audit; this does not prove runtime behavior.',
    'Full build remains unverified because this workspace has no local node_modules/tsdown.',
    'TypeScript available globally in prior checks is 5.8.3, while the package declares 7.0.2.',
  ],
};
const reportPath = path.join(root, 'scripts/audits/reports/phase1363-upstream-contract-closure.json');
fs.mkdirSync(path.dirname(reportPath), { recursive: true });
fs.writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`);
const failures = report.checks.filter(item => !item.ok);
console.log(JSON.stringify({ phase: report.phase, audit: report.audit, passed: failures.length === 0, passedChecks: report.passedChecks, totalChecks: report.totalChecks, failures: failures.map(item => item.name), report: path.relative(root, reportPath) }, null, 2));
process.exitCode = failures.length ? 1 : 0;
