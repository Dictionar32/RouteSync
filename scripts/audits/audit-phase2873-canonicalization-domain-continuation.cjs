const fs = require('node:fs');
const path = require('node:path');
const root = process.cwd();
const compositionPath = path.join(root, 'packages/cli/src/parsers/php/controllerInvocationManifestComposition.ts');
const contractPath = path.join(root, 'packages/cli/src/parsers/php/controllerInvocationManifestCompositionInterface.ts');
const composition = fs.readFileSync(compositionPath, 'utf8');
const contract = fs.readFileSync(contractPath, 'utf8');
const collections = fs.readFileSync(path.join(root, 'packages/core/src/types/upstream/collections.ts'));
const checks = [
  ['canonicalization result exposes domain continuation', /ControllerSourceProjectIdentityCanonicalizationJudgmentOperations[\s\S]*continueWith/.test(contract)],
  ['canonicalized arm is a named domain judgment', /interface ControllerSourceProjectIdentityCanonicalizedJudgment/.test(contract)],
  ['blocked arm is a named domain judgment', /interface ControllerSourceProjectIdentityCanonicalizationBlockedJudgment/.test(contract)],
  ['producer attaches continuation to successful judgment', /continueWith:\s*<Result>\(handlers:[\s\S]*?handlers\.onCanonicalized\(judgment\)/.test(composition)],
  ['producer attaches continuation to blocked judgment', /continueWith:\s*<Result>\(handlers:[\s\S]*?handlers\.onBlocked\(judgment\)/.test(composition)],
  ['composition consumes judgment operation', /return identity\.continueWith\(/.test(composition)],
  ['canonicalization kind dispatch removed from compose', !/if\s*\(identity\.kind\s*===\s*'controller_source_project_identity_canonicalization_blocked'\)/.test(composition)],
  ['successful branch delegated to canonical-project continuation', /onCanonicalized:\s*canonicalIdentity\s*=>\s*composeCanonicalProject\(/.test(composition)],
  ['collections.ts remains empty', collections.length === 0],
  ['trace report exists', fs.existsSync(path.join(root, 'packages/core/src/types/upstream/PHASE2873_CANONICALIZATION_DOMAIN_CONTINUATION.md'))],
];
for (const [name, passed] of checks) console.log(`${passed ? 'PASS' : 'FAIL'} ${name}`);
console.log(`${checks.filter(([, passed]) => passed).length}/${checks.length} checks passed`);
if (checks.some(([, passed]) => !passed)) process.exitCode = 1;
