# Phase 1959 — Remove Weak PHP Source Text from AST Classifier Contract

## Why

Phase 1958 replaced `raw: string` with `PhpSourceText`, but tracing `PhpSourceText` showed it only wraps `StringValue`. It does not bind a fragment to a source file, source span, parser traversal, or lexical evidence. That was a better name around text, not a stronger classifier input contract.

## Changes

- Removed `AstClassifierValueRequest` / `AstClassifierValueResult` from the classifier contract.
- Removed the redundant `AstClassifierTokensRequest` / `AstClassifierTokensResult` variants. They duplicated the same token payload without a distinct semantic operation.
- Replaced both with one `AstClassifierExpressionRequest<TToken>` carrying concrete token evidence.
- The classifier ADT is now `expression | block | semantic`.
- Kept the existing public `classifyAstValue(source: string)` convenience API for compatibility, but moved source tokenization to lexical ingress. It now sends token evidence through the canonical classifier interface; source text does not cross that interface.
- Semantic dispatch still goes through the existing `produceAstSemanticEvidence` and `AstSemanticStageInterface` path.
- Removed the classifier-only `PhpSourceText` export from the public barrel. `PhpSourceText` remains part of the frontend domain where it is actually used.
- Updated the Phase 1399, 1957, and 1958 audit expectations and added the Phase 1959 audit.

## Important boundary

This phase strengthens the classifier port; it does not claim that token arrays alone prove source-file provenance. The semantic request still carries `SourceSpan`, and a future provenance audit must establish whether its token evidence is bound to that same source span before the semantic judgment is consumed.
