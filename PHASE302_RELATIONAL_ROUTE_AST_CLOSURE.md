# Phase 302 — Relational Route AST Closure

Phase 302 extends the relational execution substrate from semantic analysis into the remaining Route AST production surface.

## Authority

```text
Concrete syntax
    -> syntax evidence
    -> typed syntax relations
    -> relational execution
    -> constraints
    -> rewrite / closure
    -> semantic relations
```

The production surface no longer executes collection transformations through JavaScript `map`, `filter`, `reduce`, or `flatMap`, nor through imperative `if`, `for`, `while`, or `switch` statements.

The replacement vocabulary is:

- `projectRelation`
- `selectRelation`
- `expandRelation`
- `accumulateRelation`
- `firstRelation`
- `visitRelation`
- `booleanCase`

These are execution primitives over immutable relations/sequences. They are not source-language semantic nodes.

## Expanded surface

Phase 302 migrates the remaining production Route AST files including:

- `routeSyntaxModel.ts`
- `routeDeclarationParser.ts`
- `routeResourceDeclarationParser.ts`
- `routeResourceDeclarationAst.ts`
- `routeBindingDeclarationAst.ts`
- `knowledgeDataModel.ts`
- `routeDataFlow.ts`
- parser adapter collection traversal
- generic semantic relation traversal
- semantic behavior kernel traversal

The adapter and solver now use the same relational visitation substrate rather than callback collection combinators.

## Error and ternary boundary

Syntax errors remain typed relations. PHP ternary syntax remains evidence-level vocabulary and is projected into neutral semantic relations such as `condition`, `candidate`, `requires`, `excludes`, and `permits`.

No semantic `choice`, `branch`, `loop`, or repetition ontology is introduced.

## Verification

The Phase 302 AST audit traverses TypeScript AST nodes, so comments and strings cannot produce false positives. It rejects:

- `IfStatement`
- `ForStatement`
- `ForInStatement`
- `ForOfStatement`
- `WhileStatement`
- `DoStatement`
- `SwitchStatement`
- calls to `.map()`, `.filter()`, `.reduce()`, `.flatMap()`

The production Route AST surface reports zero violations.

## Research basis

The design is influenced by declarative syntax definition in SDF3 and constraint-oriented static semantics in Statix. SDF3 treats syntax as a declarative specification from which parser artifacts are generated; Statix treats static analysis as constraint solving over typed terms and relations. RouteSync combines those ideas with its existing typed relation program, rewrite engine, fixed-point closure, and proof-carrying semantic artifact.
