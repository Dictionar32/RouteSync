# Phase 3117 — Static Datum-Flow Interface Test

## Purpose

A standalone CommonJS (`.cjs`) static test that traces data/evidence across the real Laravel source-discovery → upstream ADT → CLI manifest composition → PHP source-read settlement → semantic-judgment preparation path. It uses the TypeScript compiler AST and source lineage assertions; it does not run Vitest or import project runtime modules.

## Run

```bash
NODE_PATH=/opt/nvm/versions/node/v22.16.0/lib/node_modules node scripts/audits/test-phase3117-static-datum-flow-interface.cjs
```

Or use `npm run test:phase3117-static-datum-flow-interface` in an environment where `typescript` resolves normally.

## Datum-flow obligations

1. Project identity and controller root enter source discovery.
2. The discovery judgment is projected through the upstream ADT operation.
3. Blocked judgment, blocker and partial source inventory reach the terminal manifest operation.
4. Complete source inventory and project identity reach the source continuation.
5. Each discovered source identity is carried into a source-read input.
6. Fulfilled and rejected reads remain tied to the requested source, with failure evidence preserved.
7. Rejected/blocked read evidence reaches terminal manifest operations.
8. Complete documents and project identity contexts enter semantic judgment preparation and inventory closure.
9. Named interfaces describe the runtime operations and upstream domain follow-up operations.

## Interpretation and limits

A passing result means the named source-level data-flow obligations were found. It does not prove runtime behavior, semantic TypeScript type correctness, full test-suite success, or end-to-end PHP-to-manifest behavior. The report explicitly keeps global export-interface migration and global primitive/control-flow removal incomplete.
