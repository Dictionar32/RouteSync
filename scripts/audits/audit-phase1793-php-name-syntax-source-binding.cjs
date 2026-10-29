const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const read = relative => fs.readFileSync(path.join(root, relative), 'utf8');
const contract = read('packages/core/src/types/upstream/phpFunctionNameResolutionInterface.ts');
const authority = read('packages/core/src/types/upstream/phpFunctionNameResolutionAuthority.ts');
const invocation = read('packages/core/src/types/upstream/phpFunctionInvocationSemanticAuthorityInterface.ts');
const pipeline = read('packages/core/src/types/upstream/invocationSemanticPipelineInterface.ts');
const scanner = read('packages/core/src/compiler/frontend/php/controllerDataflowAnalyzer.ts');
const binding = read('packages/core/src/compiler/scanner/wiring/controllerVariableSemanticRuntimeBinding.ts');
const checks = [
  ['name-resolution contract interface and value advance together to version 8', contract.includes('readonly version: 8;') && contract.includes('version: 8,')],
  ['syntax containment is an explicit ordered semantic obligation', contract.includes("'require-name-syntax-evidence-to-be-contained-by-invocation-source-span'")],
  ['contract declares name-syntax containment semantics', contract.includes("syntaxContainment: 'every-name-syntax-evidence-span-must-be-non-empty-and-contained-by-the-invocation-source-span'")],
  ['authority validates a non-empty invocation span', authority.includes('const validSpan = (span: SourceSpan): boolean => span.start.value >= 0 && span.end.value > span.start.value')],
  ['authority validates a non-empty syntax span', authority.includes('|| !validSpan(syntaxSource)')],
  ['authority binds the full syntax span inside the invocation span', authority.includes('|| !spanWithin(syntaxSource, input.source)')],
  ['authority binds every name segment inside the invocation span', authority.includes('!segmentSources.every(source => sameSpanFile(source, sourceFile) && spanWithin(source, input.source))')],
  ['authority separately binds invocation and name syntax to the owning namespace region', authority.includes('spanWithin(input.source, region.source)') && authority.includes('segmentSources.every(source => spanWithin(source, region.source))')],
  ['malformed syntax remains an explicit unresolved judgment', authority.includes("syntax.kind === 'malformed_function_name_evidence'") && authority.includes("'name-evidence-incomplete'")],
  ['name-resolution authority remains the sole owner of function lookup', authority.includes('PhpFunctionNameResolutionAuthorityInterface') && authority.includes('const resolve =')],
  ['invocation judgment consumes name-resolution judgment without re-resolution', invocation.includes('readonly resolution: PhpFunctionNameResolutionJudgment') && invocation.includes('readonly derive:')],
  ['integrated response retains the existing PHP invocation state slot', pipeline.includes('phpFunctionInvocations: PhpFunctionInvocationSemanticIntegrationState')],
  ['Laravel scanner forwards injected PHP integration state without selecting fallback', scanner.includes('phpFunctionInvocations });') && !scanner.includes('PHP_FUNCTION_INVOCATION_SEMANTIC_INTEGRATION_PENDING')],
  ['composition root keeps pending explicit until source evidence is wired', binding.includes('PHP_FUNCTION_INVOCATION_SEMANTIC_INTEGRATION_PENDING')],
  ['name-resolution authority has no semantic foundation or relations dependency', !/semantic\/(foundation|relations)/.test(authority)],
];
const failed = checks.filter(([, passed]) => !passed);
for (const [label, passed] of checks) process.stdout.write(`${passed ? 'PASS' : 'FAIL'} ${label}\n`);
process.stdout.write(`RESULT ${checks.length - failed.length}/${checks.length}\n`);
if (failed.length > 0) process.exitCode = 1;
