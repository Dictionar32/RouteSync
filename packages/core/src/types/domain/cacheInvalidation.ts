export const InvalidationTargetKind = Object.freeze({
  SelfList: 'self_list',
  ParentList: 'parent_list',
  ParentDetail: 'parent_detail',
  AuthResource: 'auth_resource'
} as const);
export type InvalidationTargetKind = typeof InvalidationTargetKind[keyof typeof InvalidationTargetKind];

export interface InvalidationTarget {
  readonly groupName: string;
  readonly kind: InvalidationTargetKind;
  readonly queryKeyExpression: string;
}

export interface SelfListInvalidationTarget extends InvalidationTarget {
  readonly kind: 'self_list';
}

export interface ParentListInvalidationTarget extends InvalidationTarget {
  readonly kind: 'parent_list';
}

export interface ParentDetailInvalidationTarget extends InvalidationTarget {
  readonly kind: 'parent_detail';
}

export interface AuthResourceInvalidationTarget extends InvalidationTarget {
  readonly kind: 'auth_resource';
}

export type AnyInvalidationTarget =
  | SelfListInvalidationTarget
  | ParentListInvalidationTarget
  | ParentDetailInvalidationTarget
  | AuthResourceInvalidationTarget;

export interface InvalidationTargetSpecification<K extends InvalidationTargetKind = InvalidationTargetKind> {
  readonly kind: K;
  readonly queryKeySuffix: 'all' | 'lists' | 'detail';
  readonly computeQueryKey: (groupName: string) => string;
}

/**
 * Mapped Type Exhaustive: Wajib mendefinisikan SEMUA key InvalidationTargetKind.
 */
export type InvalidationTargetRegistry = {
  readonly [K in InvalidationTargetKind]: InvalidationTargetSpecification<K>;
};

export const INVALIDATION_TARGET_REGISTRY: InvalidationTargetRegistry = Object.freeze({
  [InvalidationTargetKind.SelfList]: {
    kind: InvalidationTargetKind.SelfList,
    queryKeySuffix: 'all',
    computeQueryKey: (groupName: string) => `QueryKey.${groupName}.all`,
  },
  [InvalidationTargetKind.ParentList]: {
    kind: InvalidationTargetKind.ParentList,
    queryKeySuffix: 'lists',
    computeQueryKey: (groupName: string) => `QueryKey.${groupName}.lists`,
  },
  [InvalidationTargetKind.ParentDetail]: {
    kind: InvalidationTargetKind.ParentDetail,
    queryKeySuffix: 'detail',
    computeQueryKey: (groupName: string) => `QueryKey.${groupName}.detail`,
  },
  [InvalidationTargetKind.AuthResource]: {
    kind: InvalidationTargetKind.AuthResource,
    queryKeySuffix: 'all',
    computeQueryKey: (groupName: string) => `QueryKey.${groupName}.all`,
  },
});

export interface InvalidationTargetVisitor<R> {
  readonly self_list: (target: SelfListInvalidationTarget) => R;
  readonly parent_list: (target: ParentListInvalidationTarget) => R;
  readonly parent_detail: (target: ParentDetailInvalidationTarget) => R;
  readonly auth_resource: (target: AuthResourceInvalidationTarget) => R;
}

/**
 * 0 `if` Catamorphism: Mengeksekusi logic spesifik varian InvalidationTarget dengan exhaustive type safety
 */
export function matchInvalidationTarget<R>(
  target: InvalidationTarget,
  visitor: InvalidationTargetVisitor<R>
): R {
  return visitor[target.kind](target as any);
}

export class ScannedInvalidationTarget implements InvalidationTarget {
  public readonly groupName: string;
  public readonly kind: InvalidationTargetKind;
  public readonly queryKeyExpression: string;

  constructor({
    groupName,
    kind
  }: {
    readonly groupName: string;
    readonly kind: InvalidationTargetKind;
  }) {
    this.groupName = groupName;
    this.kind = kind;
    this.queryKeyExpression = ScannedInvalidationTarget.computeQueryKey(groupName, kind);
    Object.freeze(this);
  }

  public static computeQueryKey(groupName: string, kind: InvalidationTargetKind): string {
    return INVALIDATION_TARGET_REGISTRY[kind].computeQueryKey(groupName);
  }

  public static selfList(groupName: string): SelfListInvalidationTarget {
    return new ScannedInvalidationTarget({
      groupName,
      kind: InvalidationTargetKind.SelfList
    }) as SelfListInvalidationTarget;
  }

  public static parentList(groupName: string): ParentListInvalidationTarget {
    return new ScannedInvalidationTarget({
      groupName,
      kind: InvalidationTargetKind.ParentList
    }) as ParentListInvalidationTarget;
  }

  public static parentDetail(groupName: string): ParentDetailInvalidationTarget {
    return new ScannedInvalidationTarget({
      groupName,
      kind: InvalidationTargetKind.ParentDetail
    }) as ParentDetailInvalidationTarget;
  }

  public static authResource(groupName: string): AuthResourceInvalidationTarget {
    return new ScannedInvalidationTarget({
      groupName,
      kind: InvalidationTargetKind.AuthResource
    }) as AuthResourceInvalidationTarget;
  }

  public static resourceList(groupName: string): ParentListInvalidationTarget {
    return ScannedInvalidationTarget.parentList(groupName);
  }

  public static resourceItem(groupName: string): ParentDetailInvalidationTarget {
    return ScannedInvalidationTarget.parentDetail(groupName);
  }
}

export interface RouteCacheInvalidationDescriptor {
  readonly targets: readonly InvalidationTarget[];
  readonly queryKeyExpressions: readonly string[];
}

const EMPTY_INVALIDATION_TARGETS: readonly InvalidationTarget[] = Object.freeze([]);

export class ScannedRouteCacheInvalidationDescriptor implements RouteCacheInvalidationDescriptor {
  public readonly targets: readonly InvalidationTarget[];
  public readonly queryKeyExpressions: readonly string[];

  constructor({
    targets
  }: {
    readonly targets: readonly InvalidationTarget[];
  }) {
    this.targets = Object.freeze(targets);
    this.queryKeyExpressions = Object.freeze(targets.map(t => t.queryKeyExpression));
    Object.freeze(this);
  }

  public static empty(): ScannedRouteCacheInvalidationDescriptor {
    return new ScannedRouteCacheInvalidationDescriptor({ targets: EMPTY_INVALIDATION_TARGETS });
  }

  public static none(): ScannedRouteCacheInvalidationDescriptor {
    return ScannedRouteCacheInvalidationDescriptor.empty();
  }

  public static fromTargets(targets: readonly InvalidationTarget[]): ScannedRouteCacheInvalidationDescriptor {
    return new ScannedRouteCacheInvalidationDescriptor({ targets });
  }
}

export const ScannedRouteInvalidationPayload = ScannedRouteCacheInvalidationDescriptor;
export type ScannedRouteInvalidationPayload = ScannedRouteCacheInvalidationDescriptor;
