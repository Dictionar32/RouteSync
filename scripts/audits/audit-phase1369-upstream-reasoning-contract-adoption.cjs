const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '../..');
const read = (relative) => fs.readFileSync(path.join(root, relative), 'utf8');
const checks = [];
const check = (name, condition, detail) => checks.push({ name, passed: Boolean(condition), detail });

const model = read('packages/core/src/types/upstream/model.ts');
const modelRelation = read('packages/core/src/types/upstream/modelRelation.ts');
const modelRelationTest = read('packages/core/src/types/upstream/__tests__/model-relation-identity-alignment.phase1009.test.ts');
const routeCapability = read('packages/core/src/types/upstream/routeCapabilitySemanticAuthority.ts');
const capabilityBoundary = read('packages/core/src/compiler/scanner/resolvers/boundary/capabilityResolution.ts');
const actionRegistry = read('packages/core/src/types/domain/httpVocabulary.ts');
const packageJson = JSON.parse(read('package.json'));

check('canonical relation identity ADT exists',
  model.includes('export type ModelSemanticRelationIdentity =') &&
  model.includes('export const modelSemanticRelationIdentityOf') &&
  model.includes('export const modelSemanticRelationIdentityKey'),
  'The existing upstream identity type and key function are the canonical identity authority.');
check('relation evidence is converted to canonical identity',
  modelRelation.includes('semanticIdentityForEvidence') &&
  modelRelation.includes('modelSemanticRelationIdentityOf({') &&
  modelRelation.includes('foreignKey: relation.key'),
  'Eloquent evidence is normalized into the same typed identity shape as semantic relations.');
check('relation alignment uses canonical identity key',
  modelRelation.includes('modelSemanticRelationIdentityKey(semanticIdentityForEvidence(relation))') &&
  modelRelation.includes('modelSemanticRelationIdentityKey(candidate.identity) === identityKey'),
  'Alignment compares canonical identity rather than repeating field-by-field matching logic.');
check('duplicated relation field matching removed',
  !/candidate\.(sourceModel|property|relation|targetModel|eloquentType)\.value\.value\s*===\s*relation\./.test(modelRelation),
  'The weaker independent identity classifier no longer checks a partial field subset.');
check('foreign-key identity participates in alignment',
  model.includes("identity.foreignKey.kind === 'explicit_foreign'") &&
  modelRelation.includes('foreignKey: relation.key'),
  'Relations with the same names but different foreign-key identity do not silently align.');
check('alignment test retains order-independent mapping',
  modelRelationTest.includes('aligns semantic relations by identity instead of array position') &&
  modelRelationTest.includes('[paymentSemantic, orderSemantic]'),
  'Semantic relations remain aligned by identity when their array order differs.');
check('foreign-key mismatch regression test exists',
  modelRelationTest.includes('different foreign key') &&
  modelRelationTest.includes('expected exactly one semantic relation, found 0'),
  'A relation with a mismatched canonical foreign-key identity is rejected.');
check('route action ADT remains the capability evidence',
  /readonly actionKind:\s*RouteActionKind/.test(routeCapability) &&
  !/readonly isMutating:\s*boolean/.test(routeCapability),
  'The evidence contract no longer accepts a weaker boolean duplicate beside RouteActionKind.');
check('mutability derives from canonical action registry',
  routeCapability.includes("import { ROUTE_ACTION_KIND_REGISTRY } from '../domain/httpVocabulary'") &&
  routeCapability.includes('ROUTE_ACTION_KIND_REGISTRY[input.actionKind].isMutating'),
  'Hook, payload, and default error behavior derive from the action ADT registry.');
check('no raw mutability input is consumed',
  !routeCapability.includes('input.isMutating') &&
  !capabilityBoundary.includes('isMutating: basics.resolvedIsMutating'),
  'The upstream authority cannot receive a contradictory mutability boolean from its adapter.');
check('derived mutability is reused consistently',
  routeCapability.includes('resolveHookKind(isMutating)') &&
  routeCapability.includes('hasPayload(isMutating, input.schema)') &&
  routeCapability.includes('defaultErrors(input, isMutating, validation)'),
  'The single derived value is reused instead of recomputed at separate call sites.');
check('canonical reconciliation authority remains upstream',
  exists('packages/core/src/types/upstream/semanticReconciliationAuthority.ts') &&
  exists('packages/core/src/types/upstream/semanticReconciliationAlgebra.ts'),
  'Relation applicability and schema reconciliation remain owned by their canonical upstream authority/algebra.');
check('route-domain judgment remains proof-carrying',
  read('packages/core/src/types/upstream/routeDomainAuthority.ts').includes('RouteDomainResolutionJudgment') &&
  read('packages/core/src/types/upstream/routeDomainAuthority.ts').includes('candidates'),
  'Domain inference remains an explicit upstream judgment with candidate provenance, not downstream fallback.');
check('audit is registered',
  packageJson.scripts['audit:phase1369-upstream-reasoning-contract-adoption'] === 'node scripts/audits/audit-phase1369-upstream-reasoning-contract-adoption.cjs',
  'The upstream-only audit is reproducible through npm run.');

const report = {
  phase: 1369,
  title: 'Upstream Reasoning Contract Adoption',
  scope: 'packages/core/src/types/upstream plus the scanner-to-upstream capability adapter only',
  checks: checks.length,
  passed: checks.filter((item) => item.passed).length,
  failed: checks.filter((item) => !item.passed).length,
  results: checks,
  decisions: [
    { area: 'Model relation identity alignment', decision: 'Adopt ModelSemanticRelationIdentity and modelSemanticRelationIdentityKey; remove partial field-by-field matching.', reason: 'The canonical identity already includes the foreign-key key and is shared with graph provenance.' },
    { area: 'Route capability mutability', decision: 'Use RouteActionKind plus ROUTE_ACTION_KIND_REGISTRY instead of accepting isMutating as a second input fact.', reason: 'A boolean duplicate can contradict the stronger action ADT; derive it once and reuse it.' },
    { area: 'Route-domain inference', decision: 'Keep reasoning inside RouteDomainResolutionJudgment.', reason: 'This is the canonical authority producing ranked candidates and provenance, not duplicate downstream classification.' },
    { area: 'Semantic relation reconciliation', decision: 'Keep applicability inside SemanticReconciliationEvidence and the canonical algebra.', reason: 'The judgment is computed once and passed to candidate/status/schema-evidence consumers.' },
  ],
};
const reportPath = path.join(root, 'scripts/audits/reports/phase1369-upstream-reasoning-contract-adoption.json');
fs.mkdirSync(path.dirname(reportPath), { recursive: true });
fs.writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`);
console.log(JSON.stringify(report, null, 2));
if (report.failed > 0) process.exitCode = 1;

function exists(relative) {
  return fs.existsSync(path.join(root, relative));
}
