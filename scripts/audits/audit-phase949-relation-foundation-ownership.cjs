const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '../..');
const core = path.join(root, 'packages/core/src');
const upstream = path.join(core, 'types/upstream');
const kernel = path.join(core, 'semantic/kernel');
const foundation = path.join(core, 'semantic/foundation');

const read = p => fs.readFileSync(p, 'utf8');
const walk = dir => fs.readdirSync(dir, { withFileTypes: true }).flatMap(e => {
  const p = path.join(dir, e.name);
  return e.isDirectory() ? walk(p) : [p];
});
const tsFiles = dir => walk(dir).filter(p => /\.(ts|tsx)$/.test(p));
const imports = (dir, needle) => tsFiles(dir).filter(p => read(p).includes(needle)).map(p => path.relative(root, p).replaceAll('\\','/'));

const foundationFiles = [
  'relationFoundation.ts',
  'relationMembership.ts',
  'relationalSequence.ts',
  'semanticRelations.ts',
].map(f => path.join(foundation, f));

const result = {
  foundationExists: fs.existsSync(foundation),
  foundationModulesPresent: foundationFiles.every(fs.existsSync),
  upstreamImportsKernel: imports(upstream, 'semantic/kernel'),
  kernelImportsUpstream: imports(kernel, 'types/upstream'),
  foundationImportsUpstream: imports(foundation, 'types/upstream'),
  foundationImportsCompiler: imports(foundation, 'compiler/'),
  foundationImportsScanner: imports(foundation, 'scanner/'),
  sequenceOwnedByFoundation: read(path.join(foundation, 'relationalSequence.ts')).includes('export type Sequence<T>'),
  upstreamCollectionsReexportsSequence: read(path.join(upstream, 'collections.ts')).includes("export type { Sequence } from '../../semantic/foundation/relationalSequence';"),
  kernelIsCompatibilityFacade: [
    'relationFoundation.ts','relationMembership.ts','relationalSequence.ts','semanticRelations.ts'
  ].every(f => read(path.join(kernel,f)).includes("../foundation/")),
};
result.acyclicOwnershipBoundary = result.upstreamImportsKernel.length === 0 &&
  result.kernelImportsUpstream.length === 0 &&
  result.foundationImportsUpstream.length === 0 &&
  result.foundationImportsCompiler.length === 0 &&
  result.foundationImportsScanner.length === 0;
result.clean = result.foundationExists && result.foundationModulesPresent &&
  result.acyclicOwnershipBoundary && result.sequenceOwnedByFoundation &&
  result.upstreamCollectionsReexportsSequence && result.kernelIsCompatibilityFacade;
console.log(JSON.stringify(result, null, 2));
process.exitCode = result.clean ? 0 : 1;
