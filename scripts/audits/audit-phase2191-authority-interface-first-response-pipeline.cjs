const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '../..');
const read = relative => fs.readFileSync(path.join(root, relative), 'utf8');
const checks = [
  ['value projection authority has an explicit interface', read('packages/core/src/types/upstream/laravelDtoResponseValueProjectionInterface.ts').includes('interface LaravelDtoResponseValueProjectionAuthorityInterface')],
  ['contract projection authority has an explicit interface', read('packages/core/src/types/upstream/laravelDtoResponseContractProjectionInterface.ts').includes('interface LaravelDtoResponseContractProjectionAuthorityInterface')],
  ['value authority object implements its interface', read('packages/core/src/types/upstream/laravelDtoResponseValueProjectionAuthority.ts').includes('laravelDtoResponseValueProjectionAuthority: LaravelDtoResponseValueProjectionAuthorityInterface')],
  ['contract authority receives value authority through interface', read('packages/core/src/types/upstream/laravelDtoResponseContractProjectionAuthority.ts').includes('valueProjectionAuthority: LaravelDtoResponseValueProjectionAuthorityInterface')],
  ['pipeline factory receives contract authority through interface', read('packages/core/src/types/upstream/laravelControllerResponseSemanticPipeline.ts').includes('dtoResponseContractProjection: LaravelDtoResponseContractProjectionAuthorityInterface')],
  ['pipeline exposes the injected authority instead of rebuilding it', read('packages/core/src/types/upstream/laravelControllerResponseSemanticPipeline.ts').includes('dtoResponseContractProjection,\n  responseExecutor')],
  ['runtime executor delegates exact project method', read('packages/core/src/types/upstream/laravelDtoResponseContractProjectionAuthority.ts').includes('execute: laravelDtoResponseContractProjectionAuthority.project')],
  ['response scanner accepts pipeline interface injection', read('packages/core/src/compiler/scanner/operations/responseScanner.ts').includes('responsePipeline: LaravelControllerResponseSemanticPipelineInterface = laravelControllerResponseSemanticPipeline')],
  ['pipeline contract version bumped to 25', read('packages/core/src/types/upstream/laravelControllerResponseSemanticPipeline.ts').includes('contractVersion: 25')],
  ['no new relation/foundation/subscanner authority module introduced', !fs.existsSync(path.join(root, 'packages/core/src/types/upstream/laravelDtoResponseProjectionRelation.ts')) && !fs.existsSync(path.join(root, 'packages/core/src/types/upstream/laravelDtoResponseProjectionFoundation.ts'))],
];
let failures = 0;
for (const [name, passed] of checks) {
  process.stdout.write(`${passed ? 'PASS' : 'FAIL'} ${name}\n`);
  if (!passed) failures += 1;
}
process.stdout.write(`RESULT ${checks.length - failures}/${checks.length}\n`);
process.exitCode = failures === 0 ? 0 : 1;
