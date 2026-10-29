# Phase 3118 — Static Datum-Flow AST Gate

## Purpose

Strengthen the prior static datum-flow checks so they inspect TypeScript AST nodes and operation-local value paths instead of relying only on regular-expression token presence. This is a standalone CJS audit: it does not import or execute RouteSync runtime modules and does not use Vitest.

## Run

```bash
NODE_PATH=/opt/nvm/versions/node/v22.16.0/lib/node_modules node scripts/audits/test-phase3118-static-datum-flow-ast.cjs
```

Or use the package script `npm run test:phase3118-static-datum-flow-ast` when TypeScript is resolvable by Node.

## Static lineage obligations

1. Project identity and root are supplied to upstream discovery.
2. The discovery result itself supplies `projectForManifest()`.
3. The blocked projection reaches the terminal operation with the original blocked judgment and does not enter the complete-source continuation.
4. The complete projection supplies the same source inventory and project identity to the continuation.
5. Source inventory materialization supplies requested source identity to `reader.read` and to both fulfilled/rejected settlement factories.
6. Read failure observations retain code/name/message evidence.
7. Blocked read batches retain partial documents and blocked-read evidence.
8. Documents plus discovery/requested project identity enter semantic judgment preparation.
9. Upstream and CLI operation factories have named interface annotations; upstream ADT exposes domain operations.
10. The deleted relation foundation is not restored in the runtime boundary files.

## Result

The generated JSON report is `reports/PHASE3118_STATIC_DATUM_FLOW_AST.json`. The audit also inventories production TypeScript AST patterns. It does not claim repository-wide export migration, primitive/control-flow elimination, semantic typecheck, or PHP-to-CLI end-to-end success.
