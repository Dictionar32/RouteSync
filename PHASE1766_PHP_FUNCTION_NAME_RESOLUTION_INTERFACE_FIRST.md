# Phase 1766 — PHP Function Name Resolution: Interface First

## Trace finding

Phase 1765 removed the public builtin-catalog `lookup`, but `PhpFunctionCallSemanticAuthorityInterface.derive` still accepts only `FunctionName` and its implementation compares that name against a private list of builtin names. That contract does not carry enough evidence to distinguish a global builtin from a namespaced function, an imported alias, a locally declared function, or an external function. It therefore still permits a short-name match to be treated as semantic identity.

The Laravel scanner call path is:

`PhpAstValue(function_call) -> mapFunctionCall -> phpFunctionCallSemanticAuthority.derive -> Expression`

The current scanner AST stores `functionName: AstIdentifier`; the mapper receives a name string but no explicit namespace scope, function-import table, or declaration inventory. The semantic authority cannot correctly infer those facts from the short name alone.

## Interface change

Added `packages/core/src/types/upstream/phpFunctionNameResolutionInterface.ts` as an upstream-owned contract surface. It models:

- unqualified, qualified, and fully-qualified function-name syntax as separate variants;
- global versus namespaced scope as a closed union;
- function imports and declared functions as typed source evidence;
- resolved builtin, declared, and external targets;
- ambiguous and unresolved outcomes that retain typed evidence and reasons.

The contract intentionally does not import scanner AST types and does not depend on `semantic/foundation`.

## Invocation semantic judgment and integrated response trace

The existing invocation path already follows the intended ownership split:

`InvocationSemanticInput -> InvocationSemanticAuthorityInterface.analyze -> InvocationSemanticJudgment -> InvocationSemanticRuntimeExecutorInterface.execute`

The integrated response path composes inventory, judgment analysis, and publication through `InvocationSemanticIntegratedResponseCompositionInterface.integrate`. Its response is the publication result itself; the composition result retains the exact input knowledge beside that response so the two cannot become detached in the scanner AST.

No second projection interface is reintroduced. The next wiring phase must preserve this atomic response and must not let the scanner reconstruct judgment closure, coverage, or publication correspondence.

## Wiring gate

This phase is intentionally contract-first. It does not wire name resolution into the scanner because the current AST/source frontend does not yet provide the complete scope/import/declaration evidence required by the new contract. Wiring a short-name guess now would only move the same semantic defect behind another interface.

Before retiring `subscanners/resource/resourceUpstreamExpressionCanonical.ts`, the next phase must:

1. make Laravel source evidence carry namespace, import, and function-declaration facts;
2. implement and validate `PhpFunctionNameResolutionAuthorityInterface` upstream;
3. make function-call judgment consume the resolved target rather than compare a short name against a builtin list;
4. migrate all current consumers of `mapResourcePhpAstToUpstream` through the canonical interface;
5. remove the resource subscanner only after its consumer count reaches zero.

## External design references

- PHP-Parser NameResolver documentation explains that namespace aliases affect name resolution and that unqualified function names are special because runtime fallback can apply: https://github.com/nikic/PHP-Parser/blob/master/doc/2_Usage_of_basic_components.markdown
- LLVM Flang semantic analysis separates name resolution from expression analysis: https://flang.llvm.org/docs/Semantics.html
- TypeScript discriminated unions provide closed, tag-correlated variants for resolved, ambiguous, and unresolved judgments: https://www.typescriptlang.org/docs/handbook/2/narrowing
