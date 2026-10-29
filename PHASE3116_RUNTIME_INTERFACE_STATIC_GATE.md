# Phase 3116 — Runtime Interface Static Gate

## Purpose

This phase makes the CJS/TypeScript-AST audit the repeatable gate for the real PHP/Laravel discovery-to-manifest runtime path. It does not use Vitest, import production modules for execution, or infer that repository-wide migration is complete.

## Runtime trace

`controllerSourceProjectIdentityCanonicalization` → CLI source discovery operation → `laravelControllerSourceDiscoveryJudgmentFactory` → `projectForManifest()` → complete source continuation or blocked terminal-manifest operation → PHP source reads → semantic judgment inventory → manifest construction/output.

Core owns the upstream domain judgment and fixed projection contract. CLI owns filesystem integration and manifest construction. Core must not import CLI manifest types, and the deleted relation foundation is not restored.

## Static gate

Run:

```bash
NODE_PATH=/opt/nvm/versions/node/v22.16.0/lib/node_modules node scripts/audits/audit-phase3116-runtime-interface-static-gate.cjs
```

or, where TypeScript is resolvable by Node:

```bash
npm run audit:phase3116-runtime-interface-static-gate
```

The audit parses production TypeScript files using the TypeScript compiler API, checks explicit interface annotations for selected runtime factories, checks domain operations and complete/blocked judgment identity, traces CLI use of the projection, and writes `reports/PHASE3116_RUNTIME_INTERFACE_STATIC_GATE.json`. It also records repository-wide AST counts for migration planning.

## Interpretation and limits

A passing AST gate demonstrates that the checked source structure and wiring are present. It does not prove runtime behavior, full semantic type correctness, or PHP-to-manifest end-to-end correctness. Those remain separately unverified. The repository-wide migration from exported function declarations and unannotated arrow exports to named interface-typed exported constants is not complete. Primitive/control-flow inventory counts are measurements, not a mandate to mechanically erase parser control flow where doing so would lose syntax or evidence semantics.

## Next migration priority

Use the report's AST inventory to select a bounded runtime-owned operation. Move domain knowledge into its owning ADT, keep the CLI as a thin composition boundary, then run this static gate and inspect source/evidence identity, blocked partial inventories, and blocker provenance before packaging the next phase.
