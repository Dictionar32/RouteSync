# Phase 656 — AST SSOT Highest Model / Semantic Frontier

## Tujuan

Phase ini bukan patch terhadap Phase 655. AST dinaikkan menjadi **closed proof-carrying semantic judgment ADT** dengan satu canonical constructor sebagai sumber kebenaran konstruksi.

Model canonical:

```text
Laravel/PHP source evidence
        |
        v
scanner / parser evidence
        |
        v
AstJudgmentInput
        |
        v
createAstJudgment / createDomainAstJudgment
        |
        +--> identity
        +--> semantic payload
        +--> source evidence
        +--> provenance
        +--> constraints
        +--> dependencies
        +--> relation facts
        +--> derivation/proof
        +--> resolution status
        +--> diagnostics
        |
        v
closed AstJudgment SSOT
        |
        +--> semantic IR
        +--> resolver judgments
        +--> analysis judgments
        +--> TypeScript target projection
```

`definition`, `declaration`, `methods`, dan `source` pada alias AST lama sekarang merupakan **compatibility projections** dari `semantic`, bukan payload semantic kedua.

## Perubahan inti

1. `AstNodeIdentity` tidak lagi membawa parameter kind generik sebagai bagian dari model identity.
2. `RouteAstSemantic` diperkenalkan agar route declaration tidak hilang ketika route AST dinaikkan ke semantic judgment.
3. `AstJudgmentInput` menjadi closed mapped union.
4. `AstJudgment` tetap closed union dan menjadi SSOT.
5. `createAstJudgment` menjadi canonical constructor tunggal untuk seluruh facet AST.
6. `createDomainAstJudgment` menjadi boundary constructor domain AST.
7. 15 producer boundary yang diaudit sudah mengonsumsi constructor tersebut.
8. `expressionAstCanonical.ts` tidak lagi merakit facet AST secara manual.
9. `syntaxErrorRelationCore.ts` diganti dari generic primitive atom solver menjadi typed `SyntaxErrorTerm` + declarative derivation + fixed point.
10. `parsePhpMethodOrThrow` tetap dihapus; parser adapter memakai `RelationOption`.

## Kenapa model ini lebih tinggi

Tree-sitter menyediakan concrete syntax tree/source evidence, bukan semantic SSOT. citeturn0search2turn0search7

PDLL MLIR menunjukkan bahwa rewrite pattern dapat dinyatakan secara deklaratif; K menunjukkan konfigurasi dan rewrite sebagai semantic execution model; CRAG menunjukkan non-local dependency dan circular fixed-point evaluation. RouteSync menggabungkan prinsip tersebut ke satu judgment algebra yang membawa evidence, meaning, dependency, proof, status, dan diagnostics dalam satu closed ADT. citeturn0search8turn0search11turn0search0

## Trace frontier

### Sudah elevated

- AST interface / SSOT
- AST producer boundary
- route declaration preservation
- expression AST canonicalization
- syntax error semantic judgment
- parser method failure boundary

### Berikutnya

- `semanticRelationSolver.ts`: primitive/free atom algebra dan `semantic_null` sentinel masih menjadi compatibility substrate.
- resource binding: satukan `binding_requirement`, `binding_target`, `binding_path`, `binding_cardinality`, `binding_origin`, `binding_type` menjadi relation judgment.
- resolver graph: `candidate -> dependency -> recursive closure -> resolver judgment`.
- resource group classification: facts -> candidates -> capability predicates -> rewrite witness.
- upstream mapping: mapping candidate + witness + provenance, bukan object construction langsung.
- analysis layer: analysis judgment + lattice/fixed-point witness.
- TypeScript lowering: semantic type -> lowering candidate -> target-surface witness -> projection. Target tokens tetap target vocabulary, bukan semantic authority.

## Vacuum policy

File yang terbukti tidak aktif **tidak dihapus**. Path dipertahankan dan isi dikosongkan menjadi 0 byte. Phase ini mempertahankan vacuum sebelumnya dan tidak melakukan penghapusan path.

## Catatan validasi

Audit Phase 656 melaporkan:

- closed AST union: `true`
- route declaration preserved: `true`
- canonical constructor: `true`
- domain constructor: `true`
- producer boundaries canonicalized: `15/15`
- syntax error core menggunakan generic semantic relation solver: `false`
- parser adapter `parsePhpMethodOrThrow`: `removed`

Workspace-wide TypeScript tetap tidak dianggap clean; dependency scanner lama memiliki error type yang sudah ada. Phase ini tidak mengklaim full typecheck success.
