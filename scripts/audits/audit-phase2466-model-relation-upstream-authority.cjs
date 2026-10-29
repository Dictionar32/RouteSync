const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const read = relative => fs.readFileSync(path.join(root, relative), 'utf8');
const exists = relative => fs.existsSync(path.join(root, relative));
const checks = [
  ['upstream relation-facts interface exists', exists('packages/core/src/types/upstream/eloquentRelationFactsAuthorityInterface.ts')],
  ['upstream authority exports a typed constant', /export const eloquentRelationFactsAuthority:\s*EloquentRelationFactsAuthorityInterface/.test(read('packages/core/src/types/upstream/eloquentRelationFactsAuthority.ts'))],
  ['authority contract accepts AST-neutral evidence', !/ModelDeclarationAst|PhpAstValue|compiler\/scanner/.test(read('packages/core/src/types/upstream/eloquentRelationFactsAuthorityInterface.ts'))],
  ['authority owns relation AST construction', /eloquentRelationAstFromDescriptor/.test(read('packages/core/src/types/upstream/eloquentRelationFactsAuthority.ts'))],
  ['scanner producer uses upstream authority', /eloquentRelationFactsAuthority\.judge/.test(read('packages/core/src/compiler/scanner/modelRelationFactsProducer.ts'))],
  ['scanner producer exports a typed interface constant', /export const modelRelationFactsProducer:\s*ModelRelationFactsProducerInterface/.test(read('packages/core/src/compiler/scanner/modelRelationFactsProducer.ts'))],
  ['scanner producer has no relation/foundation imports', !/semantic\/(relations|foundation)/.test(read('packages/core/src/compiler/scanner/modelRelationFactsProducer.ts'))],
  ['model pipeline is wired to producer', /modelRelationFactsProducer\.scan/.test(read('packages/core/src/compiler/scanner/laravelModelScanner.ts'))],
  ['old relation parser retired', !exists('packages/core/src/compiler/scanner/operations/model/memberRelationsParser.ts')],
  ['old relation producer retired', !exists('packages/core/src/compiler/scanner/operations/model/eloquentProducer.ts')],
  ['authority is exported through upstream barrel', /eloquentRelationFactsAuthorityInterface/.test(read('packages/core/src/types/upstream/index.ts'))],
];
for (const [label, passed] of checks) process.stdout.write(`${passed ? 'PASS' : 'FAIL'} ${label}\n`);
const failed = checks.filter(([, passed]) => !passed);
process.stdout.write(`\nPhase2466 audit: ${checks.length - failed.length}/${checks.length}\n`);
if (failed.length) process.exitCode = 1;
