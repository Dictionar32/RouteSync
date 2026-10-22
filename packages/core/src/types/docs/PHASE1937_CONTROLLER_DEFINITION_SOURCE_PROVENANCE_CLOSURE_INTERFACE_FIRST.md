# Phase 1937 — Controller Definition Source Provenance Closure (Interface First)

## Trace finding

Phase 1936 ensured that definition projection consumes the exact matched payload source file. One provenance edge remained implicit: the projected `ControllerVariableDefinition.source.file` was not checked against the canonical source identity before the definition entered variable-flow composition.

## Interface-first change

- `ControllerDataflowSemanticJudgmentAuthorityInterface` contract advanced to version 11.
- Added `definitionProvenanceClosure`: every projected definition's source file must relate to the canonical `sourceCorrelation.sourceFile` through the existing typed source-file identity relation before variable-flow or integrated-response publication.
- `ControllerDataflowInvocationSemanticModelContract` advanced to version 9 and records the definition-source closure.
- `LaravelControllerInvocationSemanticBoundaryContract` advanced to version 99 and explicitly keeps the validation in the upstream authority, not the scanner.

## Implementation

`controllerDataflowSemanticJudgmentAuthority.ts` now:

1. projects the definition from the matched correspondence and resolved variable identity;
2. validates `definition.source.file` against the canonical source file through `laravelSourceIdentitySemantics.relateSourceFiles`;
3. only then creates the resolved binding judgment, allowing it into variable-flow composition.

The existing `ControllerVariableDefinition.semanticResolution` remains the exact closed judgment returned by the upstream semantic executor. Expression source and payload source spans remain distinct provenance values; they are not falsely collapsed into one span.

## Ownership

- Laravel scanner: collects source evidence and forwards the correlation bundle.
- Definition projection adapter: projects the matched payload into the existing definition domain.
- Semantic judgment authority: closes source identity and binding/identity judgments.
- Variable-flow and integrated-response composition: consume only the authority-closed model.

No parallel authority or `semantic/foundation` dependency was introduced.

## Validation

Run `npm run audit:phase1937-controller-definition-source-provenance-closure-interface-first` for the 12 static checks. The phase workflow also runs the related Phase 1930–1936 static audits and validates `package.json`, audit script syntax, and ZIP integrity. This phase does not claim a TypeScript build or full test suite pass.
