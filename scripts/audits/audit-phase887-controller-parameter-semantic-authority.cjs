const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '../..');
const target = path.join(root, 'packages/core/src/compiler/scanner/descriptors/request/controllerActionContract.ts');
const parser = path.join(root, 'packages/core/src/compiler/scanner/lexer/controllerMethodParser.ts');
const text = fs.readFileSync(target, 'utf8');
const parserText = fs.readFileSync(parser, 'utf8');

const parserProducesSemantic = parserText.includes('semantic: parameterSemantic') && parserText.includes("kind: 'model_origin'") && parserText.includes("kind: 'request_origin'");
const noParameterTypeReads = !text.includes('parameter.type');
const noModelNamesContext = !text.includes('modelNames');
const requestUsesSemantic = text.includes("relationEqual(parameter.semantic.kind, 'request_origin')");
const dependenciesUseSemantic = text.includes('controllerParameterClassName(parameter.semantic)');
const methodExcludesSemanticRoutes = text.includes("relationEqual(parameter.semantic.kind, 'model_origin')") && text.includes("relationEqual(parameter.semantic.kind, 'request_origin')");
const oldTypeParserRemoved = !text.includes('function namedParameterType(');
const noControllerModelReconstruction = !/toPascalCase\(/.test(text);

const emptyLegacyFiles = [];
function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(p);
    else if (entry.isFile() && fs.statSync(p).size === 0) emptyLegacyFiles.push(path.relative(root, p));
  }
}
walk(root);

const report = {
  phase: 887,
  authority: 'controller_parameter_semantic',
  classification: parserProducesSemantic && noParameterTypeReads && noModelNamesContext && requestUsesSemantic && dependenciesUseSemantic && methodExcludesSemanticRoutes && oldTypeParserRemoved && noControllerModelReconstruction ? 'UPSTREAM_CONTROLLER_PARAMETER_SEMANTIC_AUTHORITY' : 'REVIEW_REQUIRED',
  controllerActionContract: path.relative(root, target),
  controllerMethodParser: path.relative(root, parser),
  parserProducesSemantic,
  noParameterTypeReads,
  noModelNamesContext,
  requestUsesSemantic,
  dependenciesUseSemantic,
  methodExcludesSemanticRoutes,
  oldTypeParserRemoved,
  noControllerModelReconstruction,
  emptyLegacyFileCount: emptyLegacyFiles.length,
  emptyLegacyFileCountStable: emptyLegacyFiles.length >= 203,
  deletedFiles: 0,
  conclusion: 'ControllerActionContract now consumes ControllerParameterAst.semantic as the authority for request/model classification and dependency type identity. It no longer reparses parameter.type, carries modelNames solely to rediscover model dependencies, or reconstructs controller model names downstream.'
};

fs.writeFileSync(path.join(root, 'scripts/audits/phase887-controller-parameter-semantic-authority.json'), JSON.stringify(report, null, 2) + '\n');
const ok = report.classification === 'UPSTREAM_CONTROLLER_PARAMETER_SEMANTIC_AUTHORITY' && report.emptyLegacyFileCountStable;
console.log(JSON.stringify({ ...report, pass: ok }, null, 2));
process.exit(ok ? 0 : 1);
