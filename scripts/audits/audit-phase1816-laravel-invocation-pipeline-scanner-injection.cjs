#!/usr/bin/env node
'use strict';
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const read = relative => fs.readFileSync(path.join(root, relative), 'utf8');
const scanner = read('packages/core/src/compiler/scanner/wiring/laravelControllerScanner.ts');
const boundary = read('packages/core/src/types/upstream/laravelControllerScannerInterface.ts');
const methodParser = read('packages/core/src/compiler/scanner/lexer/controllerMethodParser.ts');
const declarationParser = read('packages/core/src/compiler/scanner/lexer/controllerDeclarationParser.ts');
const bodyParser = read('packages/core/src/compiler/scanner/lexer/controllerBodyParser.ts');
const binding = read('packages/core/src/compiler/scanner/wiring/controllerVariableSemanticRuntimeBinding.ts');
const pipeline = read('packages/core/src/compiler/scanner/wiring/laravelSourceAstPipeline.ts');
const cliPipeline = read('packages/cli/src/parsers/php/sourceInvocationPipeline.ts');
const checks = [
 ['canonical scanner accepts only the closed inventory receipt', /invocationInventory: LaravelControllerInvocationSemanticJudgmentInventoryClosureReceipt/.test(boundary) && scanner.includes('invocationInventoryReceipt.correspondences')],
 ['source path and response come from the same invocation judgment', scanner.includes('const fullPath = invocationJudgment.sourceFile.value.value') && /parseControllerDeclarationFromInvocationJudgment\([^;]*invocationJudgment\)/s.test(scanner)],
 ['declaration parser threads integrated response into method parser', /parseControllerMethod\(source, tokens, index, filePath, integratedResponse\)/.test(declarationParser)],
 ['method parser threads integrated response into body parser', /filePath,\s*integratedResponse,/.test(methodParser)],
 ['body parser forwards integrated response to dataflow executor', /analyzeControllerDataflowWithIntegratedResponse\(block, parameters, parameterSemantics, filePath, integratedResponse\)/.test(bodyParser)],
 ['source AST pipeline invokes canonical scanner interface', pipeline.includes('laravelControllerScanner.scan({') && pipeline.includes('invocationInventory: invocationInventoryReceipt')],
 ['CLI supplies authority-produced whole-file pipeline delivery', cliPipeline.includes('phpSourceInvocationSemanticPipelineDeliveryBatchFromResults')],
 ['no old ControllerScanner entry remains in production source', !fs.existsSync(path.join(root, 'packages/core/src/compiler/scanner/subscanners/ControllerScanner.ts'))],
 ['no semantic foundation dependency introduced', !/semantic\/foundation/.test([scanner, boundary, methodParser, declarationParser, bodyParser, binding].join('\n'))],
];
for (const [name, passed] of checks) process.stdout.write(`${passed ? 'PASS' : 'FAIL'} ${name}\n`);
const failed = checks.filter(([, passed]) => !passed).length;
process.stdout.write(`SUMMARY ${checks.length - failed}/${checks.length} checks passed\n`);
process.exitCode = failed === 0 ? 0 : 1;
