# Phase 1918 — Laravel Knowledge Evidence Adapter Interface-First

## Trace finding

`controllerDataflowAnalyzer.ts` directly called `produceSemanticKnowledgeDataFlow`, even though the repository already defines the upstream generic `SemanticKnowledgeEvidenceAdapter<TEvidence>` contract and a PHP-AST implementation (`phpAstSemanticKnowledgeEvidenceAdapter`). That meant the analyzer still selected a concrete source-specific producer instead of consuming the existing abstraction.

## Change

- Injected the existing `SemanticKnowledgeEvidenceAdapter<PhpBlock>` into `createControllerDataflowAnalyzer`.
- Moved selection of `phpAstSemanticKnowledgeEvidenceAdapter` to `controllerVariableSemanticRuntimeBinding.ts`, the scanner composition root.
- Removed the analyzer's concrete producer import and direct call. It now requests canonical `SemanticKnowledgeDataFlow` through the existing adapter contract.
- Reused the existing interface and PHP adapter; no duplicate authority or relocated semantic logic was introduced.
- Updated the Laravel scanner boundary contract and synchronized its version to 84.
- Kept the exact invocation judgment (`invocationJudgment: judgment`), integrated response as a distinct field, and composition from the exact `judgment.response`.
- Kept the exact `ControllerVariableSemanticJudgment` returned by the existing executor on each `ControllerVariableDefinition`.

## Trace after change

`PhpBlock evidence → phpAstSemanticKnowledgeEvidenceAdapter (selected at composition root) → SemanticKnowledgeEvidenceAdapter<PhpBlock> → canonical SemanticKnowledgeDataFlow → existing correspondence/identity/semantic-resolution/flow-composition path → ControllerDataflowAst`

Invocation path remains:

`LaravelControllerInvocationSemanticJudgmentInterface → responseComposition.integrate({ knowledge, phpSourceInvocationPipeline: judgment.response }) → invocationSemanticIntegratedResponse`

The invocation judgment and integrated response are deliberately not collapsed into one field.

## Boundary still not complete

This is a real reduction in concrete-producer coupling, not a claim that the analyzer is wiring-only. The analyzer still sequences correspondence judgments, variable identity judgments, semantic resolution, and projection into the final dataflow model. That larger orchestration should only be extracted if the trace proves an existing stronger semantic contract can own it; a new wrapper interface that merely moves the same function would not satisfy interface-first design.

## Validation

The static audit checks adapter injection, no direct concrete producer dependency in the analyzer, synchronized scanner contract version, and preservation of invocation/semantic judgment boundaries. No package build, TypeScript typecheck, or runtime test was run.
