# Phase 2705 — Domain-typed runtime route evidence

## Scope and correction

The prior phases still exposed a low-level route-domain projection: `RouteDomainInfo` represented both `rawDomain` and `bareDomain` as `string`, and the implementation populated both from the resource name. This duplicated a value and erased the semantic distinction between resource, domain, and group.

This phase removes that model at its source. `routeDomainEvidence.ts` now exports `RouteDomainEvidence` with the existing domain value objects (`ResourceName`, `DomainName`, `DomainName`) and an interface-typed runtime operation object:

```ts
export interface RouteDomainEvidenceExtractionInterface {
  readonly extract: (route: RouteSemanticFlow) => RouteDomainEvidence;
}

export const routeDomainEvidenceExtraction: RouteDomainEvidenceExtractionInterface = Object.freeze({
  extract: (route: RouteSemanticFlow): RouteDomainEvidence => Object.freeze({
    resource: route.identity.domain.resource,
    domain: route.identity.domain.domain,
    group: route.identity.domain.group,
  }),
});
```

The operation copies canonical semantic values from the route identity; it does not serialize and reparse them as strings. The retired `extractRouteDomain` function export and `RouteDomainInfo` contract were removed from the active source re-export path. There are no remaining active TypeScript references to those retired names.

## Runtime trace

```text
CLI scan/sync
  -> routeSyncCliUpstreamCompositionFactory
  -> routeSyncCliManifestScanOperationFactory
  -> controllerInvocationManifestCompositionAuthority
  -> source discovery and source identity binding
  -> PHP frontend AST adapter
  -> source invocation semantic pipeline
  -> canonical route identity (resource + domain + group value objects)
  -> routeDomainEvidenceExtraction.extract(route)
  -> RequestType source-evidence inventory
  -> request/resource resolution ledgers
  -> semantic reasoning and producer receipts
  -> independent proof verifier
  -> coverage / decision / authority / integrity
  -> manifest projection only when all required gates permit it
```

## Audit results

- Phase 2705 domain-model audit: **8/8** static assertions passed.
- Phase 2704 runtime operation-object audit: **11/11** static assertions passed.
- TypeScript syntax transpilation for the three changed TypeScript files: **3/3** without syntax diagnostics.
- Active TypeScript references to `extractRouteDomain` / `RouteDomainInfo`: none found.

These checks do not establish full project type correctness or runtime behavior. Full workspace typecheck, CLI scan/sync integration, and unit tests were not run in this environment.

## Important boundary: this does not eliminate every primitive string

This patch fixes one real domain-model leak; it does **not** claim the entire upstream manifest graph is string-free. The source-evidence inventory still serializes canonical semantic keys and source occurrence keys into template-string forms (`route:${string}`, `resource:${string}`, `route-occurrence:${string}`, etc.), and the CLI loader still handles environment variables/module specifiers as strings at the external I/O boundary. Those are remaining low-level surfaces and should not be misreported as solved.

A larger migration of the key model must replace the current string-encoded keys with structured, domain-separated identity value objects and update all equality, set/map, receipt, and proof-verifier consumers together. The source contract currently has many key consumers; changing only the aliases would be cosmetic and could break collision closure or proof replay. This phase deliberately does not pretend that a broad unsafe rewrite is complete.

## Semantic blocker remains open

`requestTypeDerivationProofVerifier.verify` still fails closed with `verification_incomplete` where the complete canonical-law proof is unavailable. The 34-law contract has not been independently verified in full. Manifest projection must not claim verified semantic output until those obligations are proven and the real scan/sync integration suite passes.

## TypeScript references

- [TypeScript Object Types](https://www.typescriptlang.org/docs/handbook/2/objects.html) — named interface contracts and object-shaped values.
- [TypeScript Narrowing / Discriminated Unions](https://www.typescriptlang.org/docs/handbook/2/narrowing.html) — preserving explicit variants in semantic models.
