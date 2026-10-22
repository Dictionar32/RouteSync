const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const read = relative => fs.readFileSync(path.join(root, relative), 'utf8');
const producer = read('packages/core/src/compiler/semantic/sourceAstSemanticProducer.ts');
const acquisition = read('packages/core/src/compiler/semantic/sourceAstEvidenceAcquisition.ts');
const evidenceContract = read('packages/core/src/types/upstream/sourceAstEvidenceAcquisitionInterface.ts');
const actionContract = read('packages/core/src/types/upstream/routeActionIdentityCapability.ts');
const actionAuthority = read('packages/core/src/types/upstream/routeActionIdentityCapabilityAuthority.ts');
const grouper = read('packages/cli/src/generators/classifier/routeGrouper.ts');
const upstreamBarrel = read('packages/core/src/types/upstream/index.ts');
const checks = [
  ['semantic producer consumes acquired source evidence', producer.includes('sourceAstEvidenceAcquisition.acquire(sourceProject)')],
  ['semantic producer no longer discovers or reads source files', !producer.includes('collectPhpFiles') && !producer.includes('readSourceText') && !producer.includes('scannerUtils')],
  ['source acquisition owns filesystem discovery and reads', acquisition.includes('collectPhpFiles') && acquisition.includes('readSourceText')],
  ['source evidence is represented by a closed typed contract', evidenceContract.includes('SourceAstFileEvidence') && evidenceContract.includes('closed: true')],
  ['action identity resolution has a closed upstream contract', actionContract.includes('RouteActionIdentityCapabilityContract') && actionContract.includes('RouteActionIdentityResolution')],
  ['upstream authority resolves duplicate action names independent of input order', actionAuthority.includes('routeActionIdentityCapabilityAuthority') && actionAuthority.includes('while (used.has(resolvedName))') && actionAuthority.includes('orderedCandidates') && actionAuthority.includes('left.routeKey < right.routeKey')],
  ['CLI delegates final action identity to upstream authority', grouper.includes('routeActionIdentityCapabilityAuthority.resolve')],
  ['CLI projection no longer mints duplicate suffixes', !grouper.includes('usedActions') && !grouper.includes('while (used.has(')],
  ['upstream barrel exports both migration contracts', upstreamBarrel.includes("export * from './sourceAstEvidenceAcquisitionInterface';") && upstreamBarrel.includes("export * from './routeActionIdentityCapability';")],
  ['route lookup rejects missing upstream identity', grouper.includes('Missing upstream action identity')],
];
const failed = checks.filter(([, passed]) => !passed);
const report = {
  phase: 1408,
  name: 'upstream-evidence-and-action-identity-migration',
  status: failed.length === 0 ? 'passed_with_residuals' : 'failed',
  passed: checks.length - failed.length,
  total: checks.length,
  checks: checks.map(([name, passed]) => ({ name, passed })),
  residuals: [
    'The semantic producer still parses acquired PHP syntax; parser construction and semantic judgment production remain coupled.',
    'The source evidence acquisition contract currently covers models, resources, controllers and services; other Laravel source families retain their existing scanner paths.',
    'Full TypeScript typecheck, build and end-to-end Laravel fixture verification require project dependencies that are absent from this workspace.',
    'Dataflow/relational-calculus authority audits remain separate unresolved migrations.'
  ]
};
const reportPath = path.join(root, 'scripts/audits/reports/phase1408-upstream-evidence-and-action-identity.json');
fs.mkdirSync(path.dirname(reportPath), { recursive: true });
fs.writeFileSync(reportPath, JSON.stringify(report, null, 2) + '\n');
for (const [name, passed] of checks) console.log(`${passed ? 'PASS' : 'FAIL'} ${name}`);
console.log(`RESULT ${report.passed}/${report.total} ${report.status}`);
process.exitCode = failed.length ? 1 : 0;
