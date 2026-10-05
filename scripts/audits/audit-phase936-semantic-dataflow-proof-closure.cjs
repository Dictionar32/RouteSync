const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '../..');
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');
const exists = (file) => fs.existsSync(path.join(root, file));

const authority = read('packages/core/src/compiler/analysis/astDataflowAuthority.ts');
const contract = read('packages/core/src/types/upstream/semanticDataflowInterface.ts');
const executable = [
  'packages/core/src/compiler/analysis/astDataflowAuthority.ts',
  'packages/core/src/types/upstream/semanticDataflowInterface.ts',
  'packages/core/src/compiler/scanner/upstream/route/routeMiddlewareFlowResolver.ts',
  'packages/core/src/compiler/scanner/upstream/route/effectiveControllerActionPolicyResolver.ts',
];
const executableText = executable.map(read).join('\n');

const result = {
  upstreamBoundaryExists: exists('packages/core/src/types/upstream') && exists('packages/core/src/compiler/scanner/upstream'),
  semanticDataflowContractClosed: contract.includes("readonly closed: true") && contract.includes("readonly fixedPoint: 'least_fixed_point'"),
  derivationValidatorExported: authority.includes('export const validateSemanticDataflowDerivations'),
  premisesMustBeInClosure: authority.includes('derivation.premises.every(premise => factIn(closure, premise))'),
  conclusionsMustBeInClosure: authority.includes('factIn(closure, derivation.conclusion)'),
  transitiveRuleValidated: authority.includes("semantic-dataflow-reach-transitive") && authority.includes('derivation.premises.length === 2') && authority.includes('identityKey(derivation.premises[0].target)') && authority.includes('identityKey(derivation.premises[1].source)'),
  directReachNotDuplicatedAsTransitive: authority.includes('!directReachKeys.has(factKey(fact))'),
  authorityValidatesBeforeReturn: authority.includes('throw new Error(\'semantic dataflow derivation invariant violated\')'),
  noDanglingHistoricalExampleInExecutable: !/examples\/(?:ecomerce|ecommerce)-shop-source/.test(executableText),
};
result.clean = Object.values(result).every(Boolean);
console.log(JSON.stringify(result, null, 2));
if (!result.clean) process.exit(1);
