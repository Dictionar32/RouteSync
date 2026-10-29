const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
let ts;
try { ts = require('typescript'); } catch {
  try { ts = require('/opt/nvm/versions/node/v22.16.0/lib/node_modules/typescript'); } catch { ts = undefined; }
}
const root = process.cwd();
const sourceRoot = path.join(root, 'packages');
const files = [];
const candidates = [];
const totals = { exportFunction: 0, exportedArrowConst: 0 };
const byPackage = {};

function visit(directory) {
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const fullPath = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      if (entry.name !== 'node_modules' && entry.name !== 'dist') visit(fullPath);
      continue;
    }
    if (!entry.isFile() || !/\.tsx?$/.test(entry.name)) continue;
    const relativePath = path.relative(root, fullPath).split(path.sep).join('/');
    const content = fs.readFileSync(fullPath, 'utf8');
    files.push(relativePath);
    const lines = content.split(/\r?\n/);
    lines.forEach((line, index) => {
      let kind;
      let name;
      if (/^\s*export\s+(?:declare\s+)?(?:default\s+)?(?:async\s+)?function\b/.test(line)) {
        kind = 'export_function';
        name = (line.match(/^\s*export\s+(?:declare\s+)?(?:default\s+)?(?:async\s+)?function\s*\*?\s*([A-Za-z_$][\w$]*)?/) || [])[1] || '<anonymous-or-generator>';
      } else if (/^\s*export\s+(?:const|let|var)\s+[A-Za-z_$][\w$]*\s*=\s*(?:async\s*)?\(/.test(line)) {
        kind = 'export_arrow_const';
        name = (line.match(/^\s*export\s+(?:const|let|var)\s+([A-Za-z_$][\w$]*)/) || [])[1] || '<unresolved>';
      }
      if (!kind) return;
      totals[kind === 'export_function' ? 'exportFunction' : 'exportedArrowConst'] += 1;
      const packageName = relativePath.split('/')[1] || '<root>';
      byPackage[packageName] ||= { exportFunction: 0, exportedArrowConst: 0, files: new Set() };
      byPackage[packageName][kind === 'export_function' ? 'exportFunction' : 'exportedArrowConst'] += 1;
      byPackage[packageName].files.add(relativePath);
      candidates.push({ file: relativePath, line: index + 1, kind, name, declaration: line.trim() });
    });
  }
}
visit(sourceRoot);

const targetInterfaceFile = path.join(sourceRoot, 'core/src/types/upstream/phpClassNameResolutionInterface.ts');
const targetContent = fs.readFileSync(targetInterfaceFile, 'utf8');
const factoryCallCount = files.reduce((count, file) => count + (fs.readFileSync(path.join(root, file), 'utf8').match(/phpQualifiedClassNameFactory\.create\(/g) || []).length, 0);
const directFactoryCallCount = files.reduce((count, file) => count + (fs.readFileSync(path.join(root, file), 'utf8').match(/phpQualifiedClassNameFactory\s*\(/g) || []).length, 0);
const touchedFiles = files.filter(file => fs.readFileSync(path.join(root, file), 'utf8').includes('phpQualifiedClassNameFactory'));
const syntaxDiagnostics = ts ? touchedFiles.flatMap(file => {
  const result = ts.transpileModule(fs.readFileSync(path.join(root, file), 'utf8'), {
    fileName: file,
    reportDiagnostics: true,
    compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS },
  });
  return (result.diagnostics || []).filter(diagnostic => diagnostic.category === ts.DiagnosticCategory.Error).map(diagnostic => ({ file, message: ts.flattenDiagnosticMessageText(diagnostic.messageText, '\n') }));
}) : [{ file: '<typescript>', message: 'TypeScript compiler API unavailable; syntax transpilation was not run.' }];
let factoryRuntimeSmoke = false;
if (ts) {
  const compiled = ts.transpileModule(targetContent, { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS } }).outputText;
  const module = { exports: {} };
  new Function('exports', 'require', 'module', compiled)(module.exports, require, module);
  const result = module.exports.phpQualifiedClassNameFactory.create('\\App\\Models\\User');
  factoryRuntimeSmoke = result.kind === 'php_qualified_class_name' && result.value.value === 'App\\Models\\User';
}
const checks = {
  targetHasExplicitFactoryInterface: /export interface PhpQualifiedClassNameFactoryInterface\s*\{/.test(targetContent),
  targetHasInterfaceTypedObjectExport: /export const phpQualifiedClassNameFactory:\s*PhpQualifiedClassNameFactoryInterface\s*=\s*Object\.freeze\(\s*\{/.test(targetContent),
  targetHasDomainCreateOperation: /readonly create:\s*\(value:\s*string\)\s*=>\s*PhpQualifiedClassName/.test(targetContent) && /create:\s*\(value: string\): PhpQualifiedClassName\s*=>/.test(targetContent),
  allDirectConsumersUseCreateOperation: directFactoryCallCount === 0 && factoryCallCount > 0,
  syntaxTranspilationClean: syntaxDiagnostics.length === 0,
  factoryRuntimeSmoke,
  oldHelperNameAbsentFromPackages: !files.some(file => fs.readFileSync(path.join(root, file), 'utf8').includes('createPhpQualifiedClassName')),
  noRelationFoundationFilesRestored: ![
    'packages/core/src/semantic/relations/relationMembership.ts',
    'packages/core/src/semantic/relations/relationalSequence.ts',
    'packages/core/src/semantic/relations/semanticRelations.ts',
  ].some(file => fs.existsSync(path.join(root, file))),
  collectionsInvariantPreserved: fs.readFileSync(path.join(sourceRoot, 'core/src/types/upstream/collections.ts'), 'utf8') === '\n',
};

const serializedByPackage = Object.fromEntries(Object.entries(byPackage).map(([name, data]) => [name, {
  exportFunction: data.exportFunction,
  exportedArrowConst: data.exportedArrowConst,
  files: data.files.size,
}]));
const report = {
  phase: 3086,
  title: 'Repository-wide Export Interface Migration Inventory',
  scope: 'packages/**/*.ts and packages/**/*.tsx',
  sourceFileCount: files.length,
  candidateFileCount: new Set(candidates.map(candidate => candidate.file)).size,
  totals,
  remainingCandidates: totals.exportFunction + totals.exportedArrowConst,
  byPackage: serializedByPackage,
  migrationWave: {
    operation: 'phpQualifiedClassNameFactory',
    source: 'packages/core/src/types/upstream/phpClassNameResolutionInterface.ts',
    consumerCallSites: factoryCallCount,
    outcome: 'migrated to an interface-typed domain operation object; all direct consumers use .create(...)',
  },
  checks,
  syntaxDiagnostics,
  candidates,
};
const reportPath = path.join(root, 'PHASE3086_REPOSITORY_WIDE_EXPORT_INTERFACE_MIGRATION_INVENTORY.json');
fs.writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`);
for (const [name, passed] of Object.entries(checks)) console.log(`${passed ? 'PASS' : 'FAIL'} ${name}`);
console.log(`INVENTORY export function=${totals.exportFunction}; export arrow const=${totals.exportedArrowConst}; remaining=${report.remainingCandidates}`);
console.log(`REPORT ${path.relative(root, reportPath)}`);
if (Object.values(checks).some(passed => !passed)) process.exitCode = 1;
