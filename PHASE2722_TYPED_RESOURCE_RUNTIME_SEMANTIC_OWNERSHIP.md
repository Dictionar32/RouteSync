# Phase 2722 — Fully Typed AST/ADT Runtime Scanner Operations

## Objective

Move actual Resource AST/expression/field production implementation out of `compiler/scanner`, make the runtime entry points interface-first immutable objects, and trace the upstream CLI manifest path without hiding blocked/rejected outcomes or restoring `relationFoundation`.

## Source changes applied

1. Moved `scanner/operations/resourceAstExpressionMapper.ts` to `compiler/semantic/resource-production/resourceAstExpressionMapping.ts`.
2. Evolved `ResourceAstExpressionMappingOperationInterface` from a callable function contract to an object contract with `readonly map(...)`. The runtime entry point is now:

   ```ts
   export const resourceAstExpressionMapping: ResourceAstExpressionMappingOperationInterface<PhpAstValue> = Object.freeze({
     map: input => resourceAstExpressionMappingAuthority.map(input),
   });
   ```

3. Moved `scanner/operations/resourceFieldProducer.ts` to `compiler/semantic/resource-production/resourceFieldProducer.ts`; its implementation is internal and its public runtime operation is `resourceFieldProducer: ResourceFieldProductionOperationInterface = Object.freeze({ produce: ... })`.
4. Moved `scanner/operations/resourceProducer.ts` to `compiler/semantic/resource-production/resourceProducer.ts`; its runtime contract remains interface-first and it composes `resourceFieldProducer` as a typed object rather than wrapping it in a free callable.
5. Moved model semantic symbol contracts from `scanner/symbols/model` to `compiler/semantic/model`:
   - `originModelSymbol.ts`
   - `resolvedPropertyBinding.ts`
   Scanner's symbol table/index now wires to these semantic-owned contracts.
6. Updated scanner binders, controller response detection, resource resolver consumers, scanner wiring, and `resourceFieldSemanticAuthority` imports to use the new owners and `.map(...)` / `.produce(...)` operations.
7. Removed the now-empty `compiler/scanner/operations` directory. There are no remaining TypeScript references to the old moved module paths in `packages` or `scripts`.
8. Added `audit:phase2722-typed-resource-runtime-semantic-ownership` and a static audit report.

## Runtime operation example

```ts
export interface ResourceFieldProductionOperationInterface<Value extends object, Model extends object> {
  readonly produce: (input: ResourceFieldProducerInput<Value, Model>) => ResourceField;
}

export const resourceFieldProducer: ResourceFieldProductionOperationInterface<PhpAstValue, OriginModelSymbol> = Object.freeze({
  produce: buildResourceField,
});
```

The scanner calls the operation through the contract, e.g. `resourceAstExpressionMapping.map(...)` and `resourceProducer.produceField.produce(...)`. The PHP AST remains syntax evidence; the existing semantic authority continues to decide field meaning, type, and output shape.

## CLI → upstream manifest trace

```text
packages/cli/src/commands/scan.ts | sync.ts
  -> composition.manifestScanOperation.scan(input)
  -> CLI upstream composition / controller-invocation manifest composition authority
  -> source-project identity canonicalization
  -> route-source selection and source discovery
  -> source-document acquisition and identity binding
  -> invocation semantic judgments and inventory authority
  -> upstream manifest builder operation preparation
  -> Laravel source AST pipeline
  -> complete source model builder + semantic dataflow
  -> manifest_builder_complete | manifest_builder_blocked
  -> CLI projection only after the upstream manifest is accepted
```

Both CLI commands retain explicit fail-closed outcomes for source-project identity blocked, source-document identity rejected, source-document reads blocked, discovery blocked, inventory rejected, and manifest builder blocked. AST presence alone is not treated as proof that the manifest is valid.

## Audit results

`node scripts/audits/audit-phase2722-typed-resource-runtime-semantic-ownership.cjs`

- Static checks: **16/16 passed**.
- Relative imports: **17 listed implementation/consumer TypeScript files checked, no unresolved relative imports**.
- Old moved module paths: no matches found across `packages` and `scripts`.
- `relationFoundation` implementation files: remain absent; no replacement foundation added.
- Legacy `relationFoundation` imports: **37 import declarations across 28 TypeScript files remain**. They are explicitly reported, not wrapped or hidden.

## Remaining architecture debt

The scanner is **not yet wiring-only**. Remaining implementation directories include `binders`, `descriptors`, `orchestrator`, `resolvers`, `semantic`, `subscanners`, `symbols`, and `upstream` (plus `audit`, `wiring`, and tests). This phase moves the Resource production/model-symbol slice only; it does not claim the whole scanner migration is complete.

## Validation limitations

The static audit passed. Full typecheck could not reach project-level type checking in this environment: the global TypeScript invocation reports missing global types (`Array`, `Object`, etc.), missing `node` and `vitest/globals` type definitions, and unsupported `target`/`lib` values in the repository `tsconfig.json`. Unit tests and CLI end-to-end were not run. Therefore, 16/16 means the source-level structural checks passed, **not** that the entire repository builds successfully.
