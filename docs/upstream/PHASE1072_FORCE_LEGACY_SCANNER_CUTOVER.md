# Phase 1072 — Force Legacy Scanner Cutover

`StaticLaravelScanner` remains only as a legacy scan facade. Its helper/descriptor compatibility surface is no longer part of the facade.

The canonical direction is:

`upstream producer -> downstream explicit scanner/subscanner surface -> consumers`

The legacy facade no longer depends on or exposes `StaticLaravelScannerCompatibilityInterface`. Helper exports are obtained from `scannerExports`, while production CLI already consumes `ManifestBuilderInterface` directly.

This intentionally breaks the old helper-through-facade path so new code cannot continue to depend on the legacy scanner as a semantic helper authority.

The cutover removes the compatibility module entirely. `StaticLaravelScanner` remains only for legacy scan/scanFlow orchestration and canonical manifest production through `ManifestBuilderInterface`.
