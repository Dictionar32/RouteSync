# Phase 521 — Resource Binding Authority

## Goal

Move the remaining resource-binding path/provenance/origin authority from host-language control flow into declarative semantic relations.

## Cutover

Targets:

- `resourceBindingPathBuilder.ts`
- `resourceBindingProvenanceBuilder.ts`
- `resourceBindingOriginResolver.ts`

The binding pipeline is now expressed as:

`resource expression evidence -> requirement relations -> candidate witnesses -> relation options -> recursive closure -> provenance/origin authority`

## Architectural changes

- requirement dispatch uses candidate relations and `relationFirstOption` instead of imperative dispatch
- variable roots use relational presence and recursive expansion
- model/controller/resource/variable traversal roots use relation selection
- provenance definition expansion uses recursive relation projection
- provenance merge uses a semantic state fold
- origin resolution uses a declarative requirement catalog
- variable-cycle detection is a relation witness
- expression sequences use recursive relational traversal
- origin collection uses relation folds and relational range projection
- match-arm resolution uses relation gates
- array slicing is replaced by relation range projection

## Audit

`audit:scanner-lexer:phase521` must report zero occurrences for:

`if`, `for`, `while`, `switch`, `map`, `filter`, `reduce`, `flatMap`, `undefined`, `??`, `null`, `===`, `as unknown`, `||`, `&&`, `trim`, `slice`, `never`, and ternary expressions.

Target TypeScript transpilation reports zero diagnostics.
