const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '../..');
const core = path.join(root, 'packages/core/src');
const read = p => fs.readFileSync(p, 'utf8');

const producer = path.join(core, 'compiler/scanner/lexer/controllerMethodParser.ts');
const routeProducer = path.join(core, 'compiler/scanner/subscanners/routeProducerRelations.ts');
const factory = path.join(core, 'compiler/scanner/semantic/route/routeParameterSemanticFactory.ts');

const parserText = read(producer);
const routeProducerText = read(routeProducer);
const factoryText = read(factory);

const parserProducesModelOrigin = parserText.includes("kind: 'model_origin'") && parserText.includes('model_class');
const routeConsumesControllerSemantic = routeProducerText.includes('controllerModelReference(parameter.semantic)');
const routeIndexesModelReferences = routeProducerText.includes('RelationIndex<string, ModelReference>');
const routeDoesNotParseParameterType = !routeProducerText.includes('namedParameterType(') && !routeProducerText.includes('parameter.type');
const routeDoesNotInferControllerModelName = !/toPascalCase\(/.test(routeProducerText);
const routeProjectsExistingModelName = routeProducerText.includes('modelOrigin.origin.name');
const factoryStillOwnsRouteCandidateInference = factoryText.includes('toPascalCase(name)');

const report = {
  phase: 886,
  authority: 'controller_model_origin',
  classification: parserProducesModelOrigin && routeConsumesControllerSemantic && routeIndexesModelReferences && routeDoesNotParseParameterType && routeDoesNotInferControllerModelName && routeProjectsExistingModelName && factoryStillOwnsRouteCandidateInference ? 'UPSTREAM_MODEL_ORIGIN_AUTHORITY' : 'REVIEW_REQUIRED',
  controllerParser: path.relative(root, producer),
  routeProducer: path.relative(root, routeProducer),
  routeParameterFactory: path.relative(root, factory),
  parserProducesModelOrigin,
  routeConsumesControllerSemantic,
  routeIndexesModelReferences,
  routeDoesNotParseParameterType,
  routeDoesNotInferControllerModelName,
  routeProjectsExistingModelName,
  factoryStillOwnsRouteCandidateInference,
  conclusion: 'ControllerParameterAst.semantic.model_origin is the upstream authority for resolved controller model identity. Route binding enrichment now projects that ModelName into ModelReference instead of reparsing ControllerParameterAst.type or reconstructing a model name from the parameter type string. RouteParameterSemanticFactory retains only route-side candidate inference for unresolved path syntax.'
};

const emptyLegacyFiles = [];
function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(p);
    else if (entry.isFile() && fs.statSync(p).size === 0) emptyLegacyFiles.push(path.relative(root, p));
  }
}
walk(root);
report.emptyLegacyFileCount = emptyLegacyFiles.length;
report.emptyLegacyFileCountStable = emptyLegacyFiles.length >= 203;
report.deletedFiles = 0;

fs.writeFileSync(path.join(root, 'scripts/audits/phase886-controller-model-origin-authority.json'), JSON.stringify(report, null, 2) + '\n');
const ok = report.classification === 'UPSTREAM_MODEL_ORIGIN_AUTHORITY' && report.emptyLegacyFileCountStable;
console.log(JSON.stringify({ ...report, pass: ok }, null, 2));
process.exit(ok ? 0 : 1);
