# Phase 1959 — Interface-First Trace: PHP Source Text Is Not Classifier Evidence

## Trace

Actual path:

`LaravelSourceLexer.classifyAstValue(source text) → semanticEvidenceRelations.astValueRelation(source text) → classifyAstValue convenience ingress → tokenizePhpSource(source) → remove EOF sentinel → AstClassifierEvidenceInterface.classify({ kind: 'expression', tokens }) → astClassifierRuntime.classifyAstTokens(tokens) → PhpAstValue ADT`.

Other paths:

- Existing token consumers use the same `expression` request and do not re-tokenize their evidence.
- Block parsing uses `block` and returns `PhpBlock`.
- Semantic projection uses `semantic` with `AstNodeIdentity`, `SourceSpan`, and token evidence; it preserves the existing `produceAstSemanticEvidence → AstSemanticStageInterface` authority path.
- Laravel invocation inventory closure remains upstream-owned; the classifier phase does not add or duplicate an invocation authority.

## Why `PhpSourceText` was still too weak

`PhpSourceText = { kind: 'php_source_text'; value: StringValue }` is only a nominal wrapper around text. It carries no source file identity, span, tokenization witness, or AST node identity. It therefore did not improve the semantic contract enough to justify using it as the classifier request payload.

## Interface-first correction

- The classifier contract no longer imports or accepts `PhpSourceText`.
- One typed expression request accepts `readonly TToken[]`; in the concrete scanner port, `TToken` is `TokenDescriptor`.
- Redundant `tokens` request/result variants were removed because they duplicated the expression operation rather than representing a distinct semantic capability.
- The legacy text-facing helper remains a lexical ingress adapter only. It tokenizes before crossing the interface.
- `AstClassifierEvidenceInterface` now declares only `expression`, `block`, and `semantic` request/result variants.
- The semantic result still returns `AstSemanticStageInterface`; no second semantic authority was introduced.

## Remaining boundary to audit

A typed token sequence is stronger than raw source text for classification, but does not by itself prove which source file/span produced those tokens. Do not claim that provenance is closed yet. Next trace should bind token ranges and `SourceSpan`/`SourceFile` identity for semantic requests, reusing canonical source identity and provenance contracts already present. Do not invent a parallel source identity type.
