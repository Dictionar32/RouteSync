# Phase 569 — Build Trace: Contract Action PropertyName

## Source trace

The Phase 568 build reaches ESM/CJS success and fails only during DTS generation at
`ContractActionGenerator.ts:56:57`.

The generated field records used `name: string`, while `ResolvedProperty.name` requires the
nominal semantic `PropertyName` value object.

## Repair

`ContractActionGenerator` now constructs the semantic property name through
`createPropertyName(f.name)` before passing the records to `ResolvedObjectType.plain`.

This keeps the boundary nominal and avoids weakening `ResolvedProperty` to accept raw strings.

## Verification

The checkpoint has no `node_modules`, so a full DTS/build run cannot be executed inside the
checkpoint environment. The workspace-level TypeScript invocation is blocked by missing
`@types/node` and `vitest/globals`, not by this source diagnostic.

Next verification command in the real development workspace:

`npm run build 2>&1 | tee build.log`
