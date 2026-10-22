const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const source = fs.readFileSync(path.join(root, 'packages/core/src/types/upstream/semanticDecisionInterface.ts'), 'utf8');
const declarativeRule = source.slice(source.indexOf('export type SemanticDecisionRuleDefinition<'), source.indexOf('export type SemanticDecisionPolicyContract<'));
const policy = source.slice(source.indexOf('export type SemanticDecisionPolicyContract<'), source.indexOf('export type SemanticDecisionEvidencePacket<'));
const checks = [
  ['canonical SemanticDecisionInterface is declarative', source.includes('export interface SemanticDecisionInterface<Id extends string, Relation extends string, Term = string>') && source.includes('readonly evaluate:') && source.includes('readonly verifyAssessment:')],
  ['callback interface is isolated as deprecated compatibility', source.includes('@deprecated Callback-based compatibility boundary') && source.includes('SemanticDecisionCallbackCompatibilityInterface')],
  ['rule patterns model explicit variables', source.includes('SemanticDecisionVariableTerm') && source.includes('SemanticDecisionPatternTerm')],
  ['ground evidence uses canonical term identity', source.includes("kind: 'semantic_decision_term'") && source.includes('identity: string')],
  ['declarative rule shape has no callbacks', !/\\b(applies|derive)\\s*\\??\\s*:/.test(declarativeRule)],
  ['policy declares unification laws', policy.includes("kind: 'structural_unification'") && policy.includes("same_term_identity") && policy.includes("must_be_bound_by_premises")],
  ['policy binds canonical rule set and exact evidence fact set', policy.includes('ruleSetIdentity: string') && source.includes('factSetIdentity: string')],
  ['proof receipts carry substitutions and premise evidence', source.includes('SemanticDecisionSubstitutionEntry') && source.includes('rulePremise: SemanticDecisionRuleAtom') && source.includes('evidence: SemanticDecisionAtom')],
  ['authority exposes independent assessment verification', source.includes('readonly verifyAssessment:') && source.includes('without rerunning executable')],
  ['outcomes distinguish conflict and incomplete evaluation', source.includes("kind: 'decision_conflict'") && source.includes("kind: 'decision_incomplete'")],
  ['legacy callback contract remains explicitly deprecated', source.includes('@deprecated Callback-bound runtime adapter')],
];
for (const [name, passed] of checks) process.stdout.write(`${passed ? 'PASS' : 'FAIL'} ${name}\n`);
if (checks.some(([, passed]) => !passed)) process.exitCode = 1;
