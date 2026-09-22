# Phase 135 — Request Interface High-Model Elevation

## Principle

Interface repair is not field deletion or renaming. The request model must encode the domain relationship so downstream consumes meaning directly.

## Before

`FormRequestSource` exposed request class/form type as parallel scalars, while Route used `RouteRequestSourceBinding` and `RouteRequestBinding` as two vocabularies. `RequestType` carried identity/actions/response but lost the source origin. `actionVariableTracker` manufactured `FormRequestDescriptor` from the `*Request` naming convention.

## After

Canonical request model:

```text
FormRequestSource
├── identity
│   ├── requestClass
│   └── formType
├── sourceFile
└── fields

RequestIdentity
├── source
└── resource

RouteRequestBinding
├── identity
└── source

RequestType
├── identity
├── source
├── actions
└── response
```

`RouteRequestSourceBinding` and `descriptor` vocabulary are removed from the canonical request model.

`actionVariableTracker` now resolves a controller parameter against the scanned `FormRequestSource` map. It no longer creates a request descriptor from `typeName.endsWith('Request')` and no longer returns `formRequests[]`.

The upstream request ADT was also elevated:

```text
RequestDefinition
├── identity
│   ├── request
│   └── formType
├── authorization
├── schema
└── source
```

## Invariants

- No Resource → RequestType fallback.
- No Resource → `${resource}Form` fallback.
- No duplicate Route request vocabulary.
- No `formRequests[]` canonical Route interface.
- FormRequest naming is established once at the scanner origin boundary.
- RequestType preserves its FormRequest origin instead of requiring a later lookup.
- Downstream old `requestType.resourceName` / `requestType.formTypeName` usages are intentionally left visible as migration errors; they are not restored.

## Verification

Repository-wide typecheck could not complete because the extracted checkpoint lacks the Node `crypto` type dependency (`TS2307`), not because of a reported request-model diagnostic. Legacy downstream scalar consumers remain visible and are the next trace boundary.
