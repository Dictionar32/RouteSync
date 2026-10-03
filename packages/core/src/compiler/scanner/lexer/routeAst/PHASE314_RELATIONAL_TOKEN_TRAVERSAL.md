# Phase 314 — Relational Token Traversal

Phase 314 raises the PHP scanner/evidence boundary one level above imperative collection traversal.

## Canonical model

```text
Token evidence
  -> token relations
  -> recursive relation traversal
  -> candidate relation
  -> semantic projection
```

The scanner token machinery now uses relational primitives for:

- recursive index/last-index lookup;
- recursive matching of delimiters;
- top-level operator search;
- top-level token splitting;
- parameter/capture projection;
- argument segmentation;
- interpolation projection;
- binary/assignment operator candidate selection;
- switch-case evidence accumulation;
- try/catch evidence accumulation;
- statement sequence traversal.

## Forbidden collection/control surface removed from `astClassifier.ts`

The classifier no longer contains:

- `for`;
- `while`;
- `switch`;
- `.map()`;
- `.filter()`;
- `.reduce()`;
- `.flatMap()`.

`if` remains only as legacy guard semantics. These guards are intentionally the next migration boundary: converting them correctly requires continuation-aware requirement relations rather than syntactic substitution.

## Relation substrate

`semantic/kernel/relationalSequence.ts` now exposes recursive:

- `relationIndexOf`;
- `relationLastIndexOf`;
- `relationSome`;
- `relationEvery`;
- `relationChoose`;
- `relationSelect`;
- `relationProject`;
- `relationExpand`;
- `relationFold`;
- `relationFirst`.

These primitives are execution substrate. Semantic authority remains in relation candidates, guards, requirements, exclusions and rewrites.
