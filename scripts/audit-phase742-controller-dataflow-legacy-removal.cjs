const fs = require('fs');
const path = require('path');
const root = path.resolve(__dirname, '..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
const analyzer = read('packages/core/src/compiler/scanner/lexer/controllerDataflowAnalyzer.ts');
const bodyTypes = read('packages/core/src/compiler/scanner/lexer/controllerBodyAstTypes.ts');
const lexerIndex = read('packages/core/src/compiler/scanner/lexer/index.ts');
const contract = read('packages/core/src/compiler/scanner/subscanners/controller/controllerDataflowContract.ts');
const canonical = read('packages/core/src/compiler/scanner/subscanners/controller/controllerAstCanonical.ts');
const test = read('packages/core/src/compiler/scanner/__test__/ecommerceShopDataflowPhase104.spec.ts');

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
  bodyDataflowHasCanonicalSemanticVariables: bodyTypes.includes('readonly semanticVariables: ControllerSemanticVariableFlow;'),
  bodyDataflowHasSemanticKnowledgeEvidence: bodyTypes.includes('readonly semanticKnowledgeDataFlow: SemanticKnowledgeDataFlow;'),
  bodyNoLegacyDefinitionField: !bodyTypes.includes('readonly definitions:'),
  bodyNoLegacyReferenceField: !bodyTypes.includes('readonly references:'),
  analyzerProducesCanonicalDefinitions: analyzer.includes('canonicalDefinition(') && analyzer.includes('ControllerVariableDefinition'),
  analyzerProducesCanonicalFlow: analyzer.includes('const semanticVariables = canonicalSemanticVariables(') && analyzer.includes('semanticKnowledgeDataFlow,'),
  analyzerNoLegacyCompatibilityTypes: !/LegacyController|ControllerDataflowReference|ControllerVariableReference|ControllerVariableDefinitionOrigin|LegacyControllerDefinitionAvailability/.test(analyzer),
  lexerIndexNoLegacyExports: !/ControllerDataflowReference|LegacyController|ControllerVariableReference|ControllerVariableDefinitionOrigin/.test(lexerIndex),
  productionNoLegacyDataflowFields: !/\.dataflow\.(definitions|references)/.test(production),
  contractConsumesCanonicalEvidence: contract.includes('return evidence.semanticVariables;'),
  canonicalConsumesCanonicalFlow: canonical.includes('method.body.dataflow.semanticVariables.variables'),
  testUsesCanonicalFlow: test.includes('body.dataflow.semanticVariables.variables'),
  analyzerDoesNotIntroduceLegacyHostControl: !/\bundefined\b|\bunknown\b|\bany\b|\bnew\b|\?\?|===|\.map\s*\(|\.filter\s*\(|\.reduce\s*\(|\.flatMap\s*\(/.test(analyzer),
};
const failed = Object.entries(checks).filter(([, value]) => !value).map(([key]) => key);
const result = { phase: 742, checks, failed, pass: failed.length === 0 };
console.log(JSON.stringify(result, null, 2));
process.exit(result.pass ? 0 : 1);
