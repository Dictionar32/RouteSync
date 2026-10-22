# Phase 2352 changelog

- Evolved the existing route-method judgment ADT to omit irrelevant `targetMethods` from `resource` and `any` variants.
- Kept target-method evidence on `match` and `standard` variants where the scanner consumes it.
- Advanced the existing method authority contract to version 4 and route scanner outcomes to version 20; synchronized scanner/pipeline references.
- Updated the existing method judgment regression test and structural audits.
- Added `scripts/audits/audit-phase2352-minimal-route-method-judgment-adt.cjs` and upstream documentation.
- Did not run `npm run build`, TypeScript type-check, Vitest, or CLI end-to-end.
- Also synchronized the existing attribute-scanner composition object's version literal with `LaravelAttributeScannerInterface` (20); no new interface was introduced.
