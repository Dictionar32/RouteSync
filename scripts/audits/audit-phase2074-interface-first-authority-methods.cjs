const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const read = relative => fs.readFileSync(path.join(root, relative), 'utf8');
const contract = read('packages/core/src/types/upstream/laravelControllerInvocationSemanticJudgmentInterface.ts');
const invocation = read('packages/core/src/types/upstream/laravelControllerInvocationSemanticJudgmentAuthority.ts');
const projection = read('packages/core/src/types/upstream/laravelControllerAstProjectionSemanticAuthority.ts');
const scanner = read('packages/core/src/compiler/scanner/wiring/laravelControllerScanner.ts');
const upstream = read('packages/core/src/types/upstream/index.ts');
const core = read('packages/core/src/index.ts');
const packageJson = JSON.parse(read('package.json'));
const checks = [
  ['invocation authority is a class implementing the existing authority interface', /class LaravelControllerInvocationSemanticJudgmentAuthority\s+implements LaravelControllerInvocationSemanticJudgmentAuthorityInterface/.test(invocation)],
  ['invocation authority has no const-arrow helper or factory', !/const\s+(judgmentFromResponse|createJudge|createLaravelControllerInvocationSemanticJudgmentAuthority)\s*=/.test(invocation)],
  ['reasoning cannot be injected as an alternate authority parameter', !/reasoning:\s*LaravelControllerInvocationSemanticReasoningContract\s*=/.test(invocation) && !/reasoning\s*\)/.test(invocation)],
  ['canonical contract is imported directly from the interface', /LARAVEL_CONTROLLER_INVOCATION_SEMANTIC_JUDGMENT_CONTRACT,/.test(invocation) && /readonly contract = LARAVEL_CONTROLLER_INVOCATION_SEMANTIC_JUDGMENT_CONTRACT/.test(invocation)],
  ['four integrated response outcomes remain exhaustively represented', ['not_connected', 'source_binding_rejected', 'complete', 'blocked'].every(kind => contract.includes(`php_source_invocation_integration_${kind}`))],
  ['AST projection authority is a class with a method rather than a const-arrow judge', /class LaravelControllerAstProjectionSemanticAuthority\s+implements LaravelControllerAstProjectionSemanticAuthorityInterface/.test(projection) && /\n\s*judge<InvocationJudgment/.test(projection) && !/const\s+judgeAstProjection\s*=/.test(projection)],
  ['AST projection forwards the exact invocation and response judgment objects', /invocationJudgment: context\.judgment/.test(projection) && /responseJudgment: context\.responseJudgment/.test(projection)],
  ['Laravel scanner forwards invocation judgment into declaration parsing', /parseControllerDeclarationFromInvocationJudgment\([^\n]*invocationJudgment/.test(scanner)],
  ['no relation/foundation subscanner is introduced', !fs.existsSync(path.join(root, 'packages/core/src/compiler/scanner/operations/relation/foundation'))],
  ['public exports expose class authority and no removed factory', /LaravelControllerInvocationSemanticJudgmentAuthority,/.test(upstream) && /LaravelControllerInvocationSemanticJudgmentAuthority,/.test(core) && !/createLaravelControllerInvocationSemanticJudgmentAuthority/.test(upstream + core)],
  ['Phase 2074 audit is registered', packageJson.scripts['audit:phase2074-interface-first-authority-methods'] === 'node scripts/audits/audit-phase2074-interface-first-authority-methods.cjs'],
];
let failed = 0;
for (const [name, pass] of checks) {
  process.stdout.write(`${pass ? 'PASS' : 'FAIL'} ${name}\n`);
  failed += Number(!pass);
}
process.stdout.write(`Phase 2074: ${checks.length - failed}/${checks.length}\n`);
process.exitCode = failed ? 1 : 0;
