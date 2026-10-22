const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
const contract = read('packages/core/src/types/upstream/astClassifierEvidenceContract.ts');
const facade = read('packages/core/src/compiler/scanner/lexer/astClassifierEvidence.ts');
const tokenizer = read('packages/core/src/compiler/scanner/lexer/tokenizer.ts');
const barrel = read('packages/core/src/index.ts');
const producer = read('packages/core/src/types/upstream/astSemanticEvidenceProducer.ts');
const checks = [
  ['classifier contract has no PhpSourceText dependency', !contract.includes('PhpSourceText')],
  ['single syntax port consumes a closed request ADT carrying typed PHP token sequences', /AstClassifierEvidenceRequest<TToken>/.test(contract) && /tokens: readonly TToken\[\]/.test(contract) && /readonly classify:/.test(contract)],
  ['source-text value request was removed rather than renamed', !/AstClassifierValueRequest|AstClassifierValueResult|raw: string/.test(contract)],
  ['syntax classifier does not use overloaded classify signatures', !/readonly classify: \{|\(request:/.test(contract)],
  ['legacy source-string API tokenizes before entering typed syntax capability', /tokenizePhpSource\(source\)[\s\S]*astClassifierEvidenceInterface\.classify\(\{ kind: 'expression', tokens \}\)/.test(facade)],
  ['classifier implementation consumes token evidence', /runtimeClassifyAstTokens\(tokens\)/.test(facade) && !/request\.source\.value\.value/.test(facade)],
  ['semantic producer uses a closed syntax-kind ADT', /syntax: PhpAstExpressionKind/.test(producer) && !/syntaxKind: string/.test(producer)],
  ['semantic result projects the existing semantic stage authority', /astSemanticStageInterfaceOf\(produceAstSemanticEvidence/.test(facade)],
  ['tokenizer output is a concrete TokenDescriptor sequence', /export function tokenizePhpSource\(source: string\): readonly TokenDescriptor\[\]/.test(tokenizer)],
  ['PhpSourceText remains outside the classifier contract', !/PhpSourceText/.test(contract)],
  ['public barrel exports strengthened syntax and semantic contracts', /AstClassifierEvidenceInterface/.test(barrel) && /PhpAstExpressionKind/.test(barrel) && /AstSemanticEvidenceProducerInterface/.test(barrel)],
  ['no assertion-based escape was introduced in the classifier facade', !/\bas\s+(AstClassifier|PhpSource|unknown)/.test(facade)],
];
const failed = checks.filter(([, passed]) => !passed);
const result = { phase: 1959, audit: 'php-source-text-removal-interface-first', passed: checks.length - failed.length, total: checks.length, checks: checks.map(([name, passed]) => ({ name, passed })) };
const report = path.join(root, 'scripts/audits/reports/phase1959-php-source-text-removal-interface-first.json');
fs.mkdirSync(path.dirname(report), { recursive: true });
fs.writeFileSync(report, JSON.stringify(result, null, 2) + '\n');
console.log(JSON.stringify(result, null, 2));
if (failed.length) process.exitCode = 1;
