const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const read = rel => fs.readFileSync(path.join(root, rel), 'utf8');
const exists = rel => fs.existsSync(path.join(root, rel));
const authority = read('packages/core/src/types/upstream/routeSecurityAuthority.ts');
const domain = read('packages/core/src/types/domain/authAndPolicy.ts');
const resolver = read('packages/core/src/compiler/scanner/resolvers/RouteSecurityResolver.ts');
const builder = read('packages/core/src/compiler/scanner/resolvers/boundary/capabilityBuilder.ts');
const graph = read('packages/core/src/compiler/scanner/resolvers/resolverGraphSemanticInterface.ts');
const packageJson = JSON.parse(read('package.json'));
const coreIndex = read('packages/core/src/index.ts');
const checks = [
  ['security reasoning has a typed algebra contract', /export interface RouteSecurityAuthorityAlgebraInterface/.test(authority) && /readonly resolve: \(input: RouteSecurityAuthorityInput\) => RouteSecurityResolution/.test(authority)],
  ['closed upstream security contract exposes ownership and closure', /RouteSecurityAuthorityContractInterface extends RouteSecurityAuthorityAlgebraInterface/.test(authority) && /readonly authority: 'upstream'/.test(authority) && /readonly closed: true/.test(authority)],
  ['runtime authority composition delegates to injected algebra', /createRouteSecurityAuthority\(\s*algebra: RouteSecurityAuthorityAlgebraInterface/.test(authority) && /algebra\.resolve\(input\)/.test(authority)],
  ['security authority factory and contract are public core exports', /routeSecurityAuthorityAlgebra, createRouteSecurityAuthority/.test(coreIndex) && /RouteSecurityAuthorityContractInterface/.test(coreIndex)],
  ['canonical production authority binds the security algebra once', /routeSecurityAuthorityAlgebra:\s*RouteSecurityAuthorityAlgebraInterface/.test(authority) && /routeSecurityAuthority:\s*RouteSecurityAuthorityInterface\s*=\s*createRouteSecurityAuthority\(\s*routeSecurityAuthorityAlgebra/.test(authority)],
  ['security payload extraction uses the actual middleware separator', /relationTextFind\(trimmed, ':'\)/.test(authority) && /relationTextSlice\(trimmed, colon \+ 1\)/.test(authority)],
  ['legacy domain classifier executes the upstream contract', /routeSecurityAuthority\.resolve\(\{ kind: 'route_security_authority_input', middleware, auth: \{ kind: 'truth_value', value: false \} \}\)\.security/.test(domain)],
  ['domain no longer owns a second middleware security classifier', !/middlewareSecurityState|classifySequence|initialSecurityClassificationState/.test(domain)],
  ['scanner boundary consumes canonical security authority', /const security = params\.security;/.test(builder) && !/routeSecurityAuthority/.test(builder)],
  ['resolver compatibility facade delegates to upstream authority', /deprecated Compatibility adapter/.test(resolver) && /routeSecurityAuthority/.test(resolver)],
  ['resolver graph consumes security resolution without reclassification', /const security = input\.security;/.test(graph) && !/routeSecurityAuthority/.test(graph)],
  ['focused audit is registered without changing package/build contract', packageJson.version === '1.0.49' && packageJson.scripts.build === 'tsdown' && packageJson.scripts['audit:phase1377-runtime-security-contract-execution'] === 'node scripts/audits/audit-phase1377-runtime-security-contract-execution.cjs'],
  ['architecture and semantic ownership audits remain available', exists('scripts/audit/semantic-ownership-coverage.cjs') && exists('scripts/audit/routesync-architecture.cjs')],
];
const failures = checks.filter(([, ok]) => !ok).map(([name]) => name);
const report = {
  phase: 1377,
  title: 'Runtime Security Contract Execution',
  passed: failures.length === 0,
  checks: checks.length,
  passedChecks: checks.length - failures.length,
  failedChecks: failures,
  decisions: [
    'Middleware security reasoning remains owned by the upstream route security algebra.',
    'The upstream boundary resolves the security judgment once; capability and graph composition consume that closed judgment without reclassification.',
    'RouteSecurityClassifier remains as a backward-compatible facade and no longer contains a second classifier.',
    'Middleware ability/role payload extraction uses the actual colon separator before projection.',
    'Static contract audits do not substitute for TypeScript build or runtime tests.'
  ]
};
const reportPath = path.join(root, 'scripts/audits/reports/phase1377-runtime-security-contract-execution.json');
fs.mkdirSync(path.dirname(reportPath), { recursive: true });
fs.writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`);
console.log(JSON.stringify({ phase: report.phase, title: report.title, passed: report.passed, checks: report.checks, passedChecks: report.passedChecks, failedChecks: report.failedChecks, report: path.relative(root, reportPath) }, null, 2));
process.exitCode = failures.length ? 1 : 0;
