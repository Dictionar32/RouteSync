const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const read = relative => fs.readFileSync(path.join(root, relative), 'utf8');
const model = read('packages/core/src/types/upstream/semanticDataflow.ts');
const authority = read('packages/core/src/types/upstream/semanticDataflowAuthority.ts');
const boundary = read('packages/core/src/types/upstream/semanticDataflowInterface.ts');
const scanner = read('packages/core/src/compiler/scanner/lexer/routeAst/semanticDataFlowAnalyzer.ts');
const checks = [
  ['certificate requires complete derivation coverage', /derivationCoverage: Readonly<\{ readonly kind: 'derivation_coverage'; readonly complete: true; readonly coveredFacts: number \}>/.test(model)],
  ['authority binds covered-fact count to the computed closure', /coveredFacts: closure\.length/.test(authority)],
  ['boundary checks certificate coverage count against closure length', /certificate\.derivationCoverage\.coveredFacts !== judgment\.closure\.length/.test(boundary)],
  ['boundary rejects malformed rule and witness identities', /derivation_identity_invalid/.test(boundary) && /derivation\.witness\?\.kind !== 'semantic_dataflow_witness'/.test(boundary)],
  ['canonical fact derivations have no premises and originate in input facts', /semantic-dataflow-canonical-fact[\s\S]*derivation\.premises\.length !== 0[\s\S]*boundaryContainsFact\(judgment\.facts, derivation\.conclusion\)/.test(boundary)],
  ['reach seed derivations preserve source and target identity', /semantic-dataflow-reach-seed[\s\S]*derivation_rule_conclusion_mismatch/.test(boundary)],
  ['transitive reach derivations enforce joined endpoints', /semantic-dataflow-reach-transitive[\s\S]*left\.target[\s\S]*right\.source/.test(boundary)],
  ['every closure fact must be covered by a derivation conclusion', /closure_derivation_missing/.test(boundary) && /judgment\.closure\.some\(fact => !judgment\.derivations\.some/.test(boundary)],
  ['scanner validates judgment before projection', /semanticDataflowJudgmentBoundary\.admit\(judged\)/.test(scanner) && scanner.indexOf('semanticDataflowJudgmentBoundary.admit(judged)') < scanner.indexOf('const canonical = admission.judgment')],
];
for (const [name, passed] of checks) process.stdout.write(`${passed ? 'PASS' : 'FAIL'} ${name}\n`);
process.stdout.write(`RESULT ${checks.filter(([, passed]) => passed).length}/${checks.length}\n`);
if (checks.some(([, passed]) => !passed)) process.exitCode = 1;
