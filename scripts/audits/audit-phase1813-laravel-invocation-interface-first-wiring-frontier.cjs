#!/usr/bin/env node
'use strict';
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const read = relative => fs.readFileSync(path.join(root, relative), 'utf8');
const scanner = read('packages/core/src/compiler/scanner/wiring/laravelControllerScanner.ts');
const bodyParser = read('packages/core/src/compiler/scanner/lexer/controllerBodyParser.ts');
const methodParser = read('packages/core/src/compiler/scanner/lexer/controllerMethodParser.ts');
const binding = read('packages/core/src/compiler/scanner/wiring/controllerVariableSemanticRuntimeBinding.ts');
const cliPipeline = read('packages/cli/src/parsers/php/sourceInvocationPipeline.ts');
const dataflow = read('packages/core/src/compiler/scanner/lexer/controllerDataflowAnalyzer.ts');
const compositionRoot = read('packages/cli/src/parsers/php/controllerInvocationManifestComposition.ts');
const checks = [
 ['whole-file pipeline authority exists', cliPipeline.includes('createPhpSourceInvocationSemanticPipelineAuthority') && cliPipeline.includes('analyzePhpSourceInvocationSemanticPipeline')],
 ['canonical scanner consumes closed judgment inventory', scanner.includes('invocationInventory') && scanner.includes('parseControllerDeclarationFromInvocationJudgment') && scanner.includes('invocationJudgment')],
 ['method parser passes body tokens to body parser', methodParser.includes('const bodyTokens = relationRange(tokens') && methodParser.includes('parseControllerBody(')],
 ['body parser forwards integrated response', bodyParser.includes('analyzeControllerDataflowWithIntegratedResponse') && bodyParser.includes('integratedResponse')],
 ['CLI composition delivers whole-file pipeline results', compositionRoot.includes('analyzePhpSourceInvocationSemanticPipelineBatch(documents)') && compositionRoot.includes('manifestBuilder.build(inventoryResult.receipt)')],
 ['dataflow composition consumes the integrated response unchanged', dataflow.includes('phpSourceInvocationPipeline: integratedResponse')],
 ['no semantic foundation dependency reintroduced', !binding.includes('semantic/foundation') && !dataflow.includes('semantic/foundation')],
];
for (const [name, passed] of checks) process.stdout.write(`${passed ? 'PASS' : 'FAIL'} ${name}\n`);
const failed = checks.filter(([, passed]) => !passed).length;
process.stdout.write(`SUMMARY ${checks.length - failed}/${checks.length} checks passed\n`);
process.exitCode = failed === 0 ? 0 : 1;
