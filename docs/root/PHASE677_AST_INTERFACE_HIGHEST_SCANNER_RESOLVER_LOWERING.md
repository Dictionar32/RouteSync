# Phase 677 — AST Interface Highest: Scanner → Resolver → Analysis → Lowering

Phase 677 raises the semantic authority frontier rather than performing local syntax cleanup.

## Highest model introduced

```text
source evidence
  -> closed scanner AST / syntax judgment
  -> closed upstream mapping
  -> closed rewrite-term interface
  -> resolver graph relation closure
  -> closed analysis judgment
  -> analysis type judgment
  -> TypeScript legality/lowering
  -> target surface
```

The generic rewrite substrate remains an implementation substrate. Semantic authorities now have a closed tagged-term rewrite interface (`semanticRewriteInterface.ts`) so free primitive atoms do not form the public semantic contract.

## Scanner / lexer elevation

- `astClassifierEvidence.ts`
  - eliminated direct `length`, `split`, regex literals and regular-expression matching from the selected scanner authority;
  - added a relation-driven ternary classifier;
  - ternary construction is represented by `PhpAstFactory.ternaryExpression` and source provenance is attached through the AST locator;
  - character/identifier classification is delegated to relation text semantics.
- `phpAstAlgebra.ts`
  - replaced `Extract<...>` narrowing vocabulary with `RelationVariant`.
- `syntaxJudgmentRewriteEngine.ts`
  - collection cardinality is relation-derived;
  - diagnostic derivation is an explicit relation expansion + gate;
  - fixed-point closure remains the syntax authority.

## Resolver elevation

- `boundaryBasics.ts`
  - route perimeter resolution is a closed `RouteBoundaryBasicsJudgment`;
  - route action coordinates, path segments, path parameters and runtime paths are relation/text relations;
  - direct `length`, `split`, regex and host control constructs are removed from the boundary.
- `RouteDomainResolver.ts`
  - path segmentation and controller/domain inference use relation text vocabulary;
  - suffix/prefix/version evidence is declarative rather than regex-driven.
- `resolverGraphSemanticInterface.ts`
  - consumes the new closed rewrite interface;
  - relation facts use tagged semantic terms rather than free primitive atoms;
  - closure is least-fixed-point declarative rewriting.

## Analysis / lowering elevation

- `astAnalysisInterface.ts`
  - adds `AstAnalysisTypeJudgment` as the explicit semantic-type analysis contract.
- `typeScriptLoweringSemanticRelations.ts`
  - production lowering now enters through `resolveTypeScriptLoweringFromType` → `astAnalysisTypeJudgment` → lowering judgment;
  - the direct type-kind shortcut is retained only as a compatibility adapter.
- `typeScriptNodeLowerer.ts`
  - consumes the analysis-mediated lowering operation;
  - object emptiness is relation-derived instead of direct collection length inspection.

## Resource/service mapper elevation

- `resourceAstExpressionMapper.ts` and `resourceUpstreamExpressionMappings.ts`
  - replace `Extract` narrowing with `RelationVariant`;
  - constructor selection is relation lookup rather than non-null indexed dispatch.
- `serviceSourceStatements.ts`
  - selected statement/expression narrowing is moved to `RelationVariant`.

## Inactive-file vacuum

Phase 525 vacuum after Phase 677:

```json
{
  "candidates": [],
  "remainingNonEmptyCandidates": [],
  "allCandidatesEmpty": true
}
```

No file was emptied without dependency evidence.

## Validation

- Phase 677 AST audit: PASS.
- Phase 675 audit: PASS.
- Phase 674 audit: PASS.
- Phase 673 audit: PASS.
- Phase 525 inactive-file vacuum: PASS.
- Production TypeScript transpilation: 1293 files, 0 failures.
- Full `tsc --noEmit` remains environment/project-wide blocked by existing dependency/type-environment issues; modified authority files have no additional diagnostics in the reduced type-check trace after the Phase 677 corrections.

## Architectural basis

The model follows several established compiler/semantic patterns:

- MLIR interfaces decouple generic analyses/transforms from operation-specific knowledge; dialect conversion combines legality, rewrite patterns and type conversion.
- K uses configurations and rewrite rules as the executable semantic authority.
- Circular Reference Attribute Grammars combine reference attributes with circular fixed-point evaluation.
- Maude treats rewrite theories as a formal semantic model.
- WebAssembly WIT treats interfaces/worlds as composable contracts rather than implementation details.
- Spoofax separates declarative syntax, static semantics/scope graphs and term transformations.
- CompCert makes semantic preservation a first-class correctness contract between compiler stages.

## Next frontier

The remaining highest-value frontier is to make the **closed semantic term algebra itself richer** and progressively migrate more scanner/resource mapping rules to it. The generic primitive-atom rewrite substrate should become an implementation-only kernel, while parser adapters, scanner, resolver, analysis and lowering expose only closed ADTs, relation programs, derivations, fixed-point judgments and preservation obligations.
