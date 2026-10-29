const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
const contract = read('packages/core/src/types/upstream/astClassifierEvidenceContract.ts');
const evidence = read('packages/core/src/compiler/frontend/php/astClassifierEvidence.ts');
const producer = read('packages/core/src/types/upstream/astSemanticEvidenceProducer.ts');
const index = read('packages/core/src/index.ts');
const checks = [
  ['syntax classifier exposes one closed request/response ADT port', /readonly classify:[\s\S]*AstClassifierEvidenceRequest<TToken>/.test(contract) && /AstClassifierEvidenceResult<TValue, TBlock>/.test(contract)],
  ['syntax classifier has no semantic request/result variant', !/AstClassifierSemantic(Request|Result)|kind: 'semantic'/.test(contract)],
  ['semantic evidence is delegated to the existing producer', /produceAstSemanticEvidence\(input\)/.test(evidence)],
  ['semantic producer consumes closed PHP AST syntax kind', /syntax: PhpAstExpressionKind/.test(producer) && !/syntaxKind: string/.test(producer)],
  ['semantic result remains the existing closed stage interface', /astSemanticStageInterfaceOf\(produceAstSemanticEvidence/.test(evidence)],
  ['classifier uses one non-overloaded classify operation', /readonly classify:/.test(contract) && !/\bfunction classify\s*\([^)]*\)\s*;/.test(contract + evidence)],
  ['public barrel exports the existing syntax and semantic contracts', /AstClassifierEvidenceInterface/.test(index) && /AstSemanticEvidenceProducerInterface/.test(index) && /PhpAstExpressionKind/.test(index)],
];
const failed = checks.filter(([, passed]) => !passed);
console.log(JSON.stringify({ phase: 1957, audit: 'ast-semantic-integrated-response-interface-first', passed: checks.length - failed.length, total: checks.length, checks: checks.map(([name, passed]) => ({ name, passed })) }, null, 2));
if (failed.length) process.exitCode = 1;
