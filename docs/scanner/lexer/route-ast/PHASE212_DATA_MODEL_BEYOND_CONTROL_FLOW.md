# Phase 212 — Knowledge/Data-Flow Beyond Control-Flow Syntax

## Principle

`if`, `switch`, `while`, `===`, and `!==` are not the semantic source of truth. They are syntax/evidence or interpreter mechanics. Meaning is represented as typed semantic facts and data-flow.

The canonical path is:

```text
source evidence
  ↓
syntax/evidence adapter
  ↓
typed semantic facts
  ↓
semantic data-flow
  ↓
derived indexes
  ↓
interpreter / consumer
```

This boundary is intentionally broader than Tree-sitter. `SemanticKnowledgeEvidenceAdapter<TEvidence>` accepts parser, lexer, language-service, framework-model, reflection, or inference evidence. The canonical semantic model contains none of those concrete syntax types.

## External trace

MLIR models operations and values as a graph-like IR and explicitly supports analysis/transformations over high-level dataflow graphs. Its data-flow framework propagates lattice facts through a dependency graph using transfer functions. citeturn0search0turn0search1

Clang's data-flow documentation likewise describes analysis as propagation of facts through a CFG until a fixpoint; control flow is the substrate through which knowledge is propagated, not the knowledge itself. citeturn0search7

Roslyn separates syntax trees from semantic models: syntax describes lexical/syntactic structure, while the semantic model answers what identifiers and expressions mean and how values flow. citeturn0search4turn0search6

## Phase 212 changes

1. Operator classification moved into `SemanticOperatorDefinition.factKind`.
   - `===` / `!==` are represented by operator knowledge (`identical` / `not_identical`).
   - Whether an operator creates a `comparison` fact is now vocabulary data.
   - The producer no longer owns a hard-coded `comparisonCodes` list.

2. Controller contextual attributes moved from a `switch` into `CONTEXTUAL_ATTRIBUTE_KNOWLEDGE`.

3. Framework request aliases moved into `FRAMEWORK_REQUEST_TYPE_KNOWLEDGE`.

4. Existing `SemanticChoice`, `SemanticRepetition`, `SemanticExceptionBoundary`, `SemanticAssignment`, `SemanticBinding`, `SemanticReference`, `SemanticInvocation`, and `SemanticAccess` remain the canonical representations for control/data semantics.

## What is deliberately NOT changed

Pattern matching such as `switch (value.kind)` inside an evidence adapter is retained. It answers a parser/evidence question: which evidence variant was received? It does not define Laravel/compiler meaning.

Likewise, `while` in `syntaxScan`/`syntaxGrammar` remains interpreter mechanics. The repeat/until/scan termination rule is already represented as `SyntaxPattern`/`SyntaxScanStep` data; replacing the loop with another loop would only move syntax around.

## Map/Set rule

`Map`/`Set` may remain where they accelerate lookup or validation. They must not be the canonical semantic vocabulary. Operator definitions and contextual-attribute rules are immutable data catalogs; indexes are derived projections.
