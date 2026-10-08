# Phase 1129 — Dataflow IR Lineage Conservation

Direction: `upstream => wiring => interface => downstream`

## Finding

The closed upstream `SemanticDataflowFact` already carried fact-scoped producer lineage, identity, and source. The IR projection preserved semantic identity nodes but previously dropped `fact.lineage` from projected relations.

## Repair

`SemanticDataflowIRProjectionTypes.ts` now owns an IR-local `SemanticDataflowIRLineage` projection contract. It preserves:

- runtime producer (`request | route | controller | resource`),
- canonical semantic identity key as the IR relation's lineage identity,
- provenance source span.

`SemanticDataflowIRProjection.ts` copies this information from the already-closed fact. It does not classify producers, derive provenance, or recompute closure.

## Boundary

```text
canonical upstream SemanticDataflowFact
  -> wiring / DataFlowInterface
  -> closed judgment
  -> IR-local lineage projection
  -> downstream IR relation
```

The IR-local contract prevents downstream IR consumers from becoming owners of the upstream producer algebra while preserving provenance information.

## Validation

- Phase 1129 audit: PASS
- Phase 1128 graph implementation ownership: PASS
- Phase 1127 end-to-end semantic surface: PASS
- Phase 1126 identity/provenance conservation: PASS
- Phase 1125 producer vocabulary: PASS
- Phase 1124 producer lineage: PASS
- Phase 1122 semantic dataflow provenance: PASS
- Phase 1118 upstream/wiring/interface/downstream: PASS
- Phase 1086 graph downstream surface closure: PASS
- Phase 1074 legacy StaticLaravelScanner removal: PASS
- Targeted TypeScript no-emit check for the changed IR projection files: PASS
