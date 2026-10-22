const fs = require('node:fs');
const path = require('node:path');
const root = process.cwd();
const read = (relative) => fs.readFileSync(path.join(root, relative), 'utf8');
const judgment = read('packages/core/src/types/upstream/invocationSemanticJudgmentInterface.ts');
const pipelineInterface = read('packages/core/src/types/upstream/invocationSemanticPipelineInterface.ts');
const algebra = read('packages/core/src/types/upstream/invocationSemanticJudgmentAlgebra.ts');
const sourceEvidence = read('packages/core/src/compiler/scanner/lexer/routeAst/phpAstExpressionSyntaxEvidenceRegistry.ts');
const knowledge = read('packages/core/src/types/upstream/semanticDataflowKnowledge.ts');
const dataflowAnalyzer = read('packages/core/src/compiler/scanner/lexer/controllerDataflowAnalyzer.ts');
const checks = [];
const check = (name, passed) => checks.push({ name, passed: Boolean(passed) });

check('source semantic vocabulary has a distinct static-invocation fact', knowledge.includes('interface SemanticStaticInvocation') && knowledge.includes("readonly kind: 'static-invocation'"));
check('source evidence producer actually emits static-invocation facts', sourceEvidence.includes("kind: 'static-invocation'"));
check('current invocation algebra selects only ordinary invocation facts', /fact\.kind === 'invocation' \? \[fact\.value\] : \[\]/.test(algebra));
check('pipeline coverage contract states ordinary-invocation-only judgment scope', pipelineInterface.includes("readonly currentJudgmentDomain: 'ordinary-invocation-only'") && pipelineInterface.includes("currentJudgmentDomain: 'ordinary-invocation-only'"));
check('static calls cannot be silently claimed as semantically judged', pipelineInterface.includes("staticInvocationDisposition: 'preserve-as-uncovered-source-fact-until-static-algebra-and-authority-are-implemented'"));
check('coverage closure names the required judgment, obligation, proof, and authority evolution', pipelineInterface.includes('implement-static-subject-target-binding-effects-proof-and-authority-before-claiming-complete-call-coverage'));
check('pipeline contract version reflects the current evolved coverage model', /interface InvocationSemanticPipelineContract\s*\{[\s\S]*?readonly version: 32;/.test(pipelineInterface) && /kind: 'invocation_semantic_pipeline_contract',\s*version: 32[\s\S]*?coverage: INVOCATION_SEMANTIC_COVERAGE_CONTRACT/.test(pipelineInterface));
check('Laravel controller analyzer remains delegated to the canonical invocation pipeline', dataflowAnalyzer.includes('invocationSemanticPipeline.analyzeKnowledge(semanticKnowledgeDataFlow)'));
check('coverage declaration does not pretend static-call judgment implementation already exists', !/staticInvocationDisposition:\s*'analyzed-and-judged'/.test(pipelineInterface));
check('changed invocation interface adds no any or semantic foundation dependency', !/:[\t ]*any\b/.test(pipelineInterface) && !pipelineInterface.includes('semantic/foundation'));

for (const item of checks) process.stdout.write(`${item.passed ? 'PASS' : 'FAIL'} ${item.name}\n`);
const failed = checks.filter((item) => !item.passed);
process.stdout.write(`\n${checks.length - failed.length}/${checks.length} invocation coverage interface checks passed.\n`);
process.stdout.write('OPEN GAP: static invocation facts are emitted by the source model but are not yet included in the canonical invocation judgment algebra. This phase makes that boundary explicit; it does not claim implementation coverage.\n');
if (failed.length) process.exit(1);
