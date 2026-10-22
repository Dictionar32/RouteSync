const fs = require('node:fs');
const path = require('node:path');
const root = process.cwd();
const upstreamPath = path.join(root, 'packages/core/src/types/upstream/routeDomainAuthority.ts');
const facadePath = path.join(root, 'packages/core/src/compiler/scanner/resolvers/RouteDomainResolver.ts');
const inventoryPath = path.join(root, 'PHASE1550_SCANNER_REASONING_INVENTORY.json');
const ownershipMapPath = path.join(root, 'PHASE1551_SCANNER_REASONING_OWNERSHIP_MAP.json');
const upstream = fs.readFileSync(upstreamPath, 'utf8');
const facade = fs.readFileSync(facadePath, 'utf8');
const inventory = JSON.parse(fs.readFileSync(inventoryPath, 'utf8'));
const ownershipMap = JSON.parse(fs.readFileSync(ownershipMapPath, 'utf8'));
const ownershipMarkdown = fs.readFileSync(path.join(root, 'PHASE1551_SCANNER_REASONING_OWNERSHIP_MAP.md'), 'utf8');
const checks = [
  { name: 'judgment-distinguishes-selected-candidate-from-default', pass: /selected:\s*RelationOption<RouteDomainCandidate>/.test(upstream) && /outcome:\s*RouteDomainResolutionOutcome/.test(upstream) && /'candidate_selected'\s*:\s*'default_applied'/.test(upstream) },
  { name: 'judgment-exposes-precedence-and-authority-identity', pass: /explicit>controller>resource>register>path>action>default/.test(upstream) && /authority:\s*'upstream'/.test(upstream) },
  { name: 'selected-evidence-is-returned-by-canonical-authority', pass: /const selected = relationFirstOption\(candidates/.test(upstream) && /selected,\s*result,\s*outcome,/.test(upstream) },
  { name: 'scanner-route-domain-resolver-is-compatibility-facade', pass: /routeDomainAuthority\.resolve/.test(facade) && !/function\s+resolve|const\s+resolve\s*=/.test(facade) },
  { name: 'all-scanner-source-files-remain-accounted-for', pass: inventory.files.length === inventory.totals.sourceFiles && inventory.files.every(file => fs.existsSync(path.join(root, file.path))) },
  { name: 'audit-does-not-claim-all-scanner-reasoning-is-migrated', pass: inventory.totals.filesWithReasoningSignals > 0 && inventory.totals.productionFilesWithDirectSolverCalls === 0 && inventory.scope.includes('heuristic inventory') },
  { name: 'ownership-map-preserves-open-migration-frontiers', pass: ownershipMap.clusters.some(cluster => cluster.status === 'mixed-boundary-open') && ownershipMap.clusters.some(cluster => cluster.status === 'open-frontier') && ownershipMarkdown.includes('do not blindly move AST construction') },
  { name: 'ownership-map-covers-all-inventory-candidates', pass: ownershipMap.inventory.sourceFiles === inventory.totals.sourceFiles && ownershipMap.inventory.reasoningSignalCandidates === inventory.totals.filesWithReasoningSignals },
];
const report = { phase: 1551, title: 'Route-domain closed judgment and scanner reasoning ownership', passed: checks.filter(check => check.pass).length, total: checks.length, checks: checks.map(({ name, pass }) => ({ name, passed: pass })) };
fs.writeFileSync(path.join(root, 'PHASE1551_AUDIT.json'), JSON.stringify(report, null, 2) + '\n');
for (const check of checks) process.stdout.write(`${check.pass ? 'PASS' : 'FAIL'} ${check.name}\n`);
process.stdout.write(`Phase 1551: ${report.passed}/${report.total} checks passed.\n`);
if (checks.some(check => !check.pass)) process.exitCode = 1;
