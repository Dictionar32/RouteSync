/**
 * Downstream response-body facade.
 * Semantic response-body vocabulary is owned by types/domain.
 */
import type {
  ResponseBody as DomainResponseBody,
  ResourceBody as DomainResourceBody,
  ModelBody as DomainModelBody,
  ObjectBody as DomainObjectBody,
  PrimitiveBody as DomainPrimitiveBody,
} from '../../../types/domain/responseBody';
import type { PropertyDescriptor, ModelAttribute, ObjectSchema } from './objectSchemas';

export interface ResourceBody extends DomainResourceBody {
  readonly model?: string;
  readonly properties?: readonly PropertyDescriptor[];
}
export interface ModelBody extends DomainModelBody {
  readonly attributes?: readonly ModelAttribute[];
}
export interface ObjectBody extends Omit<DomainObjectBody, 'schema'> {
  readonly schema: ObjectSchema;
}
export type PrimitiveBody = DomainPrimitiveBody;
export type ResponseBody = ResourceBody | ModelBody | ObjectBody | PrimitiveBody;

export function isResourceBody(body: ResponseBody): body is ResourceBody { return body.type === 'resource'; }
export function isModelBody(body: ResponseBody): body is ModelBody { return body.type === 'model'; }
export function isObjectBody(body: ResponseBody): body is ObjectBody { return body.type === 'object'; }
export function isPrimitiveBody(body: ResponseBody): body is PrimitiveBody { return body.type === 'primitive'; }
export function isCollectionResponse(body: ResponseBody): boolean { return body.shape === 'collection' || body.shape === 'paginated'; }
