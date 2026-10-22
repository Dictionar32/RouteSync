const fs = require('node:fs');
const path = require('node:path');
const root = process.cwd();
const read = relative => fs.readFileSync(path.join(root, relative), 'utf8');
const checks = [];
const check = (name, passed, finding = '') => checks.push({ name, passed: Boolean(passed), finding });
const contractPath = 'packages/core/src/types/upstream/laravelSubscannerRetirementInterface.ts';
const channelPath = 'packages/core/src/types/upstream/laravelChannelScannerInterface.ts';
const judgmentPath = 'packages/core/src/types/upstream/laravelScannerSemanticJudgment.ts';
const pipelinePath = 'packages/core/src/compiler/scanner/wiring/laravelSourceAstPipeline.ts';
const channelRuntimePath = 'packages/core/src/compiler/scanner/subscanners/ChannelScanner.ts';
const indexPath = 'packages/core/src/index.ts';
const packagePath = 'package.json';
const retirement = read(contractPath);
const channel = read(channelPath);
const judgment = read(judgmentPath);
const pipeline = read(pipelinePath);
const channelRuntime = read(channelRuntimePath);
const index = read(indexPath);
const packageJson = JSON.parse(read(packagePath));

check('retirement target explicitly excludes a permanent subscanner layer', retirement.includes('without-permanent-subscanner-layer'));
check('directory deletion is gated by zero production consumers and audit', retirement.includes('zero-production-consumers-and-audit-passes'));
check('route facade has an upstream interface and authority owner', retirement.includes("legacyEntry: 'RouteScanner'") && retirement.includes("upstreamBoundary: 'LaravelRouteScannerInterface'") && retirement.includes("semanticOwner: 'RouteControllerBindingJudgmentAuthority'"));
check('controller facade retirement targets integrated response composition', retirement.includes("legacyEntry: 'ControllerScanner'") && retirement.includes("semanticOwner: 'InvocationSemanticIntegratedResponseCompositionInterface'"));
check('model facade retirement has an explicit upstream boundary', retirement.includes("legacyEntry: 'ModelScanner'") && retirement.includes("upstreamBoundary: 'LaravelModelScannerInterface'"));
check('FormRequest facade retirement has an explicit upstream boundary', retirement.includes("legacyEntry: 'FormRequestScanner'") && retirement.includes("upstreamBoundary: 'LaravelFormRequestScannerInterface'"));
check('resource facade retirement delegates model binding to upstream authority', retirement.includes("legacyEntry: 'ResourceScanner'") && retirement.includes("semanticOwner: 'ResourceModelBindingJudgmentAuthority'"));
check('channel facade retirement delegates kind judgment to upstream authority', retirement.includes("legacyEntry: 'ChannelScanner'") && retirement.includes("semanticOwner: 'BroadcastChannelKindJudgmentAuthority'"));
check('retirement contract includes all six named subscanner domains', ['RouteScanner', 'ControllerScanner', 'ModelScanner', 'FormRequestScanner', 'ResourceScanner', 'ChannelScanner'].every(name => retirement.includes(`'${name}'`)));
check('retirement contract is exported from the public core surface', index.includes('LARAVEL_SUBSCANNER_RETIREMENT_CONTRACT') && index.includes('LaravelSubscannerRetirementInterface'));
check('channel source declaration AST has no semantic kind field', channel.includes('interface BroadcastChannelDeclarationAst') && !/interface BroadcastChannelDeclarationAst[\s\S]*?readonly kind: BroadcastChannelKind/.test(channel));
check('source declaration AST retains source span', /interface BroadcastChannelDeclarationAst[\s\S]*?readonly source: SourceSpan/.test(channel));
check('resolved channel artifact is the only artifact carrying canonical ChannelAst', /kind: 'resolved_laravel_channel'[\s\S]*?readonly ast: ChannelAst/.test(channel) && !/kind: 'unresolved_laravel_channel'[\s\S]*?readonly ast: ChannelAst/.test(channel));
check('unresolved channel artifact preserves source AST and judgment without canonical semantic AST', /kind: 'unresolved_laravel_channel'[\s\S]*?readonly sourceAst: BroadcastChannelDeclarationAst[\s\S]*?readonly classification: UnresolvedBroadcastChannelKindJudgment/.test(channel));
check('ambiguous channel artifact preserves source AST and judgment without canonical semantic AST', /kind: 'ambiguous_laravel_channel'[\s\S]*?readonly sourceAst: BroadcastChannelDeclarationAst[\s\S]*?readonly classification: AmbiguousBroadcastChannelKindJudgment/.test(channel));
check('channel scan contract is advanced to v4', channel.includes('readonly contractVersion: 4;') && channel.includes('contractVersion: 4;'));
check('channel migration contract explicitly requires eventual deletion', channel.includes('readonly retirement:') && channel.includes('delete-channel-scanner-after-all-consumers-use-upstream-source-evidence-and-judgment-contracts'));
check('global semantic judgment contract advances to v4', judgment.includes('readonly version: 4;') && judgment.includes('version: 4,'));
check('global judgment contract says canonical channel AST only exists after resolved judgment', judgment.includes('channelAstBoundary') && judgment.includes('canonical-channel-ast-exists-only-for-resolved-judgment'));
check('legacy source pipeline still imports subscanner facades, accurately leaving migration open', pipeline.includes('from "../subscanners"') && /ModelScanner\.scanCanonicalBundle/.test(pipeline) && /ChannelScanner\.scanCanonicalAsts/.test(pipeline));
check('current channel runtime still contains heuristic classification, so no false cutover claim', /isPresence|isPrivate/.test(channelRuntime));
check('channel interface does not claim runtime implementation is complete', channel.includes('pattern-heuristic-classification-remains-in-channel-scanner'));
check('new interface contracts avoid semantic/foundation dependency', !retirement.includes('semantic/foundation') && !channel.includes('semantic/foundation'));
check('audit script registered in package scripts', packageJson.scripts['audit:phase1749-upstream-interface-first-subscanner-retirement'] === 'node scripts/audits/audit-phase1749-upstream-interface-first-subscanner-retirement.cjs');

const result = {
  phase: 1749,
  title: 'Upstream Interface-First Subscanner Retirement and Source-Bound Channel Judgment',
  status: checks.every(item => item.passed) ? 'PASS' : 'FAIL',
  passed: checks.filter(item => item.passed).length,
  total: checks.length,
  checks,
  implementationStatus: {
    upstreamContract: 'implemented',
    channelSourceAstContract: 'implemented',
    productionSubscannerRetirement: 'not-yet-complete',
    channelAuthorityImplementationAndWiring: 'not-yet-complete',
    currentProductionConsumers: 'legacy-subscanner-facades-remain-in-laravel-source-ast-pipeline',
    reason: 'Interface-first contract now defines deletion as the terminal state and prevents unresolved or ambiguous channel judgments from pretending to be canonical channel ASTs; consumer migration and authority wiring remain open.'
  }
};
fs.writeFileSync(path.join(root, 'PHASE1749_AUDIT.json'), `${JSON.stringify(result, null, 2)}\n`);
for (const item of checks) process.stdout.write(`${item.passed ? 'PASS' : 'FAIL'} ${item.name}${item.finding ? ` — ${item.finding}` : ''}\n`);
process.stdout.write(`\n${result.passed}/${result.total} checks passed.\n`);
if (result.status !== 'PASS') process.exitCode = 1;
