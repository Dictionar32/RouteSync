const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const contractPath = path.join(root, 'packages/core/src/types/upstream/semanticDecisionInterface.ts');
const source = fs.readFileSync(contractPath, 'utf8');
const required = [
  'SemanticDecisionPolicyContract',
  'SemanticDecisionEvidencePacket',
  'snapshotIdentity',
  'SemanticDecisionPremiseWitness',
  'SemanticDecisionSubstitutionEntry',
  'SemanticDecisionAuthorityProof',
  'SemanticDecisionAuthorityProofVerification',
  'SemanticDecisionVariableTerm',
  'ruleSetIdentity',
  'factSetIdentity',
  'structural_unification',
  'verifyAssessment',
  'decision_conflict',
  'decision_incomplete',
  'rejectUnknownRelations',
  '@deprecated Executable compatibility adapter',
];
const missing = required.filter((token) => !source.includes(token));
const declarativeRule = source.slice(source.indexOf('export type SemanticDecisionRuleDefinition<'), source.indexOf('export type SemanticDecisionPolicyContract<'));
const policyContract = source.slice(source.indexOf('export type SemanticDecisionPolicyContract<'), source.indexOf('export type SemanticDecisionEvidencePacket<'));
const checks = [
  ['declarative rule has no executable callbacks', !/\b(applies|derive)\s*\??\s*:/.test(declarativeRule)],
  ['policy binds stable identity and revision', policyContract.includes('identity: string') && policyContract.includes('revision: string')],
  ['policy declares proof obligations', policyContract.includes('proofPolicy') && policyContract.includes('recordPremiseWitnesses: true')],
  ['rules use explicit variable patterns', source.includes('SemanticDecisionPatternTerm') && source.includes('SemanticDecisionVariableTerm') && source.includes('repeatedVariableBinding')],
  ['proof binds rule set and exact fact set', source.includes('ruleSetIdentity: string') && source.includes('factSetIdentity: string')],
  ['authority exposes proof verification without callback rerun', source.includes('readonly verifyAssessment:') && source.includes('verifyAssessment must verify the supplied proof without rerunning executable')],
  ['canonical SemanticDecisionInterface is declarative', source.includes('export interface SemanticDecisionInterface<Id extends string, Relation extends string, Term = string>') && source.includes('export interface SemanticDecisionCallbackCompatibilityInterface')],
  ['authority outcomes distinguish conflict and incompleteness', source.includes("kind: 'decision_conflict'") && source.includes("kind: 'decision_incomplete'")],
  ['legacy callback contract is explicitly deprecated', source.includes('@deprecated Callback-bound runtime adapter')],
  ['all required contract fields are present', missing.length === 0],
];
for (const [name, passed] of checks) process.stdout.write(`${passed ? 'PASS' : 'FAIL'} ${name}\n`);
if (missing.length > 0) process.stdout.write(`Missing: ${missing.join(', ')}\n`);
if (checks.some(([, passed]) => !passed)) process.exitCode = 1;
