const fs = require('node:fs');
const path = require('node:path');
const root = process.cwd();
const walk = directory => fs.existsSync(directory) ? fs.readdirSync(directory, { withFileTypes: true }).flatMap(entry => {
  const target = path.join(directory, entry.name);
  return entry.isDirectory() ? walk(target) : target.endsWith('.ts') ? [target] : [];
}) : [];
const relative = file => path.relative(root, file).split(path.sep).join('/');
const files = [...walk(path.join(root, 'packages/core/src/compiler/scanner')), ...walk(path.join(root, 'packages/core/src/types/upstream')), ...walk(path.join(root, 'packages/cli/src'))].filter(file => !/\/__tests?__?\//.test(relative(file)));
const sources = files.map(file => ({ file: relative(file), text: fs.readFileSync(file, 'utf8') }));
const relations = sources.flatMap(({ file, text }) => [...text.matchAll(/from\s*['"][^'"]*semantic\/relations[^'"]*['"]/g)].map(match => ({ file, statement: match[0] })));
const exportedFunctions = sources.flatMap(({ file, text }) => [...text.matchAll(/^\s*export\s+(?:async\s+)?function\s+([A-Za-z_$][\w$]*)/gm)].map(match => ({ file, name: match[1] })));
const transition = fs.readFileSync(path.join(root, 'packages/core/src/types/upstream/astSemanticStageTransition.ts'), 'utf8');
const pipeline = fs.readFileSync(path.join(root, 'packages/core/src/types/upstream/astSemanticAuthorityPipeline.ts'), 'utf8');
const collectionsPath = path.join(root, 'packages/core/src/types/upstream/collections.ts');
const collectionsBytes = fs.existsSync(collectionsPath) ? fs.statSync(collectionsPath).size : null;
const checks = {
  transitionHasNoRelationUtilityImports: !/semantic\/relations/.test(transition),
  transitionReturnsClosedJudgmentADT: /AstSemanticStageTransitionJudgment/.test(transition) && /ast_semantic_stage_transition_rejected/.test(transition),
  transitionUsesExplicitStageAndProofSwitches: /switch \(from\)/.test(transition) && /switch \(proof\.kind\)/.test(transition),
  transitionImplementationPrivate: /^const astSemanticStageTransitionImplementation\s*=/m.test(transition) && !/^export const astSemanticStageTransition\s*=/m.test(transition),
  transitionAuthorityInterfaceDeclared: /export interface AstSemanticStageTransitionAuthorityInterface/.test(transition),
  transitionAuthorityInterfaceFirst: /export const astSemanticStageTransitionAuthority:\s*AstSemanticStageTransitionAuthorityInterface\s*=\s*Object\.freeze\(/.test(transition),
  transitionHasDomainContinuation: /readonly continueWith: <Result>/.test(transition) && /handlers\.onRejected/.test(transition) && /handlers\.onTransition/.test(transition),
  pipelineUsesDomainContinuation: /astSemanticStageTransitionAuthority\.continueWith\(/.test(pipeline) && !/astSemanticStageTransition\(/.test(pipeline),
  noExportFunctionOnProductionRuntimePath: exportedFunctions.length === 0,
  cliHasNoRelationImports: relations.every(({ file }) => !file.startsWith('packages/cli/src/')),
  collectionsEmpty: collectionsBytes === 0,
};
const result = { phase: 2860, title: 'Fully Typed Runtime Scanner Operations — Explicit AST Transition ADT', runtimeFileCount: sources.length, relationImportStatementCount: relations.length, relationImportFileCount: new Set(relations.map(({ file }) => file)).size, scannerUpstreamCliExportFunctionDeclarations: exportedFunctions, collectionsBytes, checks, remainingRelationImportFiles: [...new Set(relations.map(({ file }) => file))].sort() };
console.log(JSON.stringify(result, null, 2));
if (Object.values(checks).some(passed => !passed)) process.exitCode = 1;
