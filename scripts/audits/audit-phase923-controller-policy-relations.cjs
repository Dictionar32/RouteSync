const fs = require('fs');
const path = require('path');

const root = process.cwd();
const upstream = path.join(root, 'packages/core/src/types/upstream');
const graphModel = path.join(upstream, 'highLevelSourceModel.ts');
const policyRelation = path.join(upstream, 'controllerActionPolicyRelations.ts');
const semanticReferences = path.join(upstream, 'semanticReferences.ts');
const dataflow = path.join(upstream, 'semanticDataflowInterface.ts');

const read = file => fs.readFileSync(file, 'utf8');
const files = fs.readdirSync(upstream).filter(file => file.endsWith('.ts') && !file.includes('__tests__'));
const source = files.map(file => read(path.join(upstream, file))).join('\n');

const result = {
  controllerPolicyRelationPresent: fs.existsSync(policyRelation),
  semanticRelationUnionIncludesPolicy: read(semanticReferences).includes("ControllerActionPolicyRelation;"),
  catalogAcceptsEffectivePolicies: read(graphModel).includes('effectivePolicies: readonly EffectiveControllerActionPolicy[]'),
  catalogProjectsEffectivePolicies: read(graphModel).includes('controllerActionPolicyRelations(policy)'),
  dataflowPolicyVariants: [...source.matchAll(/(?:kind:\s*['"]|['"])(?:dataflow_middleware|dataflow_authorization|dataflow_policy)['"]/g)].map(match => match[0]).filter((value, index, all) => all.indexOf(value) === index),
  semanticDataflowPolicyVocabulary: ['middleware_policy', 'authorization_policy'].filter(value => read(dataflow).includes(value)),
  productionUpstreamCompilerImports: files.filter(file => file !== 'index.ts' && /from ['"][^'"]*(?:compiler|scanner)[^'"]*['"]/.test(read(path.join(upstream, file)))).map(file => file),
  ecomerceFixturePresent: fs.existsSync(path.join(root, 'examples/ecomerce-shop-source')),
  ecommerceFixturePresent: fs.existsSync(path.join(root, 'examples/ecommerce-shop-source')),
};
result.clean = result.controllerPolicyRelationPresent
  && result.semanticRelationUnionIncludesPolicy
  && result.catalogAcceptsEffectivePolicies
  && result.catalogProjectsEffectivePolicies
  && result.dataflowPolicyVariants.length === 0
  && result.semanticDataflowPolicyVocabulary.length === 0
  && result.productionUpstreamCompilerImports.length === 0
  && !result.ecomerceFixturePresent
  && !result.ecommerceFixturePresent;

console.log(JSON.stringify(result, null, 2));
if (!result.clean) process.exit(1);
