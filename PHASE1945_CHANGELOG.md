# Phase 1945 — Controller Body AST ADT Interface-First Closure

## Trace finding

`ControllerBodyAst<Semantic extends boolean>` represented projection mode only through a conditional `dataflow` field. Syntax-only projection used `dataflow: undefined`, while semantic projection carried the controller dataflow judgment. The type did not expose a discriminant to consumers, so absence of semantic analysis was structurally less explicit than the already closed payload-judgment ADT.

## Interface-first change

- Replaced the generic body interface with an explicit discriminated ADT: `SyntaxOnlyControllerBodyAst` (`controller_body_syntax_only`) and `SemanticControllerBodyAst` (`controller_body_semantic`).
- Preserved `ControllerBodyAst<Semantic>` as a selector alias so existing parser overloads and controller AST generics remain aligned with the new variants.
- Updated `parseControllerBody` to publish the matching discriminant for syntax-only and semantic projection.
- Exported both ADT variants from the existing lexer barrel.
- Extended the existing semantic-model contract to version 16 and the existing Laravel scanner boundary contract to version 107. No parallel authority was introduced.
- Updated regression audits 1940–1944 to check the current versions of the existing contracts and added Phase 1945 audit coverage.

## Semantic guarantees

- Syntax-only AST explicitly has no dataflow judgment; it is not an invocation `not-connected` result and is not a semantic `unresolved` result.
- Semantic AST retains `ControllerDataflowAst`, including the canonical invocation judgment and integrated response.
- Existing payload-level `resolved`, `unresolved`, and `ambiguous` judgment variants remain unchanged.
- No semantic judgment is reconstructed or reclassified by the parser.

## Verification boundary

The Phase 1940–1945 static audits pass 50/50 checks. The Phase 1945 audit also verifies JSON/package-script consistency. A full TypeScript project type-check and build were not run in this environment.
