/**
 * Canonical semantic response-body vocabulary.
 * No compiler/IR dependency: target-specific response artifacts are downstream.
 */

export interface ResponseSchemaProperty {
  readonly name: string;
  readonly type: ResponsePropertyType;
  readonly required: boolean;
}

export interface ResponseSchema {
  readonly name: string;
  readonly properties: readonly ResponseSchemaProperty[];
  readonly additionalProperties: boolean;
}

export interface ResponseScalarPropertyType {
  readonly kind: 'scalar';
  readonly typeName: string;
  readonly nullable: boolean;
}

export interface ResponseArrayPropertyType {
  readonly kind: 'array';
  readonly item: ResponsePropertyType;
}

export interface ResponseObjectPropertyType {
  readonly kind: 'object';
  readonly schema: ResponseSchema;
}

export interface ResponseReferencePropertyType {
  readonly kind: 'reference';
  readonly refKind: 'model' | 'resource';
  readonly name: string;
}

export type ResponsePropertyType =
  | ResponseScalarPropertyType
  | ResponseArrayPropertyType
  | ResponseObjectPropertyType
  | ResponseReferencePropertyType;

export type ResponseBody =
  | ResourceBody
  | ModelBody
  | ObjectBody
  | PrimitiveBody;

export interface ResourceBody {
  readonly type: 'resource';
  readonly resource: string;
  readonly shape: 'single' | 'collection' | 'paginated';
}

export interface ModelBody {
  readonly type: 'model';
  readonly model: string;
  readonly shape: 'single' | 'collection' | 'paginated';
}

export interface ObjectBody {
  readonly type: 'object';
  readonly schemaName?: string;
  readonly schema: ResponseSchema;
  readonly shape: 'single' | 'collection' | 'paginated';
}

export interface PrimitiveBody {
  readonly type: 'primitive';
  readonly primitiveType: 'string' | 'number' | 'boolean' | 'null' | 'void';
  readonly shape: 'single';
}

export const isResourceBody = (body: ResponseBody): body is ResourceBody => body.type === 'resource';
export const isModelBody = (body: ResponseBody): body is ModelBody => body.type === 'model';
export const isObjectBody = (body: ResponseBody): body is ObjectBody => body.type === 'object';
export const isPrimitiveBody = (body: ResponseBody): body is PrimitiveBody => body.type === 'primitive';
export const isCollectionResponse = (body: ResponseBody): boolean => body.shape === 'collection' || body.shape === 'paginated';
