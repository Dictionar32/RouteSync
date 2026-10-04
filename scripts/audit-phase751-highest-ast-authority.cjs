const fs = require('fs');
const path = require('path');

const root = process.cwd();
const productionRoots = [
  'packages/core/src',
  'packages/cli/src',
  'packages/sdk/src',
  'packages/react/src',
];

const filesUnder = rootPath => {
  const absolute = path.join(root, rootPath);
  if (!fs.existsSync(absolute)) return [];
  const visit = current => fs.readdirSync(current, { withFileTypes: true }).flatMap(entry => {
    const full = path.join(current, entry.name);
    if (entry.isDirectory()) return visit(full);
    return entry.name.endsWith('.ts') ? [full] : [];
  });
  return visit(absolute);
};

const productionFiles = productionRoots.flatMap(filesUnder)
  .filter(file => !file.includes(`${path.sep}__tests__${path.sep}`))
  .filter(file => !file.endsWith('.test.ts'));

const read = file => fs.readFileSync(file, 'utf8');
const stripComments = source => source
  .replace(/\/\*[\s\S]*?\*\//g, '')
  .replace(/\/\/.*$/gm, '');

const source = file => stripComments(read(file));
const relative = file => path.relative(root, file);
const has = (pattern, files = productionFiles) => files.filter(file => pattern.test(source(file))).map(relative);

const coreProductionFiles = productionFiles.filter(file => file.includes(`${path.sep}packages${path.sep}core${path.sep}src${path.sep}`));
const legacyAstImports = has(/from\s+['\"][^'\"]*(?:types\/field|\.\/field|\.\.\/field|fieldCatamorphism)['\"]/, coreProductionFiles);
const parsedFieldSymbols = has(/\b(?:ParsedField|FieldNode|MethodCallField|LiteralField|FieldArgument|FieldNodeVisitor|matchFieldNode)\b/, coreProductionFiles);
const relationIndexEntriesRefs = has(/\brelationIndexEntries\b/);
const changedFiles = [
  'packages/core/src/compiler/passes/CompilationState.ts',
  'packages/core/src/semantic/kernel/relationMembership.ts',
  'packages/core/src/types/domain/fieldBinding.ts',
  'packages/core/src/types/domain/modelEntityDefinition.ts',
  'packages/core/src/types/domain/routeEntityDefinition.ts',
  'packages/core/src/types/semantic/irHints.ts',
  'packages/core/src/semantic/modelNodes.ts',
  'packages/core/src/semantic/plugins/method-return/selectRawProjection.ts',
  'packages/core/src/types/semantic/kernelTypes.ts',
  'packages/core/src/ir/buildIRNode.ts',
];

const changedText = changedFiles.map(file => path.join(root, file)).filter(fs.existsSync).map(file => ({ file, text: source(file) }));
const forbidden = /\b(?:if|while|for|switch|map|filter|reduce|flatMap|undefined|null|unknown|any|new)\b|\?\?|===|\bas\b/;
const hostConstructBoundaryFiles = [
  'packages/core/src/types/domain/fieldBinding.ts',
  'packages/core/src/types/domain/routeEntityDefinition.ts',
];
const changedForbidden = hostConstructBoundaryFiles
  .map(file => path.join(root, file))
  .filter(fs.existsSync)
  .filter(file => forbidden.test(source(file)))
  .map(relative);

const emptyLegacyFiles = [
  'packages/core/src/types/field.ts',
  'packages/core/src/types/domain/fieldCatamorphism.ts',
].map(file => ({ file, bytes: fs.statSync(path.join(root, file)).size }));

const result = {
  phase: 751,
  model: 'canonical-php-ast-authority-and-dead-relation-api-vacuum',
  checks: {
    buildFrontierRelationIndexEntriesRemoved: relationIndexEntriesRefs.length === 0,
    canonicalPhpAstIsProductionSyntaxAuthority: legacyAstImports.length === 0,
    legacyFieldSymbolsAbsentFromProduction: parsedFieldSymbols.length === 0,
    legacyFieldFilesEmptyAfterReferenceAudit: emptyLegacyFiles.every(entry => entry.bytes === 0),
    changedFilesHostConstructFree: changedForbidden.length === 0,
  },
  evidence: {
    relationIndexEntriesRefs,
    legacyAstImports,
    parsedFieldSymbols,
    changedForbidden,
    emptyLegacyFiles,
  },
};

result.failed = Object.entries(result.checks).filter(([, ok]) => !ok).map(([name]) => name);
result.pass = result.failed.length === 0;
console.log(JSON.stringify(result, null, 2));
process.exitCode = result.pass ? 0 : 1;
