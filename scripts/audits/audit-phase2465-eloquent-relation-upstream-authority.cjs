const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const read = relative => fs.readFileSync(path.join(root, relative), 'utf8');
const exists = relative => fs.existsSync(path.join(root, relative));
const interfacePath = 'packages/core/src/types/upstream/eloquentRelationMethodAuthorityInterface.ts';
const authorityPath = 'packages/core/src/types/upstream/eloquentRelationMethodAuthority.ts';
const factsInterfacePath = 'packages/core/src/types/upstream/eloquentRelationFactsAuthorityInterface.ts';
const factsAuthorityPath = 'packages/core/src/types/upstream/eloquentRelationFactsAuthority.ts';
const producerPath = 'packages/core/src/compiler/scanner/modelRelationFactsProducer.ts';
const barrel = read('packages/core/src/types/upstream/index.ts');
const methodNames = ['hasOne', 'hasMany', 'belongsTo', 'belongsToMany', 'hasOneThrough', 'hasManyThrough', 'morphTo', 'morphOne', 'morphMany', 'morphToMany', 'morphedByMany'];
const methodInterface = read(interfacePath);
const methodAuthority = read(authorityPath);
const factsInterface = read(factsInterfacePath);
const factsAuthority = read(factsAuthorityPath);
const producer = read(producerPath);
const checks = [
  ['upstream method authority interface exists', exists(interfacePath)],
  ['method authority contract uses a closed recognized/not-recognized judgment', /recognized_eloquent_relation_method/.test(methodInterface) && /not_an_eloquent_relation_method/.test(methodInterface)],
  ['method authority uses export const name: Interface', /export const eloquentRelationMethodAuthority:\s*EloquentRelationMethodAuthorityInterface\s*=\s*Object\.freeze/.test(methodAuthority)],
  ['authority covers all 11 Eloquent relation methods', methodNames.every(name => new RegExp(`\\b${name}:`).test(methodAuthority))],
  ['method authority has no relation/foundation imports', !/semantic\/(relations|foundation)/.test(methodAuthority)],
  ['complete relation-facts contract is upstream-owned', /interface EloquentRelationFactsAuthorityInterface/.test(factsInterface)],
  ['upstream evidence is AST-neutral', !/ModelDeclarationAst|PhpAstValue|compiler\/scanner/.test(factsInterface)],
  ['complete facts authority uses export const name: Interface', /export const eloquentRelationFactsAuthority:\s*EloquentRelationFactsAuthorityInterface/.test(factsAuthority)],
  ['authority constructs canonical Eloquent relation AST', /eloquentRelationAstFromDescriptor/.test(factsAuthority)],
  ['scanner producer delegates complete judgment upstream', /eloquentRelationFactsAuthority\.judge/.test(producer)],
  ['scanner producer has no direct relation/foundation dependency', !/semantic\/(relations|foundation)/.test(producer)],
  ['legacy relation parser and producer are retired', !exists('packages/core/src/compiler/scanner/operations/model/memberRelationsParser.ts') && !exists('packages/core/src/compiler/scanner/operations/model/eloquentProducer.ts')],
  ['upstream barrel exports both authorities', /eloquentRelationFactsAuthorityInterface/.test(barrel) && /eloquentRelationFactsAuthority'/.test(barrel)],
];
for (const [label, passed] of checks) process.stdout.write(`${passed ? 'PASS' : 'FAIL'} ${label}\n`);
const failed = checks.filter(([, passed]) => !passed);
process.stdout.write(`Phase2465/2466 relation authority audit: ${checks.length - failed.length}/${checks.length} passed\n`);
process.exitCode = failed.length === 0 ? 0 : 1;
