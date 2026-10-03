# Phase 653 — AST Interface Maximum + Scanner/Resolver Frontier

## Tujuan

Phase ini tidak sekadar menghapus konstruksi host-language. AST dinaikkan menjadi **closed-schema proof-carrying semantic attributed term** yang dapat menjadi kontrak lintas scanner/lexer → resolver → analysis → semantic lowering → target projection.

## Interface tertinggi yang sekarang tersedia

```text
Canonical AST Judgment
├── identity        stable source-derived relation key
├── semantic        closed schema per AST kind
├── evidence        source surface + evidence facts
├── provenance      semantic origin + exact source span
├── constraints     solver obligations
├── dependencies    explicit semantic dependency edges
├── derivation      relational proof trace
│   └── step
│       ├── conclusion
│       ├── rule
│       ├── witness
│       ├── premises (AST or source evidence)
│       └── fixed-point round
└── status          candidate | resolved | ambiguous | rejected
```

Perubahan penting dibanding interface sebelumnya:

1. `SemanticAstNode` tidak lagi menerima empat payload generic bebas (`Semantic, Surface, Origin`). Payload ditutup oleh `AstNodeSchema`.
2. Seluruh 14 AST domain kinds memiliki slot schema: expression, model, resource, request, route, controller, response, service, migration, dto, middleware, provider, attribute, channel.
3. Evidence tidak berhenti pada `surface`; ada `facts` sebagai evidence relation term.
4. Constraint dan dependency menjadi bagian dari AST contract, sehingga solver tidak perlu menemukan kembali hubungan semantik dari object traversal.
5. Derivation bukan lagi hanya `(rule,witness)`, tetapi proof edge dengan `conclusion`, `premises`, dan `round`.
6. Premise dapat menunjuk AST node atau source evidence. Ini memungkinkan derivasi syntax → semantic dilacak tanpa menjadikan call stack sebagai proof.
7. Status resolution menjadi ADT sehingga absence/ambiguity/rejection tidak perlu direpresentasikan dengan host `undefined`/`null`.
8. `CanonicalAstNode` tetap dipertahankan sebagai public alias agar migrasi downstream tidak memutus nama kontrak.

## Expression AST

`expressionAstCanonical.ts` sekarang mengisi:

- semantic expression canonical
- PHP syntax surface
- syntax-kind evidence fact
- origin + source span
- empty constraint/dependency relations
- derivation conclusion = node identity
- evidence premise = source span + syntax-kind predicate
- rule = `php-expression-to-upstream-expression`
- witness = PHP AST kind
- round = 0
- status = resolved

Jadi Expression AST sekarang dapat diperlakukan sebagai **judgment yang dapat diaudit**, bukan DTO hasil parser.

## Vacuum

File yang terbukti tidak lagi direferensikan oleh source symbols/import paths dikosongkan menjadi 0 byte, tidak dihapus.

25 path divacuum pada phase ini. Audit lanjutan hanya menyisakan tiga non-empty candidates yang memiliki penggunaan/test reference nyata:

- `compiler/scanner/descriptors/validation/fieldNodes.ts`
- `compiler/scanner/subscanners/resource/resourceBindingPathBuilder.ts`
- `compiler/scanner/subscanners/validationRuleChecker.ts`

`resourceBindingPathBuilder.ts` sengaja dipertahankan karena `resourceBindingTraversalBuilder.ts` masih menggunakannya sebagai frontier aktif. Dua file lain memiliki pemakaian eksternal/test yang masih nyata.

## Audit trace

Machine audit: `scripts/audit-phase653-ast-interface-maximum.cjs`

Machine report: `docs/PHASE653_AST_INTERFACE_MAXIMUM_AUDIT.json`

Hasil interface:

- schema coverage: 14/14
- required fields: 8/8
- evidence fields: 2/2
- derivation fields: 5/5
- resolution status variants: 4/4
- open payload generic: false
- closed payload schema: true

## Frontier yang masih harus dimigrasikan

Audit lexical bukan bukti semantic authority secara langsung. Ia dipakai untuk menemukan permukaan yang masih perlu diperiksa.

Prioritas berikutnya:

### 1. Scanner/lexer

`semanticRouteSyntaxRelations.ts` dan `TokenCursor` masih mengekspos optional/void surface (`?`, `void`) dan beberapa non-null assertion. Target:

```text
Token evidence
  → syntax relation facts
  → parser judgment ADT
  → syntax diagnostic relation
  → canonical RouteDeclarationAst
```

`routeDeclarationParserHelpers.ts` yang menjadi adapter lama sudah divacuum; `routeDeclarationParser.ts` harus menjadi satu-satunya authority parser berbasis syntax relations.

### 2. Resource binding

`resourceBindingPathBuilder.ts` masih memiliki `if/switch/Set/new` dan recursive host traversal. Target:

```text
binding requirement facts
  → candidate roots
  → alias/dependency relations
  → recursive closure
  → binding-path witness
  → provenance
```

### 3. Resource route-group classification

`resourceRouteGroupDescriptor.ts` masih memiliki `Map`, loop, `if`, `filter`, `undefined`, `??`, equality, throw, dan constructor allocation. Target:

```text
route capability facts
  → group candidate relation
  → classification rewrite rules
  → ResourceGroupClassification witness
  → descriptor projection
```

Descriptor object boleh menjadi projection; klasifikasi tidak boleh menjadi sumber kebenaran.

### 4. Resolver graph

Route security/resource/boundary resolvers harus berakhir pada:

```text
facts → candidates → constraints → SCC/fixed point → witness/provenance → canonical resolver ADT
```

Graph traversal hanya projection/operational scheduling, bukan semantic authority.

### 5. AST/upstream mapping

Expression mapping sudah memiliki canonical attributed AST boundary. Berikutnya seluruh resource/request/service/route mapping harus mengadopsi schema + evidence + proof edge yang sama.

### 6. Analysis

Analysis harus menerima AST/IR facts dan menghasilkan derived relations, bukan menghidupkan kembali CFG/SSA sebagai source of truth. CFG, SSA, dependence, recurrence, loop/backedge, dan control topology tetap merupakan projection dari relational semantic model.

### 7. Semantic type lowering

Target final:

```text
SemanticType
  → TypeLoweringCandidate
  → type constraints
  → target-surface relations
  → fixed point / rewrite saturation
  → TargetTypeWitness
  → TypeScript projection
```

`undefined`, `null`, optional property, union fallback, primitive string/number type, dan host constructors tidak boleh menentukan semantic type.

## Ternary / short ternary / coalesce

PHP ternary, short ternary, dan null-coalesce tetap sah sebagai **source syntax evidence**. Yang harus hilang adalah penggunaannya sebagai host-language control semantics.

Canonical target model:

```text
php_ternary / php_short_ternary / php_coalesce
  → conditional/coalesce evidence relations
  → branch/value candidates
  → nullability/type constraints
  → fixed-point resolution
  → ConditionalSemantic ADT
  → downstream target projection
```

## Syntax error

`syntaxErrorRelationCore.ts` sudah menjadi relation solver, tetapi parser cursor dan beberapa syntax relation types masih membawa optional/void host surface. Tahap berikutnya adalah menaikkan syntax error menjadi first-class parser judgment:

```text
SyntaxEvidence
  → Expected
  → Observed
  → Located
  → Diagnostic
  → Blocks
  → ParserResult
```

Tidak ada exception yang menjadi sumber kebenaran parser.

## Prinsip arsitektur

RouteSync tidak diarahkan menjadi clone Tree-sitter/CodeQL/Souffle/MLIR/K/e-graphs. Yang diambil adalah pola tertinggi masing-masing:

- Tree-sitter: syntax evidence/CST boundary.
- Souffle/Datalog: relation facts + recursive derivation.
- MLIR PDLL/DRR: declarative match/rewrite vocabulary.
- MLIR canonicalization: repeated rewrite sampai fixed point.
- K: executable rewrite semantics over structured terms/configuration.
- Circular Reference Attribute Grammars: non-local attributes + circular fixed-point evaluation.
- e-graphs/egglog: equality/rewrite saturation untuk semantic equivalence.

RouteSync menggabungkannya pada domain yang lebih sempit: **Laravel route ecosystem → canonical routing semantic IR → Next.js ecosystem**.

## Verification limitation

Workspace-wide TypeScript compile belum dapat dinyatakan sukses karena dependency type definitions `@types/node` dan `vitest/globals` tidak tersedia di workspace. AST interface sendiri berhasil diparse/audit menggunakan global TypeScript compiler.
