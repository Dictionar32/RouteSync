# RouteSync upstream trace/repair checkpoint

## Source boundary
Laravel `examples/ecommerce-shop-source` is the source evidence. Legacy `routesync.manifest.json` is not evidence for the new scanner.

## Proven lineage
`PHP source -> SourceAst producer -> executeScanPipeline -> ScannedRouteManifestDescriptor -> StaticLaravelScanner -> CLI -> resolveManifestIncrementally -> ManifestGenerator.save`

## First-loss findings
1. `pipelineScanner.ts`: `sourceAsts` is produced but has no downstream use.
2. `sourceAstScanner.ts`: canonical AST construction rebuilds source facts through 7 scanner calls instead of consuming one canonical source model.
3. `literalTernaryBinders.ts`: ternary condition was reduced to `value.condition.kind`.
4. `literalTernaryBinders.ts`: ternary descriptor used only the truthy expression.
5. `literalTernaryBinders.ts`: semantic type selected one branch instead of joining both verified branches.
6. `ternaryHandler.ts`: semantic resolver created placeholder condition `condition`.

## Repairs applied
- `ConditionExpression` now preserves existing string conditions and can carry the existing `ResourceFieldExpression` or existing `FieldNode` as an ADT variant.
- Ternary binder maps and preserves the full condition expression.
- Ternary binder emits the full ternary expression.
- Ternary binder uses the existing `computeJoin` lattice for both verified branches.
- Ternary resolver preserves `meta.condition` as an existing `FieldNode` instead of inventing placeholder text.

## Remaining upstream blocker
The high-level `CompleteSourceAst/RouteSyncManifest` model already exists, but the legacy `executeScanPipeline` does not consume it. The next repair must connect existing scanner inputs to this validated upstream model rather than create another interface.

## Verification
v14 after repair:
- producer chain: 7/7
- Laravel PHP source files: 111
- sourceAstUses: 1
- canonicalAstRescans: 7
- conditionLoss: 0
- branchCollapse: 0
- targetedTernary: 1
- fallbackReclassification: 10
- duplicateNullability: 2
- splitSemanticAuthority: 5

`conditionLoss=0` means the detector no longer sees the old exact loss pattern; it is not by itself proof that all ternary semantics are complete.
