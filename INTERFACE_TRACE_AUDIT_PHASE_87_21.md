# RouteSync Interface Trace Audit — Phase 87.21

## Scope

Target: `ecommerce_shop` Laravel scanner path, specifically the Bound Semantic AST public contract.

## Trace

```text
PHP AST
  -> resource binder
  -> BoundSemanticFactory
  -> BoundSemanticNode
  -> semantic resolver / lowerer
  -> route/core public exports
```

## Findings

### Fixed: Bound AST factory/export hole

`boundAst.ts` defined the Bound Semantic node union but did not expose the factory and public names consumed by the repository.

The public boundary now has:

- `BoundSemanticFactory`
- `matchBoundSemantic`
- `matchBoundSemanticNode` compatibility alias
- `BoundUnknownNode` compatibility type alias

The canonical semantic node remains `BoundUnsupportedNode`.

### Fixed: semantic values are qualified at the Bound AST boundary

Model, column, relation, method, database type, cast type, and condition values are emitted as their semantic value objects instead of unqualified strings inside Bound nodes.

### Preserved: unresolved expressions do not become fake primitives

The factory's unsupported path creates `bound_unsupported`. It does not create a fabricated `string` semantic node.

## Remaining upstream debt

1. `ParsedRelation` still has duplicated relation semantics across `targetModel`, `cardinality`, and legacy `isCollection`/`model` consumers.
2. `ModelColumnResolver` still uses `|| ''`, nullable relation metadata, and string heuristics. These are downstream semantic fallback problems, not AST parsing problems.
3. `ConditionalWrapperResolver` and several expression handlers still synthesize primitive Bound nodes from string resolution types. This should be replaced with a first-class `SemanticType` carrier at the resolver boundary.
4. `boundAst.ts` still contains compatibility parameters accepting strings. These are transitional boundaries and should be removed after all callers consume semantic value objects.
5. `route.ts` and `index.ts` retain legacy public aliases. They should be collapsed after downstream imports are migrated.

## Recommended next phase

**Phase 87.22: Relation ADT normalization.**

Canonicalize relation semantics to:

```text
Relation
  ├─ relationType
  ├─ targetModel
  ├─ cardinality { one | many }
  └─ foreignKey
```

Then migrate all `rel.model` and `rel.isCollection` consumers to the canonical ADT. Do not add another compatibility field merely to silence TypeScript errors.
