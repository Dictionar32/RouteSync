# Phase 181 — Control Flow Removed From Semantic Ontology

## Principle

The canonical semantic model must preserve meaning as typed data. Parser statement
forms and execution control-flow must not become the semantic ontology.

Tree-sitter remains syntax evidence: its concrete syntax tree corresponds directly to
grammar terminals/non-terminals. RouteSync therefore raises that evidence into semantic
knowledge instead of copying parser node names into the canonical model.

## Changes

### 1. Return / throw are semantic emissions

`SemanticTransition` was renamed to `SemanticEmission`.

- `result` represents a produced function result.
- `exception` represents a produced exception value.
- void result is explicit through `SemanticPresence` with `void_emission`.

There is no transition/successor/terminator relation.

### 2. Block containment is semantic scope

`SemanticRegion` was renamed to `SemanticScope`.

The scope no longer owns an ordered `members[]` collection. Containment is represented
as canonical data-flow facts with role `member`:

`scope --dependency(member)--> knowledge`

This prevents statement order from becoming semantic source-of-truth data.

### 3. Existing semantic control concepts remain data, not CFG

`choice` and `repetition` describe semantic participation:

- choice: predicate/subject, conditions, outcomes
- repetition: initialization, condition, update, iterable, binding, body

They do not contain successor/predecessor/reentry/execution edges.

### 4. Data-flow roles remain semantic

Data-flow carries typed participation roles such as:

- operand_left / operand_right
- receiver / argument / index
- predicate / subject / branch_condition
- iterable / binding / condition / body
- emitted_value
- exception_type / handler / finally_block
- member

These roles describe knowledge relationships, not execution order.

## Result

The canonical pipeline is:

`syntax evidence -> typed semantic knowledge -> typed data-flow -> derived graph/index`

A CFG or execution interpreter may be derived later when required, but it is not the
source of truth for semantic knowledge.
