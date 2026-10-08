# Phase 395 — Scanner/Resolver Relational Authority

## Scope

This phase continues the RouteSync migration from host-language control-flow and absence sentinels toward declarative semantic relations, solver-style candidate selection, and rewrite-friendly witnesses.

The focused frontier is the controller scanner adapter boundary:

- `controllerMethodParser.ts`
- `controllerDeclarationParser.ts`

## Architectural change

The method parser no longer exposes `undefined` as its semantic absence contract. It returns `RelationOption<ControllerMethodAst>`.

The declaration parser consumes that witness using `relationOptionFold` and `relationExpand`, while method discovery itself is expressed as recursive relation closure rather than an imperative `for` loop.

Parameter traversal and attribute traversal were also moved to recursive relation closures. Attribute argument segmentation uses depth relations rather than an imperative loop.

The semantic pipeline is therefore:

```text
source tokens
  -> syntax evidence
  -> relation traversal
  -> candidate/witness selection
  -> RelationOption
  -> canonical AST
```

## Research basis

MLIR PDLL models matching through declarative patterns, constraints, and rewrite sections rather than treating handwritten control flow as the semantic specification. MLIR's declarative rewrite rules similarly separate source patterns, result patterns, and constraints. egglog combines Datalog-style fixed-point reasoning with equality saturation and rewriting. These designs support RouteSync's direction: source syntax remains evidence, while semantic authority moves to relations and rewrite/closure machinery.

## Deliberate boundary

This phase does **not** claim the scanner is globally clean. `astClassifierEvidence.ts`, `controllerBodyParser.ts`, and `queryEvidenceProducer.ts` still contain substantial lexical matches that are evidence recognition or remaining authority leaks. Those are the next migration frontier.

## Verification

- Workspace extracted from Phase 394.
- Modified top-level and nested `RouteSync/` copies synchronized.
- TypeScript invocation reaches project configuration but stops because the checkpoint lacks `node` and `vitest/globals` type-definition packages.
- No repository-wide type-clean claim is made.
