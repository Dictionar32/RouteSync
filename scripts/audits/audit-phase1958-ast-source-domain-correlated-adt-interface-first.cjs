const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
const contract = read('packages/core/src/types/upstream/astClassifierEvidenceContract.ts');
const facade = read('packages/core/src/compiler/scanner/lexer/astClassifierEvidence.ts');
const tokenizer = read('packages/core/src/compiler/scanner/lexer/tokenizer.ts');
const producer = read('packages/core/src/types/upstream/astSemanticEvidenceProducer.ts');
const syntaxKind = read('packages/core/src/types/upstream/phpAstSyntaxKind.ts');
const expressionTypes = read('packages/core/src/compiler/scanner/lexer/phpAstExpressionTypes.ts');
const barrel = read('packages/core/src/index.ts');
const checks = [
  ['classifier contract consumes typed token evidence rather than PhpSourceText', /tokens: readonly TToken\[\]/.test(contract) && !contract.includes('PhpSourceText')],
  ['classifier has one request/response ADT port and no overload signatures', /AstClassifierEvidenceRequest<TToken>/.test(contract) && /readonly classify:[\s\S]*AstClassifierEvidenceResult<TValue, TBlock>/.test(contract) && !/\bfunction classify\s*\([^)]*\)\s*;/.test(contract)],
  ['semantic request is not incorrectly placed inside syntax classifier', !/AstClassifierSemanticRequest|AstClassifierSemanticResult|kind: 'semantic'/.test(contract)],
  ['lexical ingress tokenizes before syntax classification', /tokenizePhpSource\(source\)[\s\S]*astClassifierEvidenceInterface\.classify\(\{ kind: 'expression', tokens \}\)/.test(facade)],
  ['semantic production reuses existing upstream producer', /produceAstSemanticEvidence\(input\)/.test(facade)],
  ['producer rejects arbitrary syntax strings at the contract boundary', /syntax: PhpAstExpressionKind/.test(producer) && !/syntaxKind: string/.test(producer)],
  ['canonical syntax-kind vocabulary covers actual expression AST variants', /'function_call'[\s\S]*'match_expression'[\s\S]*'unsupported'/.test(syntaxKind) && /Extract<PhpAstExpressionKind, 'function_call'>/.test(expressionTypes)],
  ['semantic stage response preserves existing authority closure', /astSemanticStageInterfaceOf\(produceAstSemanticEvidence/.test(facade)],
  ['public barrel exports the strengthened syntax kind', /PhpAstExpressionKind/.test(barrel)],
  ['legacy text ingress is not part of the upstream classifier contract', !/raw: string|source: PhpSourceText/.test(contract)],
];
const failed = checks.filter(([, passed]) => !passed);
const result = { phase: 1958, audit: 'ast-source-domain-correlated-adt-interface-first', passed: checks.length - failed.length, total: checks.length, checks: checks.map(([name, passed]) => ({ name, passed })) };
const report = path.join(root, 'scripts/audits/reports/phase1958-ast-source-domain-correlated-adt-interface-first.json');
fs.mkdirSync(path.dirname(report), { recursive: true });
fs.writeFileSync(report, JSON.stringify(result, null, 2) + '\n');
console.log(JSON.stringify(result, null, 2));
if (failed.length) process.exitCode = 1;
