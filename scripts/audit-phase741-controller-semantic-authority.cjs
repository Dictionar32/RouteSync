const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
const contract = read('packages/core/src/compiler/scanner/subscanners/controller/controllerDataflowContract.ts');
const canonical = read('packages/core/src/compiler/scanner/subscanners/controller/controllerAstCanonical.ts');
const analyzer = read('packages/core/src/compiler/scanner/lexer/controllerDataflowAnalyzer.ts');
const bodyTypes = read('packages/core/src/compiler/scanner/lexer/controllerBodyAstTypes.ts');
const upstream = read('packages/core/src/types/upstream/controller.ts');
const actionContract = read('packages/core/src/compiler/scanner/descriptors/request/controllerActionContract.ts');

const productionRoot = path.join(root, 'packages/core/src');
const files = [];
const visit = dir => {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const file = path.join(dir, entry.name);
    if (entry.isDirectory()) visit(file);
    else if (entry.name.endsWith('.ts') && !file.includes(`${path.sep}__test__${path.sep}`)) files.push(file);
  }
};
visit(productionRoot);
const production = files.map(file => fs.readFileSync(file, 'utf8')).join('\n');

const checks = {
  upstreamCanonicalVariableFlowExists: upstream.includes('export interface ControllerSemanticVariableFlow'),
  bodyCarriesCanonicalVariableFlow: bodyTypes.includes('readonly semanticVariables: ControllerSemanticVariableFlow;'),
  analyzerProducesCanonicalVariableFlow: analyzer.includes('canonicalSemanticVariables(definitions, filePath)') && analyzer.includes('semanticVariables,'),
  analyzerUsesUpstreamVariableDefinitions: analyzer.includes('ControllerVariableDefinition, ControllerVariableOrigin'),
  canonicalConsumerUsesSemanticVariables: canonical.includes('method.body.dataflow.semanticVariables.variables'),
  canonicalNoLongerReadsLegacyDefinitions: !canonical.includes('method.body.dataflow.definitions'),
  contractNoLegacyAstProperty: !contract.includes('readonly ast:'),
  contractConsumesCanonicalVariableFlow: contract.includes('return evidence.semanticVariables;'),
  contractResourceLookupUsesCanonicalVariables: contract.includes('evidence.semanticVariables'),
  actionContractPassesSourceFile: actionContract.includes('createControllerDataflowContract(body.dataflow, method.parameters, returned, resourceResponse, sourceFile.value.value)'),
  legacyDefinitionsOnlyCompatibilityAndAnalyzerEvidence: (production.match(/\.dataflow\.definitions/g) || []).length === 0,
  legacyParsedDescriptorNotContractOutput: !contract.includes('ControllerSemanticVariableDefinition'),
  analyzerForbiddenHostConstructsAbsent: !/\b(if|while|for|switch)\b|\.map\s*\(|\.filter\s*\(|\.reduce\s*\(|\.flatMap\s*\(|\bundefined\b|\?\?|\bnull\b|===|\bunknown\b|\bany\b|\bnew\b/.test(analyzer),
};

const failed = Object.entries(checks).filter(([, value]) => !value).map(([key]) => key);
const result = { phase: 741, checks, failed, pass: failed.length === 0 };
console.log(JSON.stringify(result, null, 2));
process.exit(result.pass ? 0 : 1);
