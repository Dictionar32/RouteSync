const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '../..');
const checks = [];
const read = relative => fs.readFileSync(path.join(root, relative), 'utf8');
const exists = relative => fs.existsSync(path.join(root, relative));
const check = (name, passed, detail) => checks.push({ name, passed: Boolean(passed), detail });
const sourceFiles = [];
const collect = directory => {
  for (const entry of fs.readdirSync(path.join(root, directory), { withFileTypes: true })) {
    const relative = path.join(directory, entry.name);
    if (entry.isDirectory()) collect(relative);
    else if (entry.isFile() && relative.endsWith('.ts')) sourceFiles.push(relative);
  }
};
collect('packages/core/src');
const foundationReferences = sourceFiles.flatMap(file => {
  const source = read(file);
  return [...source.matchAll(/relationFoundation/g)].map(() => file);
});
const relationFoundationFiles = [
  'packages/core/src/semantic/relations/relationFoundation.ts',
  'packages/core/src/semantic/kernel/relationFoundation.ts',
  'packages/core/src/semantic/foundation/relationFoundation.ts',
];

const semanticRelations = read('packages/core/src/semantic/relations/semanticRelations.ts');
const relationalSequence = read('packages/core/src/semantic/relations/relationalSequence.ts');
const relationMembership = read('packages/core/src/semantic/relations/relationMembership.ts');
const cliScan = read('packages/cli/src/commands/scan.ts');
const cliSync = read('packages/cli/src/commands/sync.ts');
const composition = read('packages/cli/src/upstreamCompositionFactory.ts');
const manifestBuilder = read('packages/core/src/compiler/scanner/wiring/upstreamManifestBuilder.ts');

check('relationFoundation has no remaining source references', foundationReferences.length === 0, `${foundationReferences.length} references remain across ${new Set(foundationReferences).size} TypeScript files`);
check('no relationFoundation module was recreated', relationFoundationFiles.every(file => !exists(file)), 'all former foundation paths remain absent');
check('semantic predicates have a named operation interface', /export interface SemanticRelationOperationsInterface/.test(semanticRelations) && /export const semanticRelationOperations:\s*SemanticRelationOperationsInterface\s*=\s*Object\.freeze/.test(semanticRelations), 'predicate and branch operations are exposed as a frozen interface-first object');
check('semantic relation option ADT is explicitly tagged', /kind: 'none'/.test(semanticRelations) && /kind: 'some'/.test(semanticRelations) && /export const relationOptionFold:\s*RelationOptionFoldOperationInterface/.test(semanticRelations), 'none/some remain distinct typed variants with an explicit fold contract');
check('sequence overloads no longer export function declarations', !/export function relationSelect/.test(relationalSequence) && !/export function relationFirstOption/.test(relationalSequence) && /export const relationSelect:\s*RelationSelectOperationInterface/.test(relationalSequence) && /export const relationFirstOption:\s*RelationFirstOptionOperationInterface/.test(relationalSequence), 'overloaded public sequence entrypoints use typed const contracts');
check('membership uses interface-first semantic operations on runtime path', /semanticRelationOperations\.resolve\(/.test(relationMembership) && /semanticRelationOperations\.equal\(/.test(relationMembership) && /semanticRelationOperations\.all\(/.test(relationMembership) && !/relationFoundation/.test(relationMembership), 'membership runtime calls the typed operation object rather than importing free predicate entrypoints');
check('CLI scan still enters the manifest scan operation', /manifestScanOperation/.test(cliScan) && /\.scan\(/.test(cliScan), 'scan continues through the composed manifest scan operation');
check('CLI sync still enters the manifest scan operation', /manifestScanOperation/.test(cliSync) && /\.scan\(/.test(cliSync), 'sync continues through the composed manifest scan operation');
check('CLI composition still creates the upstream manifest operation', /manifestScanOperation:\s*routeSyncCliManifestScanOperationFactory\.create\(manifestComposition\)/.test(composition), 'the CLI composition remains the source of manifest scan authority');
check('manifest builder preserves complete and blocked judgments', /kind:\s*'manifest_builder_complete'/.test(manifestBuilder) && /kind:\s*'manifest_builder_blocked'/.test(manifestBuilder), 'complete and blocked ADT cases remain distinct');

const result = {
  phase: 2733,
  audit: 'relation-ownership-runtime',
  checks,
  passed: checks.filter(item => item.passed).length,
  total: checks.length,
  relationFoundationReferences: foundationReferences.length,
  relationFoundationFiles: relationFoundationFiles.filter(exists),
};
const reportDirectory = path.join(root, 'reports');
fs.mkdirSync(reportDirectory, { recursive: true });
fs.writeFileSync(path.join(reportDirectory, 'PHASE2733_RELATION_OWNERSHIP_RUNTIME_AUDIT.json'), `${JSON.stringify(result, null, 2)}\n`);
for (const item of checks) console.log(`${item.passed ? 'PASS' : 'FAIL'} ${item.name}: ${item.detail}`);
console.log(`RESULT ${result.passed}/${result.total}`);
process.exitCode = result.passed === result.total ? 0 : 1;
