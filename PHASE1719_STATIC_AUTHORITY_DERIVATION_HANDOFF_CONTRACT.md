# RouteSync Phase 1719 — Static Authority Derivation Handoff Contract

Date: 2026-10-12

## Purpose

Continue interface-first work on the static invocation semantic judgment model. The Phase 1718 trace exposed a boundary flaw: `InvocationStaticSemanticAuthorityValidationInput` accepted `knowledge`, `subject`, and `judgment` as three independently supplied values. This allowed a caller to submit a judgment that was not represented as the output of the static algebra contract, forcing the authority to correlate separately supplied values before it could even validate the semantic invariants.

## Trace and correction

Primary file:

- `packages/core/src/types/upstream/invocationSemanticPipelineInterface.ts`

The authority input now carries source knowledge and a typed algebra-derived candidate:

```ts
export interface InvocationStaticSemanticAuthorityValidationInput {
  readonly knowledge: SemanticKnowledgeDataFlow;
  readonly derivation: Extract<
    InvocationStaticSemanticAlgebraResult,
    { readonly kind: 'derived' }
  >;
}
```

The authority no longer accepts an independently supplied `subject` or `judgment`. The candidate subject and judgment are taken from the algebra-derived branch, while the authority checks that the candidate remains supported by the supplied source knowledge. The `rejected-input` algebra result cannot be passed as a judgment candidate because it does not satisfy the `Extract<..., { kind: 'derived' }>` contract.

The authority validation contract explicitly states the derivation handoff invariant. The contract and validation receipt advance to version 5. The static judgment model and coverage contracts advance to version 14, and the invocation pipeline advances to version 27. Existing audit scripts for Phases 1702–1718 were updated to assert current versions and the new handoff, rather than retaining stale interface expectations. The Phase 1712 authority audit now verifies the algebra-derived input shape.

## Why this is an interface correction

The correction removes an invalid combination from the authority input contract: an independently supplied semantic judgment disconnected from a declared algebra result. It does not move runtime code, add a parallel foundation layer, or implement semantic reasoning in the scanner.

Ownership remains:

`Source knowledge → static algebra derivation → authority validation → scanner/downstream handoff`

- Algebra derives a candidate judgment.
- Authority validates the candidate against source knowledge and closed contracts; it does not derive, repair, or reclassify meaning.
- Laravel scanner remains source-evidence collection and delegation only.
- `core/src/semantic/foundation` remains unused.

## Verification

- Phase 1719 audit: **14/14 PASS**.
- Regression audits Phase 1702–1719: **271/271 PASS** across 18 audit scripts.
- Targeted strict TypeScript invocation: exit 2 due to existing diagnostics in other modules; **zero diagnostics mention** `invocationSemanticPipelineInterface.ts` or `laravelControllerScannerInterface.ts`.
- `package.json` JSON parsing: PASS.
- ZIP integrity: verified with `unzip -t`.
- Full package build: not run.
- Static algebra runtime, authority validator runtime, and production scanner wiring: not implemented by this phase.

Run the new audit with:

```sh
npm run audit:phase1719-static-authority-derivation-handoff-contract
```

## Related technical references

- MLIR Interfaces: https://mlir.llvm.org/docs/Interfaces/ — compiler interfaces enable generic analyses to interact with IR through declared contracts instead of accumulating operation-specific special cases.
- PHP-Parser AST builders: https://github.com/nikic/PHP-Parser/blob/master/doc/component/AST_builders.markdown — distinguishes `methodCall` and `staticCall`, supporting separate source-form identities for ordinary and static invocation.

## Next step

Do not proceed to scanner wiring yet. The next interface-first checkpoint should close the typed handoff from each stage output to the judgment assembly input, then specify the authority's accepted candidate contract in a way that can be implemented directly. After the contract is stable, implement the algebra and validator, test them against source-backed fixtures, and only then wire the Laravel scanner.
