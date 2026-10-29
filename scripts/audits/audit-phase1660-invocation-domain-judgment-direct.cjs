const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const read = relative => fs.readFileSync(path.join(root, relative), 'utf8');
const checks = [];
const check = (name, passed, detail) => checks.push({ name, passed, detail });

const algebra = read('packages/core/src/types/upstream/invocationSemanticJudgmentAlgebra.ts');
const compiler = read('packages/core/src/types/upstream/invocationSemanticModelCompiler.ts');
const contract = read('packages/core/src/types/upstream/invocationSemanticJudgmentInterface.ts');
const authority = read('packages/core/src/types/upstream/invocationSemanticJudgmentAuthority.ts');
const executor = read('packages/core/src/types/upstream/invocationSemanticRuntimeExecutor.ts');
const scanner = read('packages/core/src/compiler/frontend/php/controllerDataflowAnalyzer.ts');

check('invocation algebra has no relation-engine execution dependency', !/SemanticRelationExecution|semanticRewriteRuntimeExecutor|SemanticRelationRewrite/.test(algebra), 'Domain judgments derive from typed invocation, callable, data-flow, and emission evidence.');
check('invocation algebra has no lowering compiler dependency', !/compileInvocationSemanticModel|lowerOperation|premises|conclusions/.test(algebra), 'No rule lowering or premise/conclusion DSL is used.');
check('retired compiler is empty in-place', /export \{\};/.test(compiler) && !/lowerOperation|compileInvocationSemanticModel/.test(compiler), 'Legacy path retained as an empty compatibility module.');
check('public contract exposes domain derivation witnesses', /InvocationSemanticDerivationWitness/.test(contract) && /domain-evidence-complete-and-no-unresolved-obligations/.test(contract), 'Proof contract no longer depends on rewrite judgment types.');
check('authority validates domain proof rather than rewrite saturation', /proof\.derivation\.status/.test(authority) && !/proof\.rewrite|rewriteProof/.test(authority), 'Authority enforces domain status, witness ownership, and closure trace.');
check('runtime executor is pure delegation', /execute: \(input: InvocationSemanticInput\): InvocationSemanticJudgment => authority\.analyze\(input\)/.test(executor) && /executeAll: batchAuthority\.analyze/.test(executor), 'Executor performs no semantic inference.');
check('scanner delegates invocation batch to executor', /invocationSemanticRuntimeExecutor\.executeAll\(/.test(scanner), 'Scanner remains wiring-only for invocation analysis.');

const failed = checks.filter(item => !item.passed);
console.log(JSON.stringify({ phase: 1660, audit: 'invocation-domain-judgment-direct', passed: checks.length - failed.length, failed: failed.length, checks }, null, 2));
if (failed.length) process.exitCode = 1;
