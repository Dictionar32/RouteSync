import type { ParsedRoute } from './routes';
import { CrudRole, CRUD_ROLE_REGISTRY } from './crudRoles';
import type { ResourceName, RouteName } from './semanticValues';

export interface ListOperationIntent { readonly kind: 'list'; readonly role: typeof CrudRole.Index; }
export interface ReadOperationIntent { readonly kind: 'read'; readonly role: typeof CrudRole.Show; }
export interface CreateOperationIntent { readonly kind: 'create'; readonly role: typeof CrudRole.Create; }
export interface UpdateOperationIntent { readonly kind: 'update'; readonly role: typeof CrudRole.Update; }
export interface DeleteOperationIntent { readonly kind: 'delete'; readonly role: typeof CrudRole.Delete; }
export interface CustomOperationIntent { readonly kind: 'custom'; readonly role: typeof CrudRole.Custom; }

export type DomainOperationKind = DomainOperationIntent['kind'];

export type DomainOperationIntent =
  | ListOperationIntent
  | ReadOperationIntent
  | CreateOperationIntent
  | UpdateOperationIntent
  | DeleteOperationIntent
  | CustomOperationIntent;

export interface DomainOperationContract {
  readonly route: RouteName;
  readonly resource: ResourceName;
  readonly intent: DomainOperationIntent;
  readonly provenance: ParsedRoute['provenance'];
}
export interface DomainOperationGraph { readonly operations: readonly DomainOperationContract[]; }

type IntentFactory = (role: CrudRole) => DomainOperationIntent;
type IntentFactoryRegistry = { readonly [K in CrudRole]: IntentFactory };

const createIntent = (kind: DomainOperationIntent['kind'], role: CrudRole): DomainOperationIntent =>
  Object.freeze({ kind, role }) as DomainOperationIntent;

const INTENT_FACTORY: IntentFactoryRegistry = Object.freeze({
  [CrudRole.Index]: role => createIntent('list', role),
  [CrudRole.Show]: role => createIntent('read', role),
  [CrudRole.Create]: role => createIntent('create', role),
  [CrudRole.Update]: role => createIntent('update', role),
  [CrudRole.Delete]: role => createIntent('delete', role),
  [CrudRole.Custom]: role => createIntent('custom', role)
});

export function createDomainOperation(route: ParsedRoute): DomainOperationContract {
  const role = route.capability.crudRole;
  return {
    route: route.identity.coordinates.name,
    resource: route.identity.domain.resource,
    intent: INTENT_FACTORY[role](role),
    provenance: route.provenance
  };
}

export function createDomainOperationGraph(routes: readonly ParsedRoute[]): DomainOperationGraph {
  return Object.freeze({ operations: Object.freeze(routes.map(createDomainOperation)) });
}
