const fs = require('node:fs');
const path = require('node:path');
const root = process.cwd();
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
const checks = [];
const check = (name, pass, detail) => checks.push({ name, pass: Boolean(pass), detail });
const semantic = read('packages/core/src/types/upstream/invocationSemanticJudgmentInterface.ts');
const algebra = read('packages/core/src/types/upstream/invocationSemanticJudgmentAlgebra.ts');
const authority = read('packages/core/src/types/upstream/invocationSemanticJudgmentAuthority.ts');
const compositionInput = read('packages/cli/src/parsers/php/controllerInvocationManifestCompositionInterface.ts');
const composition = read('packages/cli/src/parsers/php/controllerInvocationManifestComposition.ts');
const scan = read('packages/cli/src/commands/scan.ts');
const sync = read('packages/cli/src/commands/sync.ts');
const drift = read('packages/cli/src/commands/audit/driftAuditor.ts');
const collections = fs.readFileSync(path.join(root, 'packages/core/src/types/upstream/collections.ts'));
const deletedRelations = [
  'packages/core/src/semantic/relations/relationMembership.ts',
  'packages/core/src/semantic/relations/relationalSequence.ts',
  'packages/core/src/semantic/relations/semanticRelations.ts',
];
check('rule policy is interface-first operation object', /export interface InvocationSemanticRulePolicyResolutionOperationsInterface\s*\{[\s\S]*readonly resolve:/.test(semantic) && /export const invocationSemanticRulePolicy:\s*InvocationSemanticRulePolicyResolutionOperationsInterface\s*=\s*Object\.freeze\(/.test(semantic), 'Policy resolution is exported as a typed domain operation object.');
check('witness ownership is interface-first operation object', /export interface InvocationSemanticWitnessOwnershipOperationsInterface\s*\{[\s\S]*readonly ownerOf:/.test(semantic) && /export const invocationSemanticWitnessOwnership:\s*InvocationSemanticWitnessOwnershipOperationsInterface\s*=\s*Object\.freeze\(/.test(semantic), 'Witness ownership is exported as a typed domain operation object.');
check('algebra invokes policy operation by domain name', /invocationSemanticRulePolicy\.resolve\(ruleId\)/.test(algebra), 'Semantic algebra no longer invokes the old bare policy function.');
check('authority invokes witness ownership operation', /invocationSemanticWitnessOwnership\.ownerOf\(witness\)/.test(authority), 'Authority validates each witness through the shared ownership operation.');
check('legacy bare witness helper removed', !/invocationWitnessOwnerRuleId/.test(semantic + algebra + authority), 'No remaining use of the old witness-owner helper name in the audited slice.');
check('CLI request uses operational composition input factory', /controllerInvocationManifestCompositionInputFactory\.create\(/.test(scan) && /controllerInvocationManifestCompositionInputFactory\.create\(/.test(sync) && /controllerInvocationManifestCompositionInputFactory\.create\(/.test(drift), 'scan/sync/drift construct the manifest request through the canonical input factory.');
check('composition input owns canonicalization continuation', /continueToCanonicalization\s*:\s*\(/.test(compositionInput) && /input\.continueToCanonicalization\(/.test(composition), 'Manifest composition dispatches through the request ADT operation.');
check('audited runtime files contain no exported function declarations', !/^\s*export\s+function\s+/m.test(semantic + '\n' + algebra + '\n' + authority + '\n' + compositionInput + '\n' + composition + '\n' + scan + '\n' + sync + '\n' + drift), 'No export function declarations in the scoped runtime slice; this is not a repository-wide claim.');
check('collections.ts remains whitespace-only', /^\s*$/.test(collections.toString('utf8')), `collections.ts bytes=${collections.length}; unchanged constraint preserved.`);
check('deleted relation foundation modules remain absent', deletedRelations.every(file => !fs.existsSync(path.join(root, file))), 'No deleted relation foundation was restored.');
const result = { phase: 3010, audit: 'upstream-semantic-operation-objects-and-cli-manifest-trace', passed: checks.filter(c => c.pass).length, total: checks.length, checks };
fs.writeFileSync(path.join(root, 'PHASE3010_AUDIT.json'), JSON.stringify(result, null, 2) + '\n');
for (const item of checks) process.stdout.write(`${item.pass ? 'PASS' : 'FAIL'} ${item.name}: ${item.detail}\n`);
process.stdout.write(`RESULT ${result.passed}/${result.total}\n`);
if (result.passed !== result.total) process.exitCode = 1;
