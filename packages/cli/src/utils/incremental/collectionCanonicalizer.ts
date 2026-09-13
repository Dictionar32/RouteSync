/**
 * collectionCanonicalizer.ts
 *
 * Canonicalizes legacy collection flags into recursive descriptors.
 *
 * @module cli/utils/incremental/collectionCanonicalizer
 */

/**
 * Convert legacy collection flags into the manifest's canonical recursive
 * descriptor. The scanner historically represented a collection as either a
 * `resource`/`model` node with `collection: true`, or a resolved static
 * Resource::collection() call. Keeping the conversion here means every
 * manifest producer (fresh scans and incremental cache hits) gets one shape.
 */
export function canonicalizeCollectionDescriptor(value: Record<string, unknown>): Record<string, unknown> {
  if (value.kind === 'array' && value.element && typeof value.element === 'object') {
    return {
      ...value,
      element: canonicalizeCollectionDescriptor(value.element as Record<string, unknown>),
    };
  }

  if (value.kind === 'object' && value.fields && typeof value.fields === 'object') {
    const fields = Object.fromEntries(
      Object.entries(value.fields as Record<string, unknown>).map(([name, field]) => [
        name,
        field && typeof field === 'object'
          ? canonicalizeCollectionDescriptor(field as Record<string, unknown>)
          : field,
      ])
    );
    return { ...value, fields };
  }

  const resolved = value.resolved && typeof value.resolved === 'object'
    ? value.resolved as Record<string, unknown>
    : undefined;
  const semantic = value.semantic && typeof value.semantic === 'object'
    ? value.semantic as Record<string, unknown>
    : undefined;
  const resolution = resolved ?? semantic;
  const resolvedKind = resolution?.type === 'resource' || resolution?.type === 'model'
    ? resolution.type
    : undefined;
  const directKind = value.kind === 'resource' || value.kind === 'model'
    ? value.kind
    : undefined;
  const kind = directKind ?? resolvedKind;
  const isCollection = value.collection === true || resolution?.collection === true;

  if (!kind || !isCollection) return value;

  const nameKey = kind === 'resource' ? 'resource' : 'model';
  const name = value[nameKey] ?? resolution?.[nameKey];
  if (typeof name !== 'string') return value;

  const element: Record<string, unknown> = {
    kind,
    [nameKey]: name,
    collection: false,
  };

  // Retain model linkage and resolution trace on the element; they belong to
  // the element after collection-ness moves to the outer array descriptor.
  if (kind === 'resource' && typeof value.model === 'string') {
    element.model = value.model;
  }
  if (resolved) element.resolved = { ...resolved, collection: false };
  if (semantic) element.semantic = { ...semantic, collection: false };

  const { kind: _kind, resource: _resource, model: _model, collection: _collection,
    resolved: _resolved, semantic: _semantic, ...metadata } = value;

  return {
    ...metadata,
    kind: 'array',
    element,
  };
}
