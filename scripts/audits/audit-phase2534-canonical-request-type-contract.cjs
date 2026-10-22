const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const read = relative => fs.readFileSync(path.join(root, relative), 'utf8');
const checks = [];
const check = (name, passed, detail) => checks.push({ name, passed: Boolean(passed), detail });

const contractPath = 'packages/core/src/types/upstream/requestTypeDerivationInterface.ts';
const contractSource = read(contractPath);
const projectionSource = read('packages/core/src/compiler/scanner/wiring/routeManifestProjection.ts');
const projectionAuthoritySource = read('packages/core/src/compiler/scanner/wiring/routeManifestProjectionAuthority.ts');
const loweringAuthoritySource = read('packages/core/src/compiler/scanner/wiring/routeManifestTypeLoweringAuthority.ts');
const assemblerSource = read('packages/core/src/compiler/semantic/request-type-derivation/requestTypeDerivationSemanticPipelineAssembler.ts');
const productionCompositionSource = read('packages/core/src/compiler/semantic/request-type-derivation/requestTypeDerivationProductionComposition.ts');

const lawBlock = contractSource.match(/export const REQUEST_TYPE_DERIVATION_LAW_IDS = \[([\s\S]*?)\] as const;/);
const lawIds = lawBlock ? [...lawBlock[1].matchAll(/'([^']+)'/g)].map(match => match[1]) : [];
const obligationBlock = contractSource.match(/export const REQUEST_TYPE_DERIVATION_LAW_OBLIGATIONS = Object\.freeze\(\{([\s\S]*?)\}\s*satisfies Readonly<Record<RequestTypeDerivationLawId, RequestTypeDerivationLawObligation>>\);/);
const obligationIds = obligationBlock ? [...obligationBlock[1].matchAll(/^\s{2}([a-z_]+):\s*\{/gm)].map(match => match[1]) : [];
const contractStart = contractSource.indexOf('export const requestTypeDerivationContract: RequestTypeDerivationContract = Object.freeze({');
const contractEnd = contractSource.indexOf('/** @deprecated Transitional runtime-facing shape.', contractStart);
const canonicalValue = contractStart >= 0 ? contractSource.slice(contractStart, contractEnd < 0 ? undefined : contractEnd) : '';
const lawCoverageBlock = canonicalValue.match(/laws: Object\.freeze\(\{([\s\S]*?)\}\),/);
const coveredLawIds = lawCoverageBlock ? [...lawCoverageBlock[1].matchAll(/^\s{4}([a-z_]+): 'required',?$/gm)].map(match => match[1]) : [];

check('canonical-law-inventory-is-closed-and-unique', lawIds.length === 34 && new Set(lawIds).size === 34, `law IDs=${lawIds.length}; unique=${new Set(lawIds).size}`);
check('each-canonical-law-has-one-explicit-witness-obligation', obligationIds.length === lawIds.length && new Set(obligationIds).size === obligationIds.length && lawIds.every(law => obligationIds.includes(law)), `law IDs=${lawIds.length}; obligations=${obligationIds.length}`);
check('canonical-contract-requires-exactly-the-full-law-inventory', coveredLawIds.length === lawIds.length && new Set(coveredLawIds).size === coveredLawIds.length && lawIds.every(law => coveredLawIds.includes(law)), `law IDs=${lawIds.length}; required coverage entries=${coveredLawIds.length}`);
check('canonical-contract-is-upstream-owned-and-closed', /export interface RequestTypeDerivationContract/.test(contractSource) && /authority: 'upstream'/.test(canonicalValue) && /closed: true/.test(canonicalValue) && /reasoning: 'declarative_source_relation_closure'/.test(canonicalValue), 'existing upstream contract is the canonical authority; no parallel contract introduced');
check('canonical-policy-defines-all-semantic-domains', ['requestResolution:', 'resourceIdentity:', 'groupIdentity:', 'actionContribution:', 'responseContribution:', 'groupContribution:', 'outcomeCoherence:', 'closure:'].every(member => canonicalValue.includes(member)), 'all eight policy domains are present');
check('assembler-connects-existing-typed-capabilities', ['composition.reasoning.infer(input)', 'verifier.verify(inference)', 'composition.decision.decide', 'authorityIntegrityGate.evaluate'].every(token => assemblerSource.includes(token)), 'reasoning → verification → decision → authority integrity');
check('production-composition-does-not-claim-missing-kernel-exists', productionCompositionSource.includes('does not ship concrete production reasoning/verifier/') && productionCompositionSource.includes('fails closed'), 'missing production kernel remains explicit rather than replaced by fabricated proof');
check('active-projection-requires-injected-semantic-pipeline', /pipeline: RequestTypeDerivationSemanticPipelineInterface/.test(projectionSource) && projectionSource.includes('createAuthorityBackedRouteManifestProjection(pipeline)'), 'active projection receives semantic authority through an explicit interface');
check('projection-consumes-closed-derivation-and-preserves-blocked-outcomes', projectionAuthoritySource.includes("case 'derivation_not_projectable':") && loweringAuthoritySource.includes("case 'verification_failed':") && loweringAuthoritySource.includes("case 'authority_inconsistent':") && loweringAuthoritySource.includes('operationPreparation.prepare(preflight.input)'), 'blocked semantic outcomes remain typed and are not converted into fallback RequestType arrays');
check('active-projection-does-not-import-retired-legacy-lowering', !/from ['"]\.\/routeManifestTypeLowering['"]/.test(projectionSource + projectionAuthoritySource + loweringAuthoritySource), 'audit follows current projection/lowering authorities, not retired routeManifestTypeLowering.ts');
check('upstream-contract-path-has-no-forbidden-foundation-or-relation-dependency', !/from ['"][^'\"]*semantic\/(?:foundation|relation)/.test(contractSource), 'upstream contract remains independent of forbidden semantic foundation/relation modules');

for (const result of checks) process.stdout.write(`${result.passed ? 'PASS' : 'FAIL'} ${result.name}: ${result.detail}\n`);
const failed = checks.filter(result => !result.passed);
process.stdout.write(`\nPhase 2534 canonical RequestType contract: ${checks.length - failed.length}/${checks.length} assertions passed.\n`);
if (failed.length) process.exitCode = 1;
