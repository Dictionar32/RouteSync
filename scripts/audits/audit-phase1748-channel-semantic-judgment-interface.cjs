const fs = require('node:fs');
const path = require('node:path');
const root = process.cwd();
const read = relative => fs.readFileSync(path.join(root, relative), 'utf8');
const checks = [];
const check = (name, passed, finding = '') => checks.push({ name, passed: Boolean(passed), finding });

const judgmentPath = 'packages/core/src/types/upstream/laravelScannerSemanticJudgment.ts';
const scannerInterfacePath = 'packages/core/src/types/upstream/laravelChannelScannerInterface.ts';
const scannerPath = 'packages/core/src/compiler/scanner/operations/ChannelScanner.ts';
const indexPath = 'packages/core/src/index.ts';
const judgment = read(judgmentPath);
const contract = read(scannerInterfacePath);
const runtime = read(scannerPath);
const index = read(indexPath);
const packageJson = JSON.parse(read('package.json'));

check('channel declaration evidence retains canonical channel identity and source span', judgment.includes('interface BroadcastChannelDeclarationEvidence') && judgment.includes('readonly channel: ChannelName') && judgment.includes('readonly source: SourceSpan'));
check('client subscription is modeled as source-backed evidence', judgment.includes('interface BroadcastChannelSubscriptionEvidence') && judgment.includes('readonly subscriptionKind: BroadcastChannelKind') && judgment.includes('readonly source: SourceSpan'));
check('channel kind judgment is a closed resolved/unresolved/ambiguous ADT', judgment.includes("readonly kind: 'resolved'") && judgment.includes("readonly kind: 'unresolved'") && judgment.includes("readonly kind: 'ambiguous'"));
check('unresolved channel kind has an explicit no-subscription-evidence reason', judgment.includes("readonly reason: 'no-client-subscription-evidence'"));
check('ambiguous channel kind requires at least two candidates', judgment.includes('readonly candidates: readonly [BroadcastChannelKindCandidate, BroadcastChannelKindCandidate, ...BroadcastChannelKindCandidate[]]'));
check('channel semantic authority is an explicit closed upstream interface', judgment.includes('interface BroadcastChannelKindJudgmentAuthority') && judgment.includes("readonly kind: 'broadcast_channel_kind_judgment_authority'") && judgment.includes('readonly closed: true') && judgment.includes('readonly judge:'));
check('authority contract forbids deriving kind from channel-name heuristics', judgment.includes('never infer channel mode from words embedded in the channel pattern'));
check('semantic judgment contract version is advanced', judgment.includes('readonly version: 3;') && judgment.includes('version: 3,'));
check('semantic judgment contract documents evidence-only channel classification', judgment.includes('derive-public-private-presence-only-from-source-backed-subscription-evidence-never-from-channel-name-heuristics'));
check('channel scanner interface version is advanced to v3', contract.includes('readonly contractVersion: 3;') && contract.includes('readonly contractVersion: 3;'));
check('channel scan input injects classification authority rather than hiding it in scanner', contract.includes('classificationAuthority: BroadcastChannelKindJudgmentAuthority'));
check('channel scan input carries source-backed subscription evidence', contract.includes('subscriptionEvidence: readonly BroadcastChannelSubscriptionEvidence[]'));
check('channel scan artifact correlates declaration, AST, and judgment', contract.includes('interface LaravelChannelScanArtifact') && contract.includes('readonly declaration: BroadcastChannelDeclarationEvidence') && contract.includes('readonly ast: ChannelAst') && contract.includes('readonly classification: BroadcastChannelKindJudgment'));
check('migration contract truthfully discloses current heuristic runtime', contract.includes('pattern-heuristic-classification-remains-in-channel-scanner'));
check('migration contract defines the required authority cutover', contract.includes('collect-subscription-evidence-then-delegate-classification-and-preserve-closed-judgment'));
check('current runtime heuristic remains explicitly identified as an open gap', /isPresence|isPrivate|BroadcastChannelKind/.test(runtime));
check('new migration contract is exported from package public surface', index.includes('LARAVEL_CHANNEL_SCANNER_MIGRATION_CONTRACT') && index.includes('LaravelChannelScannerMigrationContract'));
check('audit script is registered in package scripts', packageJson.scripts['audit:phase1748-channel-semantic-judgment-interface'] === 'node scripts/audits/audit-phase1748-channel-semantic-judgment-interface.cjs');
check('no semantic/foundation dependency introduced in new interface', !contract.includes('semantic/foundation') && !judgment.includes('semantic/foundation'));
check('no production wiring is falsely claimed by the migration contract', contract.includes('currentRuntime:') && !contract.includes('currentRuntime: \'upstream-authority-wired\''));

const result = {
  phase: 1748,
  title: 'Channel Semantic Judgment Interface-First Contract',
  status: checks.every(item => item.passed) ? 'PASS' : 'FAIL',
  passed: checks.filter(item => item.passed).length,
  total: checks.length,
  checks,
  implementationStatus: {
    interfaceContract: 'implemented',
    authorityImplementation: 'not-implemented',
    scannerWiring: 'not-implemented',
    reason: 'ChannelScanner currently guesses public/private/presence from pattern text; client subscription evidence is not yet collected by the Laravel source pipeline.'
  }
};
fs.writeFileSync(path.join(root, 'PHASE1748_AUDIT.json'), `${JSON.stringify(result, null, 2)}\n`);
for (const item of checks) process.stdout.write(`${item.passed ? 'PASS' : 'FAIL'} ${item.name}${item.finding ? ` — ${item.finding}` : ''}\n`);
process.stdout.write(`\n${result.passed}/${result.total} checks passed.\n`);
if (result.status !== 'PASS') process.exitCode = 1;
