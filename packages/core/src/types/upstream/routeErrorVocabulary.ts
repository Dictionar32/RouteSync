import type { PropertyName, ResponseTypeName } from './names';
import type { Nullability } from './primitiveVocabulary';
import type { HttpStatusCode } from './valueObjects';
export interface HttpErrorKindInterface {
  readonly Validation: 'validation';
  readonly Unauthorized: 'unauthorized';
  readonly Forbidden: 'forbidden';
  readonly NotFound: 'notFound';
  readonly ServerError: 'serverError';
  readonly Custom: 'custom';
}

export const HttpErrorKind: HttpErrorKindInterface = Object.freeze({ Validation:'validation', Unauthorized:'unauthorized', Forbidden:'forbidden', NotFound:'notFound', ServerError:'serverError', Custom:'custom' });
export type HttpErrorKind = typeof HttpErrorKind[keyof typeof HttpErrorKind];
export interface HttpErrorSchemaField { readonly typeName: ResponseTypeName; readonly nullable: Nullability; }
export interface HttpErrorSchema { readonly kind:'object'; readonly fields: readonly (readonly [PropertyName, HttpErrorSchemaField])[]; }
export interface HttpErrorResponse { readonly kind: HttpErrorKind; readonly statusCode: HttpStatusCode; readonly name: import('./names').HttpErrorName; readonly typeName: ResponseTypeName; readonly schema: HttpErrorSchema; }
