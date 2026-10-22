#!/usr/bin/env node
'use strict';
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const read = relative => fs.readFileSync(path.join(root, relative), 'utf8');
const checks = [];
const check = (name, condition) => checks.push({ name, passed: Boolean(condition) });
const astRuntime = read('packages/core/src/compiler/scanner/lexer/astClassifierRuntime.ts');
const astPort = read('packages/core/src/types/upstream/astClassifierEvidenceContract.ts');
const candidate = read('packages/core/src/types/upstream/scannerAstExpressionCandidateInterface.ts');
const expressionJudgment = read('packages/core/src/types/upstream/scannerExpressionJudgmentInterface.ts');
const expressionProvider = read('packages/core/src/compiler/scanner/lexer/phpExpressionStructureEvidenceProvider.ts');
const invocation = read('packages/core/src/types/upstream/laravelControllerInvocationSemanticJudgmentInterface.ts');
const scannerInterface = read('packages/core/src/types/upstream/laravelControllerScannerInterface.ts');
const scannerWiring = read('packages/core/src/compiler/scanner/wiring/laravelControllerScanner.ts');
const scannerRoot = path.join(root, 'packages/core/src/compiler/scanner');
const files = [];
const walk = directory => {
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const target = path.join(directory, entry.name);
    if (entry.isDirectory()) walk(target);
    else files.push(target);
  }
};
walk(scannerRoot);
const relativeFiles = files.map(file => path.relative(scannerRoot, file).split(path.sep));
check('existing syntax interface is expression/block port', astPort.includes('interface AstClassifierEvidenceInterface') && astPort.includes('AstClassifierExpressionRequest') && astPort.includes('AstClassifierBlockRequest'));
check('candidate identity and precedence remain upstream', candidate.includes('ScannerExpressionCandidateId') && candidate.includes('SCANNER_AST_EXPRESSION_PRECEDENCE'));
check('compound-expression judgment is closed ADT', expressionJudgment.includes('ExpressionStructureJudgment') && expressionJudgment.includes("'malformed_source'") && expressionJudgment.includes("'contract_violation'"));
check('compound expression provider delegates to upstream judgment interface', expressionProvider.includes('expressionStructureJudgmentAuthority.resolve'));
check('audit accurately records legacy AST relation adapter', astRuntime.includes('AST_CLASSIFICATION_RULES') && astRuntime.includes('RelationOption') && astRuntime.includes('resolveFromRelation') && !astRuntime.includes('SemanticDecisionContract'));
check('invocation judgment remains closed ADT', invocation.includes('php_source_invocation_integration_complete') && invocation.includes('php_source_invocation_integration_blocked'));
check('controller scanner requires invocation inventory closure receipt', scannerInterface.includes('LaravelControllerInvocationSemanticJudgmentInventoryClosureReceipt'));
check('scanner wiring preserves exact invocation and response judgments', scannerWiring.includes('invocationJudgment') && scannerWiring.includes('responseJudgment') && scannerWiring.includes('astProjection.judge'));
const subscannerDirectories = relativeFiles.filter(parts => parts[0] === 'subscanners').map(parts => parts.slice(0, -1));
check('no relation subscanner directory added', !subscannerDirectories.some(parts => parts.some(part => part === 'relation' || part === 'relations')));
check('no foundation subscanner directory added', !subscannerDirectories.some(parts => parts.some(part => part === 'foundation')));
check('phase trace document exists', fs.existsSync(path.join(root, 'packages/core/src/types/upstream/docs/PHASE2023_INTERFACE_FIRST_AST_LARAVEL_RESPONSE_TRACE.md')));
const failed = checks.filter(item => !item.passed);
for (const item of checks) console.log(`${item.passed ? 'PASS' : 'FAIL'} ${item.name}`);
console.log(`\n${checks.length - failed.length}/${checks.length} checks passed`);
if (failed.length) process.exitCode = 1;
