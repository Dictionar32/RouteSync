# RouteSync Phase 87.37 — Upstream Model / ADT / Dataflow Trace Audit

## Scope

Concrete trace against the ecommerce-shop RouteSync manifest and the active semantic pipeline.

Reference evidence in the repository/library shows the generated manifest still contains legacy-shaped response resolution such as `resolved: { status, type, model, collection, ... }`, while the active semantic kernel already has a closed `SemanticResolution` ADT.

## Trace

```text
Laravel source (ecommerce-shop)
        |
        v
PHP AST / scanner descriptors
        |
        |  ORIGIN BOUNDARY
        v
ModelNodeInput / FieldNode
        |
        | verifyModelNode()
        v
ModelNode  --------------------------+
        |                            |
        v                            v
SymbolTable                    VerifiedModelGraph
        |                            |
        +------------+---------------+
                     v
          SemanticResolutionKernel
                     |
                     v
          ResolverMeta -> ResolverPlugin
                     |
          FrameworkRegistry ADT
                     |
                     v
          SemanticResolution ADT
                     |
                     v
             BoundSemanticNode
                     |
                     v
                RouteSync IR
                     |
                     v
              Pure lowerers
```

## Changes in 87.37

### 1. Verified model graph is now a closed downstream contract

Added `VerifiedModelGraph` and `ModelGraphInput`.

`verifyModelGraph()` is the explicit origin boundary. `SemanticResolutionKernel.loadGraph()` now accepts only `VerifiedModelGraph`, not `Record<string, ...>` or an ad-hoc entries/object union.

### 2. Framework registry no longer loses object-field meaning

`FrameworkRegistryResolver` now constructs a real `ObjectType` from registered fields instead of replacing the fields with `ObjectType.empty('FrameworkObject')`.

Therefore:

```text
createToken()
  -> FrameworkReturnDescriptor(object)
  -> fields: plainTextToken: string
  -> ObjectType.properties
  -> BoundMethodCall.returnType
  -> SemanticResolution.boundAst
```

No semantic information is discarded between registry and bound AST.

### 3. Rule selection no longer uses `??` fallback chaining

Selection is an explicit ordered function:

```text
variable-keyed rule
      |
      +-- found --> use it
      |
      v
 global function rule
      |
      +-- found --> use it
      |
      v
 method registry rule
```

This keeps fallback policy in one origin lookup function rather than hiding classification inside an expression.

### 4. Framework lookup now unwraps PHP semantic names at the boundary

`PhpMethodName` / `PhpVariableName` are converted to their `.value` only at registry lookup. The rest of semantic processing continues to receive typed values.

### 5. Legacy scanner symbol fallback removed

`OriginModelSymbol` now consumes strict `ParsedModel` arrays directly instead of using `columns || []`, `casts || []`, `relations || []`, and `accessors || []`.

## Remaining P0/P1 leak

The largest remaining architectural leak is still `FieldNode` carrying optional semantic state:

```ts
interface BaseField {
  resolved?: SemanticResolution;
}
```

The target should become:

```text
ParsedFieldNode
      |
      | resolve once
      v
ResolvedFieldBinding
      |
      v
BoundSemanticNode
```

Semantic resolution should not be an optional property on the syntax tree. This is the next major migration because current consumers still read `field.resolved` directly.

## Ecommerce-shop evidence

The library manifest demonstrates both sides of the problem:

- resolved resource fields contain legacy metadata such as `status`, `type`, `confidence`, and `trace`;
- unresolved expressions can still carry `semantic: { status: 'unknown', type: 'unknown', ... }`;
- route response data can still contain `schema: null` and legacy optional response metadata.

The semantic kernel should therefore remain the canonical semantic source, while manifest compatibility should be treated as an input adapter rather than a downstream contract.

## Acceptance invariant

```text
No raw scanner shape
        ↓
No legacy response metadata
        ↓
No optional semantic payload on syntax AST
        ↓
Closed SemanticResolution ADT
        ↓
Closed Bound AST
        ↓
IR carries meaning only
        ↓
Lowerers do transformation, not re-classification
```
