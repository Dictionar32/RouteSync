const fs = require('node:fs');
const path = require('node:path');
const root = process.cwd();
const contract = fs.readFileSync(path.join(root, 'packages/core/src/types/upstream/laravelControllerInvocationSemanticJudgmentInventoryInterface.ts'), 'utf8');
const composition = fs.readFileSync(path.join(root, 'packages/cli/src/parsers/php/controllerInvocationManifestComposition.ts'), 'utf8');
const collections = fs.readFileSync(path.join(root, 'packages/core/src/types/upstream/collections.ts'));
const checks = [
  ['discovery evidence separated from executable result', /LaravelControllerSourceDiscoveryEvidence/.test(contract)],
  ['discovery result ADT has named continuation contract', /interface LaravelControllerSourceDiscoveryJudgmentOperations[\s\S]*continueWith/.test(contract)],
  ['complete and blocked arms both carry continuation operations', /Extract<LaravelControllerSourceDiscoveryEvidence, \{ readonly kind: 'laravel_controller_source_discovery_complete' \}> & LaravelControllerSourceDiscoveryJudgmentOperations/.test(contract) && /Extract<LaravelControllerSourceDiscoveryEvidence, \{ readonly kind: 'laravel_controller_source_discovery_blocked' \}> & LaravelControllerSourceDiscoveryJudgmentOperations/.test(contract)],
  ['discovery producer binds continuation to evidence', /continueWith:\s*<Result>\(handlers:[\s\S]*?handlers\.onComplete\(evidence\)[\s\S]*?handlers\.onBlocked\(evidence\)/.test(composition)],
  ['manifest composition consumes discovery continuation', /return discovery\.continueWith\(/.test(composition)],
  ['composition no longer dispatches on discovery kind', !/if\s*\(discovery\.kind\s*===\s*'laravel_controller_source_discovery_blocked'\)/.test(composition)],
  ['complete discovery delegates to source processing', /onComplete:\s*completeDiscovery\s*=>\s*continueWithDiscoveredSources\(completeDiscovery\.sources, completeDiscovery\.sourceProject/.test(composition)],
  ['discovery project claim remains inventory subject', /sourceProject:\s*discoverySourceProject/.test(composition)],
  ['collections.ts remains empty', collections.length === 0],
  ['Phase2874 report exists', fs.existsSync(path.join(root, 'packages/core/src/types/upstream/PHASE2874_DISCOVERY_DOMAIN_CONTINUATION.md'))],
];
for (const [name, passed] of checks) console.log(`${passed ? 'PASS' : 'FAIL'} ${name}`);
console.log(`${checks.filter(([, passed]) => passed).length}/${checks.length} checks passed`);
if (checks.some(([, passed]) => !passed)) process.exitCode = 1;
