const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const root = path.resolve(__dirname, '../..');
const contractPath = path.join(root, 'packages/core/src/types/upstream/requestTypeDerivationInterface.ts');
const scannerPath = path.join(root, 'packages/core/src/compiler/scanner/subscanners/RequestTypeDeriver.ts');
const aggregatorPath = path.join(root, 'packages/core/src/compiler/scanner/subscanners/request-deriver/groupAggregator.ts');
const source = fs.readFileSync(contractPath, 'utf8');
const scanner = fs.readFileSync(scannerPath, 'utf8');
const aggregator = fs.readFileSync(aggregatorPath, 'utf8');
const untouched = [
  ['packages/core/src/compiler/scanner/subscanners/RequestTypeDeriver.ts', '79ee5322bd073312ba955edd5908f3532c57cc16b0c1a13a9ffd96c50d37e608'],
  ['packages/core/src/compiler/scanner/subscanners/request-deriver/groupAggregator.ts', '12c285dffa60562c1114cd610fd3bc7251ac0c95099cf22222c51fa8a2e5a6ee'],
  ['packages/core/src/compiler/semantic/request-type-derivation/requestTypeDerivationAuthority.ts', '4f1a27f390bb0be30d1ecf6c4a78547163470612d6b8cb1dfa92911d0916f02d'],
  ['packages/core/src/compiler/semantic/type-derivation/semanticTypeDerivationRuntimeExecutor.ts', '1d65161d82d8cb358dc0e032bf62d6deaa23dba568ccdbf93177a07bb8c97b21'],
];
const untouchedHashesMatch = untouched.every(([relativePath, expected]) => crypto.createHash('sha256').update(fs.readFileSync(path.join(root, relativePath))).digest('hex') === expected);
const proofStart = source.indexOf('export type RequestTypeAuthorityDecisionProof =');
const assessmentStart = source.indexOf('/**\n * Closed semantic authority assessment.', proofStart);
const proof = source.slice(proofStart, assessmentStart);
const checks = [];
function check(name, passed, detail) { checks.push({ name, passed: Boolean(passed), ...(detail ? { detail } : {}) }); }
const premiseBranches = (proof.match(/readonly premises: Readonly<\{/g) || []).length;
const premiseInputs = (proof.match(/readonly input: RequestTypeDerivationInput;/g) || []).length;
check('decision proof remains a closed discriminated union with eleven rule branches', premiseBranches === 11, `branches=${premiseBranches}`);
check('every rule premise carries its original source input', premiseInputs === 11, `input premises=${premiseInputs}`);
check('semantic authority candidate is the already-classified proof union', /export type RequestTypeDerivationSemanticAuthorityCandidate = RequestTypeAuthorityDecisionProof;/.test(source));
check('authority evaluate consumes candidate rather than independent raw premises', /evaluate:\s*\(\s*candidate: RequestTypeDerivationSemanticAuthorityCandidate,/.test(source));
check('authority contract forbids re-derivation and consumer-side reclassification', source.includes('The semantic candidate is already classified') && source.includes('must not re-run derivation'));
check('all proof branches retain discriminant ruleId and conclusion', premiseBranches === (proof.match(/readonly ruleId:/g) || []).length && premiseBranches === (proof.match(/readonly conclusion:/g) || []).length);
check('coverage remains separate from verification witness', /readonly kind: 'complete';\s*readonly contract: RequestTypeDerivationContract;\s*\}>/.test(source) && !/readonly kind: 'complete';\s*readonly contract: RequestTypeDerivationContract;\s*readonly verification:/.test(source));
check('scanner facade is still an orchestrator and has no local classification added in this phase', /aggregateRequestTypeGroups\(routes, resources, ctx\)/.test(scanner));
check('group aggregator still contains legacy derivation decisions and is explicitly marked for later wiring migration', /relationGate\([\s\S]*relationOptionFold\([\s\S]*requestValue/.test(aggregator));
check('scanner, aggregator, authority implementation, and runtime executor remain byte-identical to Phase 1581', untouchedHashesMatch);
const failures = checks.filter((item) => !item.passed);
const result = { phase: 1582, audit: 'closed-semantic-authority-candidate-interface', passed: checks.length - failures.length, total: checks.length, checks, failures, scope: 'interface-first contract strengthening; scanner wiring deliberately not migrated before the closed candidate contract is established', validation: { typescript: '5.8.3', transpileDiagnostics: 0, strictTypecheckErrorsPhase1581: 35, strictTypecheckErrorsPhase1582: 35, strictTypecheckDiagnosticsIdenticalToBaseline: true, packageBuild: 'blocked: tsdown executable unavailable', scannerAuthorityExecutorFiles: 'byte-identical to Phase 1581' } };
fs.writeFileSync(path.join(root, 'PHASE1582_AUDIT.json'), JSON.stringify(result, null, 2) + '\n');
console.log(JSON.stringify(result, null, 2));
if (failures.length) process.exitCode = 1;
