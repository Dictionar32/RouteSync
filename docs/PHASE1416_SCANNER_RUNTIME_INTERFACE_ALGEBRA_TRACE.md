# Phase 1416 — `core/src/compiler/scanner` runtime-to-interface/algebra trace

This trace distinguishes decision ownership from grammar/IO mechanics. It is not a claim that all scanner runtime functions should be moved out of the scanner directory.

## Applied in this phase

| Surface | Before | After | Boundary |
|---|---|---|---|
| `lexer/astClassifierRuntime.ts` expression dispatch | Rule list evaluated eagerly by a generic `resolveFirst` implementation | Rule contract includes applicability; generic algebra short-circuits in precedence order | Algebra owns rule selection; PHP functions remain grammar implementations |
| Structured statements | Runtime assembled `solveOptionalCandidate` values and requirements for each control statement | `structuredStatementRules` declares control-kind applicability and resolver capability | Algebra owns selection; only the matching PHP grammar production runs |
| Simple statements | Runtime assembled return/assignment/expression candidate solver | `simpleStatementRules` declares applicability and ordered resolution | Algebra owns precedence; resolver lazily tries assignment then expression fallback |
| `lexer/astClassifierEvidence.ts` | Typed adapter to runtime functions | Retained as adapter; it does not own grammar or semantic judgments | Port/wiring only |

## Scanner-wide hotspots and recommended migration order

| Priority | File / function surface | Trace finding | Target contract/algebra | Keep in runtime |
|---|---|---|---|---|
| P1 | `lexer/astClassifierRuntime.ts`: `parseStatements`, `findStatementEnd`, delimiter navigation | Recursive traversal, recovery/skip, delimiter scanning still mix traversal policy and PHP token mechanics | `PhpStatementSequenceAlgebra` over `StatementCursor`, `StatementBoundaryEvidence`, `StatementParseResult` with consumed span and remainder | Token reading and PHP delimiter evidence; grammar production implementations |
| P1 | `lexer/astClassifierRuntime.ts`: `parseAssignmentParts`, `classifyAssignmentTarget` | Operator precedence and assignment-target choice remain local ordered decision tables | `AssignmentRuleAlgebra` with closed operator/target judgments and source witnesses | PHP-specific target grammar and AST construction |
| P1 | `lexer/routeAst/semanticRelationSolver.ts`, `semanticRelationProgram.ts`, `semanticRelationalBehaviorKernel.ts` | Existing relational engine already exists; avoid introducing a competing solver in scanner | Reuse existing semantic relation program/solver as the common decision substrate | Scanner only supplies facts/rules |
| P2 | `subscanners/queryEvidenceProducer.ts`: `operationCatalog`, `operationRule`, `operationFromExpression` | Producer has a public `QueryProducer` interface but still owns many operation-resolution catalogs and resolver selection | `QueryOperationRuleAlgebra` / `QueryOperationEvidenceContract` in upstream types; producer supplies expression-specific relations | Expression traversal and evidence extraction |
| P2 | `descriptors/validation/validationRuleEntry.ts`: `resolveSemanticType`, `resolvePresence`, `resolveLocation`, `resolveShape` | Validation descriptor factory computes semantic type, presence, location, and shape together | `ValidationFieldJudgment` contract plus compositional rule algebra for type/presence/shape/location | Laravel validation syntax evidence collection |
| P2 | `subscanners/controller/controllerDataflowContract.ts`: `resolveModelOrigin`, `resolveStaticCallOrigin` | Model-origin inference is mixed into compatibility contract production | Upstream `ControllerModelOriginJudgment` with evidence/provenance; compatibility projection only consumes it | AST/source evidence extraction |
| P2 | `descriptors/request/controllerActionContract.ts`: dependency/request/response/schema resolution | One constructor performs multiple independent resolutions and joins | Split closed subcontracts for dependency, request, response, schema, then a contract-composition algebra | Source-to-fact adaptation |
| P3 | `descriptors/route/routeGroupContextResolver.ts` and `upstream/route/routeGroupSemanticResolver.ts` | This path is already separated: AST adapter → `RouteGroupFact` → semantic resolver | Preserve as pattern; formalize fact/result contract if consumers still bypass it | AST extraction in adapter |
| P3 | `subscanners/resource/resourceUpstreamExpressionCanonical.ts`, `serviceAstCanonical.ts`, `requestAstCanonical.ts` | Canonicalization contains variant dispatch and recursive projection | Reuse closed AST eliminators / projection algebras, not domain inference in canonicalizer | Lossless structural conversion only |
| P3 | `subscanners/RouteScanner.ts`: HTTP method/path normalization | Input normalization is not automatically semantic reasoning; distinguish validation from inference | `RouteDeclarationNormalizationContract` only if multiple consumers or lost evidence are demonstrated | I/O, lexical normalization, source location |

## Migration rules

1. Move *ownership of decisions*, not merely function bodies. Interface/algebra must define input, evidence, applicability, result ADT, failure/absence, precedence, provenance, and totality obligations.
2. A scanner adapter may collect syntax/source evidence and invoke a contract. It must not reconstruct semantic meaning already present in upstream judgments.
3. Do not move PHP grammar productions into a generic interface. Generic algebra must not import `TokenDescriptor`, Laravel, or PHP-specific AST factories.
4. Avoid `Record` lookup tables as a substitute for reasoning where rules have applicability/proof obligations. Dictionaries used only for keyed data storage are not automatically violations.
5. For each migration, add AST/contract parity tests, trace all call sites, then remove the old authority only after consumers use the new contract.

## Residuals for next phase

- `parseStatements` still owns recursive sequence traversal and statement recovery.
- Assignment operator and target resolution remain in `astClassifierRuntime.ts`.
- Query operation inference and validation field judgments remain scanner-side migration candidates.
- `astClassifierRuntime.ts` still contains PHP-specific grammar productions by design.
- Full TypeScript build requires installed `tsdown` dependencies; the structural audit is not a substitute for compilation or AST parity tests.
