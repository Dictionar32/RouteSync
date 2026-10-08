# Phase 320 — Relational Optional Witness + Attribute/Fixpoint Direction

## Purpose

Strengthen the semantic substrate before migrating the two remaining large imperative
surfaces (`astClassifier.ts` and `queryProducer.ts`). This phase deliberately does not
apply a source-to-source codemod to those files because early-return transformation can
change continuation semantics.

## New substrate

`packages/core/src/semantic/kernel/relationalSequence.ts` now exposes a typed absence witness:

- `RELATION_NONE`
- `RelationNone`
- `RelationMaybe<T>`
- `relationIsNone`
- `relationIsPresent`
- `relationFirstValue`

The witness is distinct from JavaScript `undefined`/`null` and is intended as the bridge for
migrating parser/query APIs without sentinel semantics.

## Architectural research conclusion

The next parser migration should combine:

1. **Attribute-grammar style semantic equations** — syntax nodes expose synthesized and
   inherited semantic relations rather than executing imperative visitors.
2. **Circular/fixed-point evaluation** — recursive semantic dependencies are solved by
   least-fixed-point closure where well-founded.
3. **Datalog relation closure** — facts and rules are evaluated to a stable relation set.
4. **Rewrite saturation** — semantic alternatives are represented as equivalent terms and
   normalized by rewrite rules.
5. **Provenance** — every derived semantic fact retains derivation evidence.

This is materially different from mechanically replacing `if` with a helper.

## External evidence

- Soufflé describes relations as the central Datalog data structure and synthesizes a native
  execution plan from declarative rules.
- Soufflé's synthesis pipeline specializes fixed-point relational evaluation into generated
  imperative code, which supports keeping RouteSync's source semantics declarative while
  allowing an implementation backend to optimize execution.
- Reference attribute grammars provide declarative semantic equations and reference attributes
  for computing graphs such as inheritance and control-flow graphs.
- Circular attribute grammars can be evaluated by successive approximation when the circular
  definitions are well-founded.
- Ruler/Enumo demonstrates equality saturation as a system for discovering and minimizing
  rewrite rules, not merely executing a hand-written rule list.
- Scallop demonstrates provenance-aware relational reasoning.

## Migration rule

The parser/query migration must preserve continuation semantics. A guard such as:

    if (invalid) return absent;
    continue;

must not become an unconditional `return relationChoose(...)` that discards `continue`.
The safe replacement is a relation rule whose false branch explicitly contains the continuation,
or a larger semantic equation/closure rule that preserves the complete derivation.
