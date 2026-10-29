const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
let passed = 0;
const check = (label, condition) => {
  if (!condition) {
    console.error(`FAIL ${label}`);
    process.exitCode = 1;
    return;
  }
  passed += 1;
  console.log(`PASS ${label}`);
};
const read = relative => fs.readFileSync(path.join(root, relative), 'utf8');
const identity = read('packages/core/src/types/upstream/sourceProjectIdentity.ts');
const policyTest = read('packages/core/src/compiler/analysis/__tests__/ecommerceShopDataflowPolicyPhase1029.spec.ts');
const coreBarrel = read('packages/core/src/index.ts');
const composition = read('packages/cli/src/parsers/php/controllerInvocationManifestComposition.ts');
const scan = read('packages/cli/src/commands/scan.ts');
const sync = read('packages/cli/src/commands/sync.ts');
check('factory contract accepts SourceFile instead of raw string', /readonly create:\s*\(sourceRoot: SourceFile\)/.test(identity));
check('factory contract has no optional policy parameter', !/readonly create:\s*\([\s\S]{0,120}\?\s*:\s*SemanticDataflowQueryPolicyIntent/.test(identity));
check('factory implementation does not classify absent policy with undefined', !identity.includes('policyIntent === undefined') && !identity.includes('SemanticDataflowQueryPolicyIntent | undefined'));
check('policy intent uses a domain-specific input ADT', /LaravelSourceProjectIdentityWithPolicyInput/.test(identity) && /kind: 'laravel_source_project_identity_with_policy_input'/.test(identity));
check('policy factory operation is interface-first', /readonly createWithPolicy:\s*\(input: LaravelSourceProjectIdentityWithPolicyInput\)/.test(identity) && /export const createLaravelSourceProjectIdentity:\s*LaravelSourceProjectIdentityFactoryInterface/.test(identity));
check('default CLI scan wraps path at SourceFile boundary', /createLaravelSourceProjectIdentity\.create\(createSourceFile\(targetDir\)\)/.test(scan));
check('default CLI sync wraps path at SourceFile boundary', /createLaravelSourceProjectIdentity\.create\(createSourceFile\(targetDir\)\)/.test(sync));
check('policy example uses explicit policy input', (policyTest.match(/createWithPolicy\(/g) || []).length === 2 && policyTest.includes('sourceRoot: createSourceFile(fixtureRoot)'));
check('canonicalization preserves explicit policy intent', composition.includes('createLaravelSourceProjectIdentity.createWithPolicy') && composition.includes('sourceRoot: createSourceFile(canonicalRoot)'));
check('policy input contract is explicitly exported from the core barrel', coreBarrel.includes('LaravelSourceProjectIdentityWithPolicyInput') && coreBarrel.includes("from './types/upstream/sourceProjectIdentity'"));
check('upstream collections module remains empty', fs.statSync(path.join(root, 'packages/core/src/types/upstream/collections.ts')).size === 0);
check('no legacy direct factory invocation remains in TypeScript runtime sources', !fs.readFileSync(path.join(root, 'scripts/scan-toko-online.ts'), 'utf8').includes('createLaravelSourceProjectIdentity(targetDir)'));
console.log(`\nPhase2884 source-project identity audit: ${passed}/12 checks passed.`);
