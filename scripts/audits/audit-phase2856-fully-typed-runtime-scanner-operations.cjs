const fs = require('node:fs');
const path = require('node:path');

const root = process.cwd();
const walk = (directory) => fs.existsSync(directory)
  ? fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
      const target = path.join(directory, entry.name);
      return entry.isDirectory() ? walk(target) : target.endsWith('.ts') ? [target] : [];
    })
  : [];
const relative = (file) => path.relative(root, file).split(path.sep).join('/');
const productionFiles = [
  ...walk(path.join(root, 'packages/core/src/compiler/scanner')),
  ...walk(path.join(root, 'packages/core/src/types/upstream')),
  ...walk(path.join(root, 'packages/cli/src')),
].filter((file) => !/\/__tests?__?\//.test(relative(file)));
const source = (file) => fs.readFileSync(file, 'utf8');
const allRuntimeSource = productionFiles.map((file) => ({ file: relative(file), text: source(file) }));
const relationImports = allRuntimeSource.flatMap(({ file, text }) =>
  [...text.matchAll(/from\s*['"][^'"]*semantic\/relations[^'"]*['"]/g)].map((match) => ({ file, statement: match[0] })));
const exportedFunctions = allRuntimeSource.flatMap(({ file, text }) =>
  [...text.matchAll(/^\s*export\s+(?:async\s+)?function\s+([A-Za-z_$][\w$]*)/gm)].map((match) => ({ file, name: match[1] })));
const routeDomainPath = path.join(root, 'packages/core/src/types/upstream/routeDomainAuthority.ts');
const dtoBindingAuthority = source(path.join(root, 'packages/core/src/types/upstream/laravelDtoTypeReferenceBindingAuthority.ts'));
const dtoBindingInterface = source(path.join(root, 'packages/core/src/types/upstream/laravelDtoTypeReferenceBindingInterface.ts'));
const routeDomain = source(routeDomainPath);
const collectionsPath = path.join(root, 'packages/core/src/types/upstream/collections.ts');
const collectionsBytes = fs.existsSync(collectionsPath) ? fs.statSync(collectionsPath).size : null;
const checks = {
  routeRegisterEvidenceClosedAdt: /type RouteRegisterEvidence\s*=\s*RouteRegisterPathEvidence\s*\|\s*RouteRegisterActionEvidence\s*\|\s*RouteRegisterAbsentEvidence/.test(routeDomain),
  routeRegisterEvidenceContinuation: /interface RouteRegisterEvidenceContinuationHandlersInterface/.test(routeDomain) && /continueWith: \(handlers: RouteRegisterEvidenceContinuationHandlersInterface\)/.test(routeDomain),
  interfaceFirstRegisterAuthority: /export const routeRegisterEvidenceAuthority:\s*RouteRegisterEvidenceAuthorityInterface\s*=\s*Object\.freeze\(/.test(routeDomain),
  routeDomainNoRelationImports: !/from\s*['\"][^'\"]*semantic\/relations[^'\"]*['\"]/.test(routeDomain),
  collectionsEmpty: collectionsBytes === 0,
  noExportFunctionOnProductionRuntimePath: exportedFunctions.length === 0,
  cliHasNoRelationImports: relationImports.every(({ file }) => !file.startsWith('packages/cli/src/')),
  dtoBindingFactoryInterfaceFirst: /export const laravelDtoTypeReferenceBindingAuthorityFactory:\s*LaravelDtoTypeReferenceBindingAuthorityFactoryInterface\s*=\s*Object\.freeze\(/.test(dtoBindingAuthority),
  dtoBindingFactoryContractDeclared: /interface LaravelDtoTypeReferenceBindingAuthorityFactoryInterface/.test(dtoBindingInterface),
  dtoBindingFactoryHasDomainOperation: /readonly create:/.test(dtoBindingInterface) && /create: createLaravelDtoTypeReferenceBindingAuthorityImplementation/.test(dtoBindingAuthority),
  noExportedDtoBindingFactoryFunction: !/export const createLaravelDtoTypeReferenceBindingAuthority\s*=/.test(dtoBindingAuthority),
};
const result = {
  phase: 2857,
  title: 'Fully Typed Runtime Scanner Operations Audit — ADT Factory Closure',
  runtimeFileCount: allRuntimeSource.length,
  relationImportStatementCount: relationImports.length,
  relationImportFileCount: new Set(relationImports.map(({ file }) => file)).size,
  scannerUpstreamCliExportFunctionDeclarations: exportedFunctions,
  collectionsBytes,
  checks,
  remainingRelationImportFiles: [...new Set(relationImports.map(({ file }) => file))].sort(),
};
console.log(JSON.stringify(result, null, 2));
if (Object.values(checks).some((passed) => !passed)) process.exitCode = 1;
