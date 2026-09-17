/** Canonical domain atoms. Raw primitives belong only at source boundaries. */
export type EndpointId = string & { readonly __endpointId: unique symbol };
export type ResourceId = string & { readonly __resourceId: unique symbol };
export type RequestId = string & { readonly __requestId: unique symbol };
export type ModelName = string & { readonly __modelName: unique symbol };
export type ResourceName = string & { readonly __resourceName: unique symbol };
export type ResponseTypeName = string & { readonly __responseTypeName: unique symbol };
export type PropertyName = string & { readonly __propertyName: unique symbol };
export type RouteName = string & { readonly __routeName: unique symbol };
export type RoutePath = string & { readonly __routePath: unique symbol };
export type ControllerName = string & { readonly __controllerName: unique symbol };
export type ActionName = string & { readonly __actionName: unique symbol };
export type SourceFilePath = string & { readonly __sourceFilePath: unique symbol };
export type SourceLineNumber = number & { readonly __sourceLineNumber: unique symbol };
export type TypeExpression = string & { readonly __typeExpression: unique symbol };
export type CodeExpression = string & { readonly __codeExpression: unique symbol };
export type DescriptionText = string & { readonly __descriptionText: unique symbol };
export type HttpHeaderName = string & { readonly __httpHeaderName: unique symbol };

export type HttpStatus =
  | 200 | 201 | 202 | 204 | 301 | 302 | 304
  | 400 | 401 | 403 | 404 | 409 | 422 | 429
  | 500 | 502 | 503;

export const createEndpointId = (value: string): EndpointId => value as EndpointId;
export const createResourceId = (value: string): ResourceId => value as ResourceId;
export const createRequestId = (value: string): RequestId => value as RequestId;
export const createModelName = (value: string): ModelName => value as ModelName;
export const createResourceName = (value: string): ResourceName => value as ResourceName;
export const createResponseTypeName = (value: string): ResponseTypeName => value as ResponseTypeName;
export const createPropertyName = (value: string): PropertyName => value as PropertyName;
export const createRouteName = (value: string): RouteName => value as RouteName;
export const createRoutePath = (value: string): RoutePath => value as RoutePath;
export const createControllerName = (value: string): ControllerName => value as ControllerName;
export const createActionName = (value: string): ActionName => value as ActionName;
export const createSourceFilePath = (value: string): SourceFilePath => value as SourceFilePath;
export const createSourceLineNumber = (value: number): SourceLineNumber => value as SourceLineNumber;
export const createTypeExpression = (value: string): TypeExpression => value as TypeExpression;
export const createCodeExpression = (value: string): CodeExpression => value as CodeExpression;
export const createDescriptionText = (value: string): DescriptionText => value as DescriptionText;
export const createHttpHeaderName = (value: string): HttpHeaderName => value as HttpHeaderName;
