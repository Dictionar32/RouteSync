# Phase 1073 — Public Scanner Cutover

## Tujuan

Memaksa batas upstream → downstream wiring dengan menghapus concrete subscanner dari public package surface. `StaticLaravelScanner` tetap menjadi legacy facade, tetapi bukan semantic authority dan bukan registry public untuk concrete scanner.

## Perubahan

- `StaticLaravelScanner` tidak lagi melakukan wildcard re-export dari `scannerExports`.
- `scannerExports.ts` tidak lagi mengekspor `InvalidationResolver`, `RequestTypeDeriver`, `SemanticTypeDeriver`, `TypeDeriver`, atau concrete scanner lainnya.
- `packages/core/src/compiler/index.ts` tidak lagi mempublikasikan concrete subscanner.
- `packages/core/src/index.ts` hanya mempertahankan `StaticLaravelScanner` sebagai legacy facade dan tidak mempublikasikan concrete subscanner.
- `routeManifestLowerer` tetap boleh memakai `TypeDeriver` sebagai dependency internal composition; concrete implementation tidak menjadi downstream public contract.
- SDK tests yang memang menguji implementation internals dipindahkan dari public `@routesync/core` import ke explicit internal test surface.
- `DataFlowInterface` tetap generic; tidak diberi dependency Laravel/domain.
- `InterfaceDependencyBoundary<Upstream, Downstream>` tetap downstream-owned dan directional.

## Canonical dependency

```text
upstream domain
  -> manifest / semantic authority
  -> downstream wiring
  -> DataFlow / Graph / IR
```

`StaticLaravelScanner` hanya compatibility/orchestration facade.

## Validation

- Phase 1066: PASS
- Phase 1069: PASS
- Phase 1070: PASS
- Phase 1072: PASS
- Phase 1073: PASS (8/8)
- TypeScript syntax transpile check: PASS
- No concrete scanner imports from `@routesync/core` in SDK/CLI consumers: PASS

Full `tsc` is not claimed because `packages/core/tsconfig.json` is absent in this workspace.
