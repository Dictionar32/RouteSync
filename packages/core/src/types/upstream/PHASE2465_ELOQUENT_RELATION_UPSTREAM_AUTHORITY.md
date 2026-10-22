# Phase2465 — Eloquent Relation Upstream Authority

Eloquent relation method recognition and descriptor ownership now live in the upstream authority layer. The contract uses a closed judgment for recognized and unrecognized method names, and the implementation exports through `export const eloquentRelationMethodAuthority: EloquentRelationMethodAuthorityInterface`.

The existing `EloquentRelationDescriptor` and `EloquentRelationType` remain canonical. The legacy scanner-local `eloquentRelationVocabulary.ts` has been removed. This closes only the relation-method vocabulary boundary; it does not claim to remove all relation algebra from the model producer or retire every model subscanner.
