import type { ParsedRoute } from "./routes";
import type { PropertyName, ResourceName } from "./semanticValues";

/**
 * ResourceGroupKind
 *
 * Canonical ADT discriminator for classifying Route Resource Groups.
 */
export const ResourceGroupKind = Object.freeze({
  FullCrud: 'full_crud',
  ReadOnlyCrud: 'read_only_crud',
  FlexibleCrud: 'flexible_crud',
  Crud: 'crud',
  Singleton: 'singleton',
  Custom: 'custom'
} as const);

export type ResourceGroupKind = typeof ResourceGroupKind[keyof typeof ResourceGroupKind];

export interface ResourceGroupSpecification<K extends ResourceGroupKind = ResourceGroupKind> {
  readonly kind: K;
  readonly isCrud: boolean;
  readonly listKeyFn: string;
  readonly defaultDetailKeyFn: string;
  readonly defaultPrimaryKeyType: string;
  readonly description: string;
}

export type ResourceGroupRegistry = {
  readonly [K in ResourceGroupKind]: ResourceGroupSpecification<K>;
};

export const RESOURCE_GROUP_REGISTRY: ResourceGroupRegistry = Object.freeze({
  [ResourceGroupKind.FullCrud]: {
    kind: ResourceGroupKind.FullCrud,
    isCrud: true,
    listKeyFn: 'lists',
    defaultDetailKeyFn: 'detail',
    defaultPrimaryKeyType: 'number',
    description: 'Complete standard RESTful CRUD resource with index, show, create, update, and delete endpoints'
  },
  [ResourceGroupKind.ReadOnlyCrud]: {
    kind: ResourceGroupKind.ReadOnlyCrud,
    isCrud: true,
    listKeyFn: 'lists',
    defaultDetailKeyFn: 'detail',
    defaultPrimaryKeyType: 'number',
    description: 'Read-only RESTful CRUD resource with index and show endpoints only'
  },
  [ResourceGroupKind.FlexibleCrud]: {
    kind: ResourceGroupKind.FlexibleCrud,
    isCrud: true,
    listKeyFn: 'lists',
    defaultDetailKeyFn: 'detail',
    defaultPrimaryKeyType: 'number',
    description: 'Customizable CRUD resource with index, show, and explicit mutation capabilities'
  },
  [ResourceGroupKind.Crud]: {
    kind: ResourceGroupKind.Crud,
    isCrud: true,
    listKeyFn: 'lists',
    defaultDetailKeyFn: 'detail',
    defaultPrimaryKeyType: 'number',
    description: 'Standard RESTful CRUD resource with both collection (index) and item (show) endpoints'
  },
  [ResourceGroupKind.Singleton]: {
    kind: ResourceGroupKind.Singleton,
    isCrud: false,
    listKeyFn: 'list',
    defaultDetailKeyFn: 'show',
    defaultPrimaryKeyType: 'string | number',
    description: 'Singleton or action-oriented resource without item parameter (e.g. cart, profile, auth)'
  },
  [ResourceGroupKind.Custom]: {
    kind: ResourceGroupKind.Custom,
    isCrud: false,
    listKeyFn: 'list',
    defaultDetailKeyFn: 'detail',
    defaultPrimaryKeyType: 'string | number',
    description: 'Custom or non-standard route group'
  }
});

/**
 * Mutation Capability ADT (Replaces optional ? with explicit sum type).
 */
export interface AvailableMutation<TRoute> {
  readonly available: true;
  readonly route: TRoute;
}

export interface AbsentMutation {
  readonly available: false;
}

export type MutationCapability<TRoute> = AvailableMutation<TRoute> | AbsentMutation;

export const MutationCapability = Object.freeze({
  available: <TRoute>(route: TRoute): AvailableMutation<TRoute> =>
    Object.freeze({ available: true, route }),
  absent: (): AbsentMutation =>
    Object.freeze({ available: false }),
  fromNullable: <TRoute>(route: TRoute | null | undefined): MutationCapability<TRoute> =>
    route ? Object.freeze({ available: true, route }) : Object.freeze({ available: false })
});

/**
 * Resource Group Type Signatures ADT
 *
 * Guarantees that all response, form, and error types are resolved
 * and frozen at the Origin Boundary with 0 downstream guessing or searches.
 */
export interface BaseResourceGroupTypeSignature {
  readonly list: string;
  readonly detail: string;
  readonly create: string;
  readonly update: string;
  readonly error: string;
  readonly hasCustomError: boolean;
  readonly importedTypes: readonly string[];
  readonly contractImportedTypes: readonly string[];
}

export interface FullCrudTypeSignature extends BaseResourceGroupTypeSignature {}

export interface ReadOnlyCrudTypeSignature extends BaseResourceGroupTypeSignature {
  readonly create: 'never';
  readonly update: 'never';
}

export interface FlexibleCrudTypeSignature extends BaseResourceGroupTypeSignature {}

export interface SingletonTypeSignature extends BaseResourceGroupTypeSignature {
  readonly list: 'never';
}

export interface CustomTypeSignature extends BaseResourceGroupTypeSignature {}

export type ResourceGroupTypeSignature =
  | FullCrudTypeSignature
  | ReadOnlyCrudTypeSignature
  | FlexibleCrudTypeSignature
  | SingletonTypeSignature
  | CustomTypeSignature;

export interface ResourceGroupTypeSignatureParams {
  readonly list: string;
  readonly detail: string;
  readonly create: string;
  readonly update: string;
  readonly error: string;
  readonly hasCustomError: boolean;
  readonly importedTypes: readonly string[];
  readonly contractImportedTypes: readonly string[];
}

export class ScannedResourceGroupTypeSignature implements BaseResourceGroupTypeSignature {
  public readonly list: string;
  public readonly detail: string;
  public readonly create: string;
  public readonly update: string;
  public readonly error: string;
  public readonly hasCustomError: boolean;
  public readonly importedTypes: readonly string[];
  public readonly contractImportedTypes: readonly string[];

  constructor(params: ResourceGroupTypeSignatureParams) {
    this.list = params.list;
    this.detail = params.detail;
    this.create = params.create;
    this.update = params.update;
    this.error = params.error;
    this.hasCustomError = params.hasCustomError;
    this.importedTypes = Object.freeze([...params.importedTypes]);
    this.contractImportedTypes = Object.freeze([...params.contractImportedTypes]);
    Object.freeze(this);
  }

  public static createDefault(): ScannedResourceGroupTypeSignature {
    return new ScannedResourceGroupTypeSignature({
      list: 'never',
      detail: 'never',
      create: 'never',
      update: 'never',
      error: 'ApiError',
      hasCustomError: false,
      importedTypes: Object.freeze([]),
      contractImportedTypes: Object.freeze([])
    });
  }
}

/**
 * Resource Group Core Identity Trait.
 * Encapsulates immutable naming, identification, and entity route collection.
 */
export interface ResourceGroupIdentity {
  readonly resource: ResourceName;
  readonly key: PropertyName;
  readonly title: PropertyName;
}

export interface ResourceGroupPrimaryKey {
  readonly name: PropertyName;
  readonly type: string;
}

export interface ResourceGroupIdentityTrait<TRoute = ParsedRoute> {
  readonly identity: ResourceGroupIdentity;
  readonly primaryKey: ResourceGroupPrimaryKey;
  readonly routes: readonly TRoute[];
  readonly primaryRoute: TRoute;
}

export interface ResourceGroupQueryKeys {
  readonly list: PropertyName;
  readonly detail: PropertyName;
}

export interface ResourceGroupQueryKeysTrait {
  readonly queryKeys: ResourceGroupQueryKeys;
}

/** Construction-only adapter input. It is not part of the canonical domain model. */
interface ResourceGroupQueryKeyInput {
  readonly listKeyFn: string;
  readonly detailKeyFn: string;
}

/**
 * Resource Group Read Endpoints Trait.
 * Guaranteed present on all CRUD variants (index, show).
 */
export interface CrudEndpointsTrait<TRoute = ParsedRoute> {
  readonly index: TRoute;
  readonly show: TRoute;
}

/**
 * Resource Group Strict Mutation Endpoints Trait.
 * Guaranteed present on Full CRUD (create, update, delete).
 */
export interface StrictMutationEndpointsTrait<TRoute = ParsedRoute> {
  readonly create: TRoute;
  readonly update: TRoute;
  readonly delete: TRoute;
}

/**
 * Resource Group Flexible Mutation Endpoints Trait.
 * Expressed via the explicit MutationCapability ADT.
 */
export interface FlexibleMutationEndpointsTrait<TRoute = ParsedRoute> {
  readonly create: MutationCapability<TRoute>;
  readonly update: MutationCapability<TRoute>;
  readonly delete: MutationCapability<TRoute>;
}

/**
 * Resource Group Visitor Capability Trait.
 * Enables zero-switch, zero-if polymorphic catamorphism.
 */
export interface ResourceGroupVisitorCapability<TRoute = ParsedRoute> {
  readonly matchFineGrained: <R>(
    visitor: ExhaustiveFineGrainedResourceGroupVisitor<R, TRoute>
  ) => R;
  readonly matchUnified: <R>(
    visitor: UnifiedCrudResourceGroupVisitor<R, TRoute>
  ) => R;
}

/**
 * Resource Group Lowering Trait.
 * Self-projecting capability for query key blocks and cache invalidation configs.
 * 0 switch, 0 branching downstream.
 */
/**
 * Lowering operations are implementation capabilities, not domain data.
 * Keep this contract outside BaseResourceGroupDescriptor so the canonical
 * domain model does not advertise code generation as part of its identity.
 */
export interface ResourceGroupLoweringOperations<TRoute = ParsedRoute> {
  lowerQueryKeyBlock(): IterableIterator<string>;
  lowerCacheConfig(addInvs: (route: TRoute, invs: string[]) => void): IterableIterator<string>;
}

/**
 * Base Resource Group Descriptor.
 * Composes core identity, query key metadata, lowering traits, and polymorphic visitor capabilities.
 */
export interface BaseResourceGroupDescriptor<TRoute = ParsedRoute>
  extends ResourceGroupIdentityTrait<TRoute>,
    ResourceGroupQueryKeysTrait,
    ResourceGroupVisitorCapability<TRoute> {
  readonly kind: ResourceGroupKind;
  readonly isCrud: boolean;
  readonly types: BaseResourceGroupTypeSignature;
  readonly extraMutations: readonly TRoute[];
  readonly customQueries: readonly TRoute[];
}

/**
 * Base CRUD Resource Group Descriptor.
 * Guaranteed isCrud: true and mandatory read endpoints (index, show).
 */
export interface BaseCrudResourceGroupDescriptor<TRoute = ParsedRoute>
  extends BaseResourceGroupDescriptor<TRoute>,
    CrudEndpointsTrait<TRoute> {
  readonly isCrud: true;
}

/**
 * Full CRUD Resource Group Descriptor.
 * Composes Base CRUD with strict non-nullable mutation endpoints.
 */
export interface FullCrudResourceGroupDescriptor<TRoute = ParsedRoute>
  extends BaseCrudResourceGroupDescriptor<TRoute>,
    StrictMutationEndpointsTrait<TRoute> {
  readonly kind: typeof ResourceGroupKind.FullCrud;
  readonly types: FullCrudTypeSignature;
}

/**
 * Read-Only CRUD Resource Group Descriptor.
 * Composes Base CRUD with Read-Only type signatures.
 */
export interface ReadOnlyCrudResourceGroupDescriptor<TRoute = ParsedRoute>
  extends BaseCrudResourceGroupDescriptor<TRoute> {
  readonly kind: typeof ResourceGroupKind.ReadOnlyCrud;
  readonly types: ReadOnlyCrudTypeSignature;
}

/**
 * Flexible CRUD Resource Group Descriptor.
 * Composes Base CRUD with MutationCapability ADTs.
 */
export interface FlexibleCrudResourceGroupDescriptor<TRoute = ParsedRoute>
  extends BaseCrudResourceGroupDescriptor<TRoute>,
    FlexibleMutationEndpointsTrait<TRoute> {
  readonly kind: typeof ResourceGroupKind.FlexibleCrud;
  readonly types: FlexibleCrudTypeSignature;
}

export type CrudResourceGroupDescriptor<TRoute = ParsedRoute> =
  | FullCrudResourceGroupDescriptor<TRoute>
  | ReadOnlyCrudResourceGroupDescriptor<TRoute>
  | FlexibleCrudResourceGroupDescriptor<TRoute>;

/**
 * Singleton Resource Group Descriptor.
 * Composes Base Descriptor with isCrud: false.
 */
export interface SingletonResourceGroupDescriptor<TRoute = ParsedRoute>
  extends BaseResourceGroupDescriptor<TRoute> {
  readonly kind: typeof ResourceGroupKind.Singleton;
  readonly isCrud: false;
  readonly types: SingletonTypeSignature;
}

/**
 * Custom Resource Group Descriptor.
 * Composes Base Descriptor with isCrud: false.
 */
export interface CustomResourceGroupDescriptor<TRoute = ParsedRoute>
  extends BaseResourceGroupDescriptor<TRoute> {
  readonly kind: typeof ResourceGroupKind.Custom;
  readonly isCrud: false;
  readonly types: CustomTypeSignature;
}

export type ResourceGroupDescriptor<TRoute = ParsedRoute> =
  | FullCrudResourceGroupDescriptor<TRoute>
  | ReadOnlyCrudResourceGroupDescriptor<TRoute>
  | FlexibleCrudResourceGroupDescriptor<TRoute>
  | SingletonResourceGroupDescriptor<TRoute>
  | CustomResourceGroupDescriptor<TRoute>;

/**
 * Common parameter traits for constructor initialization.
 */
export interface BaseResourceGroupParams<TRoute = ParsedRoute> {
  readonly groupName: string;
  readonly keyName: string;
  readonly titleName: string;
  readonly all: readonly TRoute[];
  readonly primaryRoute: TRoute;
  readonly extraMutations: readonly TRoute[];
  readonly customQueries: readonly TRoute[];
}

export interface BaseCrudParams<TRoute = ParsedRoute>
  extends BaseResourceGroupParams<TRoute>,
    CrudEndpointsTrait<TRoute> {
  readonly primaryKeyType: string;
}

export interface FullCrudParams<TRoute = ParsedRoute>
  extends BaseCrudParams<TRoute>,
    StrictMutationEndpointsTrait<TRoute> {
  readonly types: FullCrudTypeSignature;
}

export interface ReadOnlyCrudParams<TRoute = ParsedRoute>
  extends BaseCrudParams<TRoute> {
  readonly types: ReadOnlyCrudTypeSignature;
}

export interface FlexibleCrudParams<TRoute = ParsedRoute>
  extends BaseCrudParams<TRoute>,
    FlexibleMutationEndpointsTrait<TRoute> {
  readonly types: FlexibleCrudTypeSignature;
}

/**
 * Backward-compatibility alias for FlexibleCrudParams.
 */
export type CrudResourceGroupDescriptorParams<TRoute = ParsedRoute> = FlexibleCrudParams<TRoute>;

export interface SingletonResourceGroupDescriptorParams<TRoute = ParsedRoute>
  extends BaseResourceGroupParams<TRoute> {
  readonly types: SingletonTypeSignature;
}

export interface CustomResourceGroupDescriptorParams<TRoute = ParsedRoute>
  extends BaseResourceGroupParams<TRoute> {
  readonly detailKeyFn: string;
  readonly types: CustomTypeSignature;
}

function pushUnique(arr: string[], val: string): void {
  if (!arr.includes(val)) arr.push(val);
}

function* lowerMutationSlot<TRoute>(
  slotName: string,
  route: TRoute,
  defaultInvs: readonly string[],
  addInvs: (route: TRoute, invs: string[]) => void
): IterableIterator<string> {
  const invs = [...defaultInvs];
  addInvs(route, invs);

  if (invs.length > 0) {
    yield `      ${slotName}: {`;
    yield `        invalidate: [`;
    for (const inv of invs) {
      yield inv;
    }
    yield `        ],`;
    yield `      },`;
  }
}

function* lowerExtraMutations<TRoute>(
  group: AbstractResourceGroupDescriptor<TRoute>,
  addInvs: (route: TRoute, invs: string[]) => void
): IterableIterator<string> {
  for (const route of group.extraMutations as any[]) {
    const invs: string[] = [];
    if (group.isCrud) {
      pushUnique(invs, `          QueryKey.${group.identity.resource.value.value}.${group.queryKeys.list.value.value},`);
    }
    for (const getRoute of group.customQueries as any[]) {
      pushUnique(invs, `          QueryKey.${group.identity.resource.value.value}.${getRoute.actionName},`);
    }
    addInvs(route, invs);

    yield `      ${route.actionName}: {`;
    yield `        invalidate: [`;
    for (const inv of invs) {
      yield inv;
    }
    yield `        ],`;
    yield `      },`;
  }
}

/**
 * Abstract Base Class for Resource Group Descriptors.
 * Implements common identity, query key metadata, and frozen immutability.
 */
export abstract class AbstractResourceGroupDescriptor<TRoute = ParsedRoute>
  implements BaseResourceGroupDescriptor<TRoute>
{
  public abstract readonly kind: ResourceGroupKind;
  public abstract readonly isCrud: boolean;
  public abstract readonly types: BaseResourceGroupTypeSignature;

  public readonly identity: ResourceGroupIdentity;
  public readonly primaryKey: ResourceGroupPrimaryKey;
  public readonly queryKeys: ResourceGroupQueryKeys;
  public readonly routes: readonly TRoute[];
  public readonly primaryRoute: TRoute;
  protected readonly groupName: string;
  protected readonly keyName: string;
  protected readonly titleName: string;
  protected readonly listKeyFn: string;
  protected readonly detailKeyFn: string;
  protected readonly primaryKeyType: string;
  protected readonly all: readonly TRoute[];
  public readonly extraMutations: readonly TRoute[];
  public readonly customQueries: readonly TRoute[];

  constructor(
    params: BaseResourceGroupParams<TRoute>,
    queryKeys: ResourceGroupQueryKeyInput,
    primaryKeyType: string
  ) {
    this.groupName = params.groupName;
    this.keyName = params.keyName;
    this.titleName = params.titleName;
    this.listKeyFn = queryKeys.listKeyFn;
    this.detailKeyFn = queryKeys.detailKeyFn;
    this.primaryKeyType = primaryKeyType;
    this.all = Object.freeze(params.all);
    this.primaryRoute = params.primaryRoute;
    this.identity = Object.freeze({
      resource: Object.freeze({ kind: 'resource_name' as const, value: Object.freeze({ kind: 'string_value' as const, value: params.groupName }) }),
      key: Object.freeze({ kind: 'property_name' as const, value: Object.freeze({ kind: 'string_value' as const, value: params.keyName }) }),
      title: Object.freeze({ kind: 'property_name' as const, value: Object.freeze({ kind: 'string_value' as const, value: params.titleName }) }),
    });
    this.primaryKey = Object.freeze({
      name: this.identity.key,
      type: this.primaryKeyType,
    });
    this.queryKeys = Object.freeze({
      list: Object.freeze({ kind: 'property_name' as const, value: Object.freeze({ kind: 'string_value' as const, value: this.listKeyFn }) }),
      detail: Object.freeze({ kind: 'property_name' as const, value: Object.freeze({ kind: 'string_value' as const, value: this.detailKeyFn }) }),
    });
    this.routes = this.all;
    this.extraMutations = Object.freeze(params.extraMutations);
    this.customQueries = Object.freeze(params.customQueries);
  }

  public abstract matchFineGrained<R>(
    visitor: ExhaustiveFineGrainedResourceGroupVisitor<R, TRoute>
  ): R;

  public abstract matchUnified<R>(
    visitor: UnifiedCrudResourceGroupVisitor<R, TRoute>
  ): R;

  public abstract lowerQueryKeyBlock(): IterableIterator<string>;

  public abstract lowerCacheConfig(
    addInvs: (route: TRoute, invs: string[]) => void
  ): IterableIterator<string>;
}

/**
 * Abstract Base Class for CRUD Resource Group Descriptors.
 * Implements index, show, isCrud: true, and the unified CRUD visitor dispatcher.
 */
export abstract class AbstractCrudResourceGroupDescriptor<TRoute = ParsedRoute>
  extends AbstractResourceGroupDescriptor<TRoute>
  implements BaseCrudResourceGroupDescriptor<TRoute>
{
  public readonly isCrud = true as const;
  public readonly index: TRoute;
  public readonly show: TRoute;

  constructor(
    params: BaseCrudParams<TRoute>,
    queryKeys: ResourceGroupQueryKeyInput
  ) {
    super(params, queryKeys, params.primaryKeyType);
    this.index = params.index;
    this.show = params.show;
  }

  public matchUnified<R>(
    visitor: UnifiedCrudResourceGroupVisitor<R, TRoute>
  ): R {
    return visitor.crud(this as unknown as CrudResourceGroupDescriptor<TRoute>);
  }

  public *lowerQueryKeyBlock(): IterableIterator<string> {
    yield `  ${this.groupName}: {`;
    yield `    ...createBaseQueryKey<typeof Entity.${this.keyName}, ${this.primaryKeyType}>(Entity.${this.keyName}),`;
    for (const route of this.all as any[]) {
      if (route.hasParams) {
        yield `    ${route.actionName}: (params?: string | number | Record<string, unknown>) => [Entity.${this.keyName}, "${route.actionName}", params ?? {}] as const,`;
      } else {
        yield `    ${route.actionName}: () => [Entity.${this.keyName}, "${route.actionName}"] as const,`;
      }
    }
    yield `  },`;
  }
}

export class ScannedFullCrudResourceGroupDescriptor<TRoute = ParsedRoute>
  extends AbstractCrudResourceGroupDescriptor<TRoute>
  implements FullCrudResourceGroupDescriptor<TRoute>
{
  public readonly kind = ResourceGroupKind.FullCrud;
  public readonly types: FullCrudTypeSignature;
  public readonly create: TRoute;
  public readonly update: TRoute;
  public readonly delete: TRoute;

  constructor(params: FullCrudParams<TRoute>) {
    super(params, {
      listKeyFn: RESOURCE_GROUP_REGISTRY[ResourceGroupKind.FullCrud].listKeyFn,
      detailKeyFn: RESOURCE_GROUP_REGISTRY[ResourceGroupKind.FullCrud].defaultDetailKeyFn
    });
    this.types = params.types;
    this.create = params.create;
    this.update = params.update;
    this.delete = params.delete;
    Object.freeze(this);
  }

  public matchFineGrained<R>(
    visitor: ExhaustiveFineGrainedResourceGroupVisitor<R, TRoute>
  ): R {
    return visitor.full_crud(this);
  }

  public *lowerCacheConfig(
    addInvs: (route: TRoute, invs: string[]) => void
  ): IterableIterator<string> {
    yield `      list: QueryKey.${this.groupName}.${this.listKeyFn},`;
    yield `      detail: QueryKey.${this.groupName}.${this.detailKeyFn},`;

    yield* lowerMutationSlot('create', this.create, [`          QueryKey.${this.groupName}.${this.listKeyFn},`], addInvs);
    yield* lowerMutationSlot('update', this.update, [
      `          QueryKey.${this.groupName}.${this.listKeyFn},`,
      `          QueryKey.${this.groupName}.${this.detailKeyFn},`,
    ], addInvs);
    yield* lowerMutationSlot('remove', this.delete, [`          QueryKey.${this.groupName}.${this.listKeyFn},`], addInvs);

    yield* lowerExtraMutations(this, addInvs);
  }
}

export class ScannedReadOnlyCrudResourceGroupDescriptor<TRoute = ParsedRoute>
  extends AbstractCrudResourceGroupDescriptor<TRoute>
  implements ReadOnlyCrudResourceGroupDescriptor<TRoute>
{
  public readonly kind = ResourceGroupKind.ReadOnlyCrud;
  public readonly types: ReadOnlyCrudTypeSignature;

  constructor(params: ReadOnlyCrudParams<TRoute>) {
    super(params, {
      listKeyFn: RESOURCE_GROUP_REGISTRY[ResourceGroupKind.ReadOnlyCrud].listKeyFn,
      detailKeyFn: RESOURCE_GROUP_REGISTRY[ResourceGroupKind.ReadOnlyCrud].defaultDetailKeyFn
    });
    this.types = params.types;
    Object.freeze(this);
  }

  public matchFineGrained<R>(
    visitor: ExhaustiveFineGrainedResourceGroupVisitor<R, TRoute>
  ): R {
    return visitor.read_only_crud(this);
  }

  public *lowerCacheConfig(
    addInvs: (route: TRoute, invs: string[]) => void
  ): IterableIterator<string> {
    yield `      list: QueryKey.${this.groupName}.${this.listKeyFn},`;
    yield `      detail: QueryKey.${this.groupName}.${this.detailKeyFn},`;

    yield* lowerExtraMutations(this, addInvs);
  }
}

export class ScannedFlexibleCrudResourceGroupDescriptor<TRoute = ParsedRoute>
  extends AbstractCrudResourceGroupDescriptor<TRoute>
  implements FlexibleCrudResourceGroupDescriptor<TRoute>
{
  public readonly kind = ResourceGroupKind.FlexibleCrud;
  public readonly types: FlexibleCrudTypeSignature;
  public readonly create: MutationCapability<TRoute>;
  public readonly update: MutationCapability<TRoute>;
  public readonly delete: MutationCapability<TRoute>;

  constructor(params: FlexibleCrudParams<TRoute>) {
    super(params, {
      listKeyFn: RESOURCE_GROUP_REGISTRY[ResourceGroupKind.FlexibleCrud].listKeyFn,
      detailKeyFn: RESOURCE_GROUP_REGISTRY[ResourceGroupKind.FlexibleCrud].defaultDetailKeyFn
    });
    this.types = params.types;
    this.create = params.create;
    this.update = params.update;
    this.delete = params.delete;
    Object.freeze(this);
  }

  public matchFineGrained<R>(
    visitor: ExhaustiveFineGrainedResourceGroupVisitor<R, TRoute>
  ): R {
    return visitor.flexible_crud(this);
  }

  public *lowerCacheConfig(
    addInvs: (route: TRoute, invs: string[]) => void
  ): IterableIterator<string> {
    yield `      list: QueryKey.${this.groupName}.${this.listKeyFn},`;
    yield `      detail: QueryKey.${this.groupName}.${this.detailKeyFn},`;

    if (this.create.available) {
      yield* lowerMutationSlot('create', this.create.route, [`          QueryKey.${this.groupName}.${this.listKeyFn},`], addInvs);
    }
    if (this.update.available) {
      yield* lowerMutationSlot('update', this.update.route, [
        `          QueryKey.${this.groupName}.${this.listKeyFn},`,
        `          QueryKey.${this.groupName}.${this.detailKeyFn},`,
      ], addInvs);
    }
    if (this.delete.available) {
      yield* lowerMutationSlot('remove', this.delete.route, [`          QueryKey.${this.groupName}.${this.listKeyFn},`], addInvs);
    }

    yield* lowerExtraMutations(this, addInvs);
  }
}

export class ScannedCrudResourceGroupDescriptor<TRoute = ParsedRoute>
  extends ScannedFlexibleCrudResourceGroupDescriptor<TRoute>
{
  public static fromRoutes<TRoute = ParsedRoute>(params: {
    readonly groupName: string;
    readonly keyName: string;
    readonly titleName: string;
    readonly primaryKeyType: string;
    readonly types: FlexibleCrudTypeSignature;
    readonly index: TRoute;
    readonly show: TRoute;
    readonly all: readonly TRoute[];
    readonly create: TRoute | null;
    readonly update: TRoute | null;
    readonly delete: TRoute | null;
    readonly extraMutations?: readonly TRoute[];
    readonly customQueries?: readonly TRoute[];
  }): ScannedCrudResourceGroupDescriptor<TRoute> {
    return new ScannedCrudResourceGroupDescriptor<TRoute>({
      groupName: params.groupName,
      keyName: params.keyName,
      titleName: params.titleName,
      primaryKeyType: params.primaryKeyType,
      types: params.types,
      index: params.index,
      show: params.show,
      all: params.all,
      primaryRoute: params.index,
      create: MutationCapability.fromNullable(params.create),
      update: MutationCapability.fromNullable(params.update),
      delete: MutationCapability.fromNullable(params.delete),
      extraMutations: params.extraMutations ?? [],
      customQueries: params.customQueries ?? []
    });
  }
}

export class ScannedSingletonResourceGroupDescriptor<TRoute = ParsedRoute>
  extends AbstractResourceGroupDescriptor<TRoute>
  implements SingletonResourceGroupDescriptor<TRoute>
{
  public readonly kind = ResourceGroupKind.Singleton;
  public readonly isCrud = false as const;
  public readonly types: SingletonTypeSignature;

  constructor(params: SingletonResourceGroupDescriptorParams<TRoute>) {
    super(
      params,
      {
        listKeyFn: RESOURCE_GROUP_REGISTRY[ResourceGroupKind.Singleton].listKeyFn,
        detailKeyFn: RESOURCE_GROUP_REGISTRY[ResourceGroupKind.Singleton].defaultDetailKeyFn
      },
      RESOURCE_GROUP_REGISTRY[ResourceGroupKind.Singleton].defaultPrimaryKeyType
    );
    this.types = params.types;
    Object.freeze(this);
  }

  public matchFineGrained<R>(
    visitor: ExhaustiveFineGrainedResourceGroupVisitor<R, TRoute>
  ): R {
    return visitor.singleton(this);
  }

  public matchUnified<R>(
    visitor: UnifiedCrudResourceGroupVisitor<R, TRoute>
  ): R {
    return visitor.singleton(this);
  }

  public *lowerQueryKeyBlock(): IterableIterator<string> {
    yield `  ${this.groupName}: {`;
    yield `    all: () => [Entity.${this.keyName}] as const,`;
    for (const route of this.all as any[]) {
      if (route.hasParams) {
        yield `    ${route.actionName}: (params?: string | number | Record<string, unknown>) => [Entity.${this.keyName}, "${route.actionName}", params ?? {}] as const,`;
      } else {
        yield `    ${route.actionName}: () => [Entity.${this.keyName}, "${route.actionName}"] as const,`;
      }
    }
    yield `  },`;
  }

  public *lowerCacheConfig(
    addInvs: (route: TRoute, invs: string[]) => void
  ): IterableIterator<string> {
    const indexRoute = this.all.find((r: any) => r.crudRole === 'index');
    const defaultInvs = indexRoute ? [`          QueryKey.${this.groupName}.${this.listKeyFn},`] : [];
    const createRoute = this.all.find((r: any) => r.crudRole === 'create');
    const updateRoute = this.all.find((r: any) => r.crudRole === 'update');
    const deleteRoute = this.all.find((r: any) => r.crudRole === 'delete');
    if (createRoute) {
      yield* lowerMutationSlot('create', createRoute, defaultInvs, addInvs);
    }
    if (updateRoute) {
      yield* lowerMutationSlot('update', updateRoute, defaultInvs, addInvs);
    }
    if (deleteRoute) {
      yield* lowerMutationSlot('remove', deleteRoute, defaultInvs, addInvs);
    }

    yield* lowerExtraMutations(this, addInvs);
  }
}

export class ScannedCustomResourceGroupDescriptor<TRoute = ParsedRoute>
  extends AbstractResourceGroupDescriptor<TRoute>
  implements CustomResourceGroupDescriptor<TRoute>
{
  public readonly kind = ResourceGroupKind.Custom;
  public readonly isCrud = false as const;
  public readonly types: CustomTypeSignature;

  constructor(params: CustomResourceGroupDescriptorParams<TRoute>) {
    super(
      params,
      {
        listKeyFn: RESOURCE_GROUP_REGISTRY[ResourceGroupKind.Custom].listKeyFn,
        detailKeyFn: params.detailKeyFn
      },
      RESOURCE_GROUP_REGISTRY[ResourceGroupKind.Custom].defaultPrimaryKeyType
    );
    this.types = params.types;
    Object.freeze(this);
  }

  public matchFineGrained<R>(
    visitor: ExhaustiveFineGrainedResourceGroupVisitor<R, TRoute>
  ): R {
    return visitor.custom(this);
  }

  public matchUnified<R>(
    visitor: UnifiedCrudResourceGroupVisitor<R, TRoute>
  ): R {
    return visitor.custom(this);
  }

  public *lowerQueryKeyBlock(): IterableIterator<string> {
    yield `  ${this.groupName}: {`;
    yield `    all: () => [Entity.${this.keyName}] as const,`;
    for (const route of this.all as any[]) {
      if (route.hasParams) {
        yield `    ${route.actionName}: (params?: string | number | Record<string, unknown>) => [Entity.${this.keyName}, "${route.actionName}", params ?? {}] as const,`;
      } else {
        yield `    ${route.actionName}: () => [Entity.${this.keyName}, "${route.actionName}"] as const,`;
      }
    }
    yield `  },`;
  }

  public *lowerCacheConfig(
    addInvs: (route: TRoute, invs: string[]) => void
  ): IterableIterator<string> {
    const indexRoute = this.all.find((r: any) => r.crudRole === 'index');
    const defaultInvs = indexRoute ? [`          QueryKey.${this.groupName}.${this.listKeyFn},`] : [];
    const createRoute = this.all.find((r: any) => r.crudRole === 'create');
    const updateRoute = this.all.find((r: any) => r.crudRole === 'update');
    const deleteRoute = this.all.find((r: any) => r.crudRole === 'delete');
    if (createRoute) {
      yield* lowerMutationSlot('create', createRoute, defaultInvs, addInvs);
    }
    if (updateRoute) {
      yield* lowerMutationSlot('update', updateRoute, defaultInvs, addInvs);
    }
    if (deleteRoute) {
      yield* lowerMutationSlot('remove', deleteRoute, defaultInvs, addInvs);
    }

    yield* lowerExtraMutations(this, addInvs);
  }
}

/**
 * Exhaustive Fine-Grained Resource Group Visitor (0 optional ?, 100% complete contract).
 */
export interface ExhaustiveFineGrainedResourceGroupVisitor<R, TRoute = ParsedRoute> {
  readonly full_crud: (group: FullCrudResourceGroupDescriptor<TRoute>) => R;
  readonly read_only_crud: (group: ReadOnlyCrudResourceGroupDescriptor<TRoute>) => R;
  readonly flexible_crud: (group: FlexibleCrudResourceGroupDescriptor<TRoute>) => R;
  readonly singleton: (group: SingletonResourceGroupDescriptor<TRoute>) => R;
  readonly custom: (group: CustomResourceGroupDescriptor<TRoute>) => R;
}

/**
 * Unified CRUD Resource Group Visitor (Collapses all CRUD variants into single mandatory crud handler).
 */
export interface UnifiedCrudResourceGroupVisitor<R, TRoute = ParsedRoute> {
  readonly crud: (group: CrudResourceGroupDescriptor<TRoute>) => R;
  readonly singleton: (group: SingletonResourceGroupDescriptor<TRoute>) => R;
  readonly custom: (group: CustomResourceGroupDescriptor<TRoute>) => R;
}

/**
 * Discriminated Union Visitor ADT for Resource Groups.
 *
 * Eliminates optional ? and guarantees compile-time exhaustiveness:
 * - Either you supply all 5 fine-grained handlers (full_crud, read_only_crud, flexible_crud, singleton, custom)
 * - Or you supply unified CRUD handler (crud, singleton, custom)
 */
export type ResourceGroupVisitor<R, TRoute = ParsedRoute> =
  | ExhaustiveFineGrainedResourceGroupVisitor<R, TRoute>
  | UnifiedCrudResourceGroupVisitor<R, TRoute>;

/**
 * Pure catamorphism pattern matcher for ResourceGroupDescriptor (Fine-Grained).
 * Delegates directly to the descriptor's intrinsic matchFineGrained capability with 0 if, 0 switch.
 */
export function matchFineGrainedResourceGroup<R, TRoute = ParsedRoute>(
  group: ResourceGroupDescriptor<TRoute>,
  visitor: ExhaustiveFineGrainedResourceGroupVisitor<R, TRoute>
): R {
  return group.matchFineGrained(visitor);
}

/**
 * Pure catamorphism pattern matcher for ResourceGroupDescriptor (Unified CRUD).
 * Delegates directly to the descriptor's intrinsic matchUnified capability with 0 if, 0 switch.
 */
export function matchUnifiedResourceGroup<R, TRoute = ParsedRoute>(
  group: ResourceGroupDescriptor<TRoute>,
  visitor: UnifiedCrudResourceGroupVisitor<R, TRoute>
): R {
  return group.matchUnified(visitor);
}

/**
 * Pure catamorphism pattern matcher for ResourceGroupDescriptor.
 * Backward-compatibility bridge delegating directly to descriptor's intrinsic capabilities.
 */
export function matchResourceGroup<R, TRoute = ParsedRoute>(
  group: ResourceGroupDescriptor<TRoute>,
  visitor: ExhaustiveFineGrainedResourceGroupVisitor<R, TRoute>
): R;
export function matchResourceGroup<R, TRoute = ParsedRoute>(
  group: ResourceGroupDescriptor<TRoute>,
  visitor: UnifiedCrudResourceGroupVisitor<R, TRoute>
): R;
export function matchResourceGroup<R, TRoute = ParsedRoute>(
  group: ResourceGroupDescriptor<TRoute>,
  visitor: ResourceGroupVisitor<R, TRoute>
): R {
  return 'full_crud' in visitor
    ? group.matchFineGrained(visitor)
    : group.matchUnified(visitor);
}
