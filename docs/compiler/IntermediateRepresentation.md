# RouteSync Intermediate Representation (IR v2)

Source: `packages/core/src/types/semantic.ts` (the file is literally headed
`ROUTESYNC COMPILER CORE — IR v2 SPEC`), `packages/core/src/types/route.ts`,
`packages/core/src/types/contract.ts`, cross-checked against a real
`routesync.manifest.json` / `routesync.graph.json` (35 routes / 20 models / 4 resources,
from `ecommerce_shop-main`).

RouteSync's IR exists at three layers of increasing structure. A field moves through all three
during `scan`, in order.

## Layer 1 — Raw Layer (`IRRawNode`)

The immutable input, exactly as extracted from PHP source:

```ts
interface IRRawNode {
  kind: "raw_code"
  code: string                // e.g. "$this->produk->nama"
  hints?: IRHints
  parsed_ast?: ParsedASTNode  // populated once B.3 (see CompilerPipeline.md) runs
}

interface IRHints {
  pattern: "property_access" | "method_call" | "binary_expression" | "type_cast"
         | "ternary" | "nullsafe_chain" | "collection" | "unknown"
  confidence?: number             // 0..1
  nullable?: boolean
  framework_context?: "eloquent" | "resource" | "blade" | "unknown"
}
```

Hints are deliberately cheap, string-pattern signals computed at *extraction* time (inside the
embedded PHP script — see the `str_contains($code, '?->')` / `'::'` / `'->'` / `'$'` checks in
`LaravelRouteParser.ts`), not a real parse. They exist so downstream tooling can make quick
decisions without invoking the full expression parser. They are advisory only — the actual
resolution always re-derives the true `ParsedASTNode.kind` via `PhpCodeParser.parseExpression()`.

## Layer 2 — Parsed AST (`ParsedASTNode`)

A closed union of 14 node kinds, each a plain discriminated-union interface (no classes) —
deliberately structured so both `SemanticKernelV2` and `SemanticResolutionKernel` can pattern
match on `.kind` without any runtime type-checking library:

```
VariableAST                 { kind: "variable", name }
PropertyAccessAST           { kind: "property_access", target, property }
NullsafePropertyAccessAST   { kind: "nullsafe_property_access", target, property }
MethodCallAST               { kind: "method_call", target, name, args, resource?, collection? }
StaticMethodCallAST         { kind: "static_method_call", target, name }
BinaryExpressionAST         { kind: "binary_expression", operator, left, right }
TypeCastAST                 { kind: "type_cast", castType: int|float|string|bool, expression }
TernaryAST                  { kind: "ternary", condition, truthy, falsy }
LiteralAST                  { kind: "literal", value }
NullsafeChainAST            { kind: "nullsafe_chain", chain: ParsedASTNode[] }
PrimitiveAST                { kind: "primitive", type }
ResourceAST                 { kind: "resource", resource, collection? }
ModelAST                    { kind: "model", model }
NewInstanceAST              { kind: "new_instance", target, resource?, collection? }
UnknownAST                  { kind: "unknown", code }
```

This tree is produced by `PhpCodeParser.parseExpression()` (170 lines,
`packages/cli/src/parsers/PhpCodeParser.ts`) from a raw PHP expression string — a small,
purpose-built expression parser distinct from the PHP-side tokenizer embedded in the
extraction script (that one only parses *array literal* syntax, not arbitrary expressions).

`ASTNormalizer.normalize()` (`packages/core/src/semantic/ASTNormalizer.ts`) runs before
resolution and is explicitly commented "No Regex in Kernel" in `SemanticKernelV2.resolve()` —
its job is to fold any remaining loosely-typed node shapes into the canonical `ParsedASTNode`
union so the resolver never has to special-case malformed input.

## Layer 3 — Semantic Layer (`SemanticNode` / `SemanticResolution`)

The final, resolved answer for a field, produced by `SemanticKernelV2.resolve()`:

```ts
type SemanticType =
  | "string" | "number" | "boolean" | "datetime" | "array" | "object"
  | "model" | "resource" | "collection" | "nullable" | "unknown"

interface SemanticNode extends SemanticResolution {
  type: SemanticType
  fields?: Record<string, any>   // for kind: "object" — nested field resolutions
}
```

`SemanticResolution` (`packages/core/src/types/contract.ts`) is the actual contract every
resolver plugin returns:

```ts
interface SemanticResolution {
  status: "resolved" | "unknown"
  type: string
  model?: string          // when type === "model"
  resource?: string        // when type === "resource"
  collection?: boolean
  paginated?: boolean
  nullable?: boolean
  confidence: number       // 0-100
  trace: TraceNode[]       // evidence chain, see SemanticSpecification.md
}
```

Every resolution — success or failure — is required to populate `trace`. A `status: 'unknown'`
result still carries a `trace` explaining *why* (e.g. `"Unsupported AST kind: ..."` or
`"Property not found in Schema Model ..."`), which is what makes `routesync explain` possible
without re-implementing resolution logic.

## Root IR Node (Full Lineage Wrapper)

The spec defines a root wrapper meant to carry cache/incremental-build metadata alongside the
three layers:

```ts
interface SemanticIRNode {
  id: string
  source: SourceRef                 // { file, line?, column?, context: controller|resource|model|route|service }
  node: IRRawNode
  semantic: SemanticNode
  meta: IRMeta                      // { version: "ir.v2", stableHash, lineage, createdAt?, tags? }
  context?: IRContext
}
```

**This wrapper type is declared but not actually populated as a first-class object anywhere in
the current pipeline.** `scan.ts` resolves fields in place on the manifest's plain JSON tree
(`field.resolved = resolved`) rather than constructing `SemanticIRNode` instances with
`source`/`meta` lineage tracking. The `IRMeta.stableHash`/`lineage` fields — clearly designed
for incremental/cached recompilation — are unused; every `scan` is a full, from-scratch
re-extraction and re-resolution. This is a real gap between the documented IR spec and the
implementation, worth noting in `ZeroBoilerplate.md` as a compiler-performance opportunity
rather than a correctness bug.

## The Manifest — IR Layer 0 (Container)

`RouteManifest` (`packages/core/src/types/route.ts`) is the top-level container that actually
gets serialized to `routesync.manifest.json`:

```ts
interface RouteManifest {
  version: string
  baseURL: string
  routes: ParsedRoute[]
  channels: ParsedChannel[]
  models?: ParsedModel[]
  resources?: ParsedResource[]
  generatedAt: string
  frontend?: {                       // hand-authored, preserved across re-scans
    domains?: Record<string, string | { type: string, ... }>
    groupAliases?: Record<string, string>
  }
  pages?: unknown                    // hand-authored, drives RoutesGenerator
}
```

`ParsedRoute` carries `name, method, path, auth, middleware, schema, response, assignments` —
`response` is a `ResponseMetadata` node that is *either* still a raw/hinted node (pre-B.3) or a
resolved `SemanticNode`-shaped object (post-B.3) depending on which stage of `scan` last touched
it; downstream generators defensively check both `field.resolved` and `field.semantic` (see
`SDKGenerator.getResponseInfo()`'s `{ ...(rawMeta.resolved || rawMeta.semantic || rawMeta) }`
spread) — evidence that the manifest's on-disk shape is not perfectly uniform between what
`scan` writes and what the IR spec in `semantic.ts` describes as canonical.

## Zod AST (A Fourth, Independent IR)

`ZodTierGenerator.ts` and `packages/core/src/types/semantic.ts` also define a **separate**
closed IR exclusively for describing Zod schemas structurally, so schema code generation never
concatenates strings for types it can represent as a tree:

```ts
type ZodAST =
  | { kind: "zod_object", shape: Record<string, ZodAST> }
  | { kind: "zod_string" } | { kind: "zod_number" } | { kind: "zod_boolean" }
  | { kind: "zod_array", element: ZodAST }
  | { kind: "zod_optional", inner: ZodAST }
  | { kind: "zod_union", options: ZodAST[] }
  | { kind: "zod_literal", value: string | number | boolean }
  | { kind: "zod_unknown" }
```

This is consumed by `ZodTierGenerator.generateZodRecursive()` and (in the unused backend) by
`ZodToTSEmitIR.ts`/`TSPrinter.ts`. Its existence as a fully separate tree — rather than reusing
`SemanticNode` — reflects a deliberate separation of concerns: `SemanticNode` describes "what
PHP resolved to," `ZodAST` describes "how to validate it at the TypeScript boundary." The two
are correlated (a `SemanticNode` of `type: 'string'` becomes a `zod_string`) but not identical
(nullability, optionality, and literal unions are Zod-specific concerns with no PHP-side
equivalent).
