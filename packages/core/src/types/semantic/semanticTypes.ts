/**
 * Semantic type vocabulary and immutable semantic field indexes.
 *
 * Names remain semantic value objects at this boundary. Lookup absence is an
 * explicit ADT instead of `undefined`, so consumers do not have to infer
 * whether a missing field is an error, an absent member, or an empty value.
 */

import type { SemanticResolution } from '../contract';
import { relationOptionFold, relationFirstOption, relationProject, relationRefine } from '../../semantic/foundation/relationalSequence';
import { relationEqual } from '../../semantic/foundation/semanticRelations';
import type { PropertyName } from '../domain/semanticValues';

export type SemanticType = import('../domain/semanticType').SemanticType;

export interface SemanticFieldEntry {
  readonly name: PropertyName;
  readonly type: SemanticType;
}

export type SemanticFieldLookup =
  | { readonly kind: 'found'; readonly entry: SemanticFieldEntry }
  | { readonly kind: 'missing'; readonly name: PropertyName };

const fieldKey = (name: PropertyName): string => `${name.kind}:${name.value}`;

export class SemanticFieldSet implements Iterable<SemanticFieldEntry> {
  public readonly entries: readonly SemanticFieldEntry[];


  constructor(entries: readonly SemanticFieldEntry[]) {
    this.entries = Object.freeze([...entries]);
    Object.freeze(this);
  }

  public static empty(): SemanticFieldSet {
    return new SemanticFieldSet([]);
  }

  public static fromEntries(entries: readonly SemanticFieldEntry[]): SemanticFieldSet {
    return new SemanticFieldSet(entries);
  }

  public lookup(name: PropertyName): SemanticFieldLookup {
    return relationOptionFold(
      relationFirstOption(this.entries, entry => relationEqual(fieldKey(entry.name), fieldKey(name))),
      () => ({ kind: 'missing', name }),
      entry => ({ kind: 'found', entry }),
    );
  }

  public getType(name: PropertyName): SemanticFieldLookup {
    return this.lookup(name);
  }

  public has(name: PropertyName): boolean {
    return relationOptionFold(relationFirstOption(this.entries, entry => relationEqual(fieldKey(entry.name), fieldKey(name))), () => false, () => true);
  }

  public hasField(name: PropertyName): boolean {
    return this.has(name);
  }

  public get size(): number {
    return this.entries.length;
  }

  public [Symbol.iterator](): Iterator<SemanticFieldEntry> {
    return this.entries[Symbol.iterator]();
  }
}

type SemanticNodeVariant<T extends SemanticResolution> =
  Omit<T, 'fields'> & {
    readonly type: SemanticType;
    readonly fields: SemanticFieldSet;
  };

export type SemanticNode = SemanticResolution extends infer T
  ? T extends SemanticResolution
    ? SemanticNodeVariant<T>
    : never
  : never;


export type SemanticNodeScalar = Extract<SemanticNode, { readonly kind: 'scalar' }>;
export type SemanticNodeModel = Extract<SemanticNode, { readonly kind: 'model' }>;
export type SemanticNodeResource = Extract<SemanticNode, { readonly kind: 'resource' }>;
export type SemanticNodeObject = Extract<SemanticNode, { readonly kind: 'object' }>;
export type SemanticNodeProjection = Extract<SemanticNode, { readonly kind: 'query_projection' }>;
export type SemanticNodeIndeterminate = Extract<SemanticNode, { readonly kind: 'indeterminate' }>;

export function matchSemanticNode<T>(
  node: SemanticNode,
  visitor: {
    scalar: (value: SemanticNodeScalar) => T;
    model: (value: SemanticNodeModel) => T;
    resource: (value: SemanticNodeResource) => T;
    object: (value: SemanticNodeObject) => T;
    query_projection: (value: SemanticNodeProjection) => T;
    indeterminate: (value: SemanticNodeIndeterminate) => T;
  },
): T {
  const scalar = relationRefine(node, (value): value is SemanticNodeScalar => relationEqual(value.kind, 'scalar'));
  return relationOptionFold(scalar, () => {
    const model = relationRefine(node, (value): value is SemanticNodeModel => relationEqual(value.kind, 'model'));
    return relationOptionFold(model, () => {
      const resource = relationRefine(node, (value): value is SemanticNodeResource => relationEqual(value.kind, 'resource'));
      return relationOptionFold(resource, () => {
        const object = relationRefine(node, (value): value is SemanticNodeObject => relationEqual(value.kind, 'object'));
        return relationOptionFold(object, () => {
          const projection = relationRefine(node, (value): value is SemanticNodeProjection => relationEqual(value.kind, 'query_projection'));
          return relationOptionFold(projection, () => visitor.indeterminate(node as SemanticNodeIndeterminate), visitor.query_projection);
        }, visitor.object);
      }, visitor.resource);
    }, visitor.model);
  }, visitor.scalar);
}
