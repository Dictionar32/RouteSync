# Trace Tool Repair V56

## Urutan
1. Perbaiki auditor.
2. Trace ulang ecommerce-shop.
3. Validasi first-loss per datum.
4. Evaluasi interface high-level.
5. Production repair hanya jika source-backed owner/mapper terbukti.

## Tool repairs
- `SourceAsts.kind` tidak lagi dihitung sebagai category.
- Delegate duplicate `RouteScanner.scan()` vs `await RouteScanner.scan()` dinormalisasi menjadi satu finding.
- High-level type declaration tetap tidak dianggap sebagai value-flow.
- Orphaned high-level projection tidak dianggap sebagai first-loss.

## V56 trace
- PHP files: 111
- status: UNPROVEN
- critical: 32
- high: 38
- unproven: 10
- semantic field loss: 0
- return type mismatch: 1
- delegate mismatch: 1
- hidden rescans: 2
- pipeline rescans: 6
- nested project-root rescans: 8
- semantic mapping unproven: 4
- semantic lineage unproven: 4
- free data: 13

## First-loss decision
Model datums `table`, `primaryKey`, `keyType`, `incrementing`, `fillable`, `guarded`, `hidden`, `appends` have no proven loss in the actual traced production path.

`CompleteLaravelSourceModel` is classified as `ORPHANED_INTENDED_PROJECTION`, not a data-loss boundary.

## Remaining proven AST defect
`RouteScanner.scanAsts()` declares `readonly RouteAst[]` but calls/returns `RouteScanner.scan(...)`, whose actual type is `Promise<readonly ParsedRoute[]>`.

A safe production repair is blocked until an existing source-backed `ParsedRoute -> RouteDefinition` owner/mapper is proven. Do not use cast, `as`, or a parallel interface to silence the mismatch.

## High-level interface decision
No new fields and no parallel interface. Existing nested semantic owners remain authoritative.
