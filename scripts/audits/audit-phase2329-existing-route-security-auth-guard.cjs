const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const read = (relative) => fs.readFileSync(path.join(root, relative), 'utf8');
const authority = read('packages/core/src/types/upstream/routeSecurityAuthority.ts');
const tests = read('packages/core/src/types/upstream/__tests__/route-security-authority.phase2329.test.ts');
const judgment = read('packages/core/src/types/upstream/routeAuthorizationSemanticJudgmentInterface.ts');
const checks = [
  ['existing route-security authority validates the auth guard suffix', /relationAll\(\[relationTextStartsWith\(lower, 'auth:'\), relationNormalizeWhitespace\(authGuard\)\.length > 0\]\)/.test(authority)],
  ['regression covers empty auth guard', /resolve\(\['auth:'\]\)/.test(tests)],
  ['regression covers whitespace-only auth guard', /resolve\(\['auth:   '\]\)/.test(tests)],
  ['regression preserves valid auth guard', /resolve\(\['auth:api'\]\)/.test(tests)],
  ['existing closed authorization ADT remains the contract', /export type LaravelRouteAuthorizationSemanticJudgment\s*=/.test(judgment)],
  ['no duplicate authorization authority interface introduced', !/Phase2329.*AuthorityInterface/.test(judgment)],
];
let failed = false;
for (const [label, passed] of checks) {
  process.stdout.write(`${passed ? 'PASS' : 'FAIL'} ${label}\n`);
  failed ||= !passed;
}
process.exitCode = failed ? 1 : 0;
