const fs = require('fs');
const path = require('path');

const root = process.cwd();
const read = relative => fs.readFileSync(path.join(root, relative), 'utf8');
const productionFiles = dir => {
  const base = path.join(root, dir);
  const out = [];
  const walk = current => {
    for (const entry of fs.readdirSync(current, { withFileTypes: true })) {
      const full = path.join(current, entry.name);
      if (entry.isDirectory()) walk(full);
      else if (entry.isFile() && full.endsWith('.ts') && !full.includes(`${path.sep}__tests__${path.sep}`)) out.push(full);
    }
  };
  walk(base);
  return out;
};
const text = file => fs.readFileSync(file, 'utf8');
const has = (file, pattern) => pattern.test(text(file));
const allProduction = [...productionFiles('packages/core/src'), ...productionFiles('packages/cli/src')];
const legacyRefs = allProduction.filter(file => /ParsedModel|ParsedResource|ResourceFieldDescriptor/.test(text(file)));
const forbidden = /\b(if|while|for|switch|map|filter|reduce|flatMap|undefined|null|any|new)\b|\?\?|===|as unknown/;
const targeted = [
  'packages/core/src/types/domain/resourceFieldSemanticBinding.ts',
  'packages/core/src/types/domain/executionSignatures.ts',
  'packages/core/src/compiler/scanner/lexer/routeAst/syntaxErrorRelationCore.ts',
  'packages/core/src/compiler/scanner/lexer/routeAst/semanticRelationSolver.ts',
  'packages/core/src/compiler/scanner/subscanners/semantic/route-response/shapeExtractor.ts',
  'packages/core/src/compiler/scanner/subscanners/semantic/route-response/propertyProcessor.ts',
  'packages/core/src/compiler/scanner/binders/resource/composite/literalTernaryBinders.ts',
  'packages/core/src/semantic/kernel/requirementSolver.ts',
];
const forbiddenCounts = Object.fromEntries(targeted.map(file => {
  const value = fs.existsSync(path.join(root, file)) ? text(path.join(root, file)).match(forbidden) : null;
  return [file, value ? value[0] : null];
}));
const checks = {
  canonicalModelModule: !/ParsedModel/.test(read('packages/core/src/types/domain/models.ts')),
  parsedModelPublicExportRemoved: !/ParsedModel/.test(read('packages/core/src/index.ts')),
  parsedModelDomainExportRemoved: !/ParsedModel/.test(read('packages/core/src/types/domain/index.ts')),
  domainGraphUsesSemanticModel: /ModelSemanticDefinition/.test(read('packages/core/src/types/domain/domainGraph.ts')) && !/ParsedModel/.test(read('packages/core/src/types/domain/domainGraph.ts')),
  resourceModelSurfaceHasSingleSemanticEntryPoint: !/createResourceModelSurface\(model: ParsedModel/.test(read('packages/core/src/types/domain/resourceModelSurface.ts')),
  cliContextUsesSemanticModel: /ModelSemanticDefinition/.test(read('packages/cli/src/generators/semantic/SemanticResolutionContext.ts')) && !/ParsedModel/.test(read('packages/cli/src/generators/semantic/SemanticResolutionContext.ts')),
  inlineResponseUsesCanonicalBinding: /ResourceFieldSemanticBinding/.test(read('packages/cli/src/generators/semantic/ResponseResolver.ts')),
  canonicalAstExports: /export type \{ ModelAst \}/.test(read('packages/core/src/index.ts')) && /export type \{ ResourceAst \}/.test(read('packages/core/src/index.ts')),
  typeExpressionLoweringPublic: /typeExpressionToSemanticType/.test(read('packages/core/src/index.ts')),
};
const failed = Object.entries(checks).filter(([, value]) => !value).map(([key]) => key);
const result = {
  phase: 727,
  checks,
  legacyProductionReferences: legacyRefs.map(file => path.relative(root, file)),
  targetedForbiddenFirstMatch: forbiddenCounts,
  frontierCounts: {
    parserAdapter: has(path.join(root, 'packages/cli/src/parsers/php/boundaryAdapter.ts'), forbidden),
    scanner: productionFiles('packages/core/src/compiler/scanner').reduce((n, file) => n + (text(file).match(forbidden) || []).length, 0),
    upstream: productionFiles('packages/core/src/types/upstream').reduce((n, file) => n + (text(file).match(forbidden) || []).length, 0),
    compilerDomain: productionFiles('packages/core/src/compiler/domain').reduce((n, file) => n + (text(file).match(forbidden) || []).length, 0),
    domainTypes: productionFiles('packages/core/src/types/domain').reduce((n, file) => n + (text(file).match(forbidden) || []).length, 0),
  },
  failed,
  pass: failed.length === 0 && legacyRefs.length === 0,
};
console.log(JSON.stringify(result, null, 2));
process.exit(result.pass ? 0 : 1);
