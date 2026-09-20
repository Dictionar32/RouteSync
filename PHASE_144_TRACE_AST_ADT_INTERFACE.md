# Phase 144 — AST/ADT Interface Trace

## Boundary

ecommerce_shop → PHP lexer AST → semantic upstream ADT → CompleteSourceAst → RouteManifest

## Finding

The semantic upstream AST was already richer than the legacy `compiler/ast` storage node. `upstream/expression.ts` preserves property access, method/static calls, construct, instance_of, conditional/coalesce, closures and closure capture modes. Domain AST definitions carry these expressions into Model/Resource/Controller/Route definitions.

## Repair

Removed duplicate `ASTNodeData` / `ASTNodeId` declarations from `compiler/utils/Arena.ts` and `compiler.ts`. Both now use the canonical `compiler/ast/ASTNodeData` boundary.

This is consolidation, not a new interface.

## Result

There is now one storage AST node interface. Semantic meaning remains in the upstream ADT vocabulary rather than being reconstructed from generic node kinds.

## Validation

`npx tsc -p tsconfig.phase87.33.narrow.json --noEmit` reaches the existing environment blocker:
`packages/core/src/compiler/utils/Hash.ts: Cannot find module 'crypto' or its corresponding type declarations.`

No new TypeScript error was introduced by Phase 144.

## Next semantic target

Trace the scanner-to-upstream construction sites for `Expression`, `ControllerStatement`, `ResourceField`, and `RouteDefinition`. The next repair should target any conversion that turns a rich `PhpAstNode` into a weaker upstream variant or `unknown/unsupported` despite a known source construct.
