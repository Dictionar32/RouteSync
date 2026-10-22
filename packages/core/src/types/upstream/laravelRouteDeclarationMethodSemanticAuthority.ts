import type {
  LaravelResourceRouteMethod,
  LaravelRouteDeclarationMethodJudgment,
  LaravelRouteDeclarationMethodJudgmentAuthority,
  LaravelRouteTargetMethod,
  LaravelRouteDeclarationMethodJudgmentInput,
  LaravelStandardRouteMethod,
} from './laravelRouteDeclarationMethodJudgment';
import { HttpMethod, type HttpMethod as HttpMethodValue } from './routeExecutionVocabulary';

const resourceMethod = (method: LaravelResourceRouteMethod): LaravelRouteDeclarationMethodJudgment =>
  Object.freeze({ kind: 'laravel_route_declaration_method_resource', method });

const targetMethodHttpVocabulary: Readonly<Record<LaravelRouteTargetMethod, HttpMethodValue>> = Object.freeze({
  get: HttpMethod.GET,
  post: HttpMethod.POST,
  put: HttpMethod.PUT,
  patch: HttpMethod.PATCH,
  delete: HttpMethod.DELETE,
  options: HttpMethod.OPTIONS,
  head: HttpMethod.HEAD,
  query: HttpMethod.QUERY,
});

const allHttpMethods: readonly HttpMethodValue[] = Object.freeze([HttpMethod.GET, HttpMethod.POST, HttpMethod.PUT, HttpMethod.PATCH, HttpMethod.DELETE, HttpMethod.OPTIONS, HttpMethod.HEAD, HttpMethod.QUERY]);

const standardMethod = (method: LaravelStandardRouteMethod): LaravelRouteDeclarationMethodJudgment =>
  Object.freeze({ kind: 'laravel_route_declaration_method_standard', method, httpMethods: Object.freeze([targetMethodHttpVocabulary[method]]) });

const allMethods = (): LaravelRouteDeclarationMethodJudgment =>
  Object.freeze({ kind: 'laravel_route_declaration_method_all_methods', method: 'any', httpMethods: allHttpMethods });

const queryMethod = (): LaravelRouteDeclarationMethodJudgment =>
  Object.freeze({ kind: 'laravel_route_declaration_method_query', method: 'query', httpMethods: Object.freeze([HttpMethod.QUERY]) });

const matchMethods = (targetMethods: readonly LaravelRouteTargetMethod[]): LaravelRouteDeclarationMethodJudgment =>
  Object.freeze({ kind: 'laravel_route_declaration_method_match', method: 'match', targetMethods, httpMethods: Object.freeze(targetMethods.map(targetMethod => targetMethodHttpVocabulary[targetMethod])) });

/**
 * Upstream authority for the closed route-method-family judgment.
 * Scanner wiring consumes the judgment; it does not reinterpret method names.
 */
export const laravelRouteDeclarationMethodSemanticAuthority: LaravelRouteDeclarationMethodJudgmentAuthority = Object.freeze({
  kind: 'laravel_route_declaration_method_judgment_authority',
  contractVersion: 8,
  closed: true,
  judge: (input: LaravelRouteDeclarationMethodJudgmentInput): LaravelRouteDeclarationMethodJudgment => {
    const { method, targetMethods } = input;
    switch (method) {
      case 'resource':
      case 'apiResource':
      case 'singleton':
      case 'apiSingleton':
        return resourceMethod(method);
      case 'any':
        return allMethods();
      case 'match':
        return matchMethods(targetMethods);
      case 'query':
        return queryMethod();
      case 'get':
      case 'post':
      case 'put':
      case 'patch':
      case 'delete':
      case 'options':
      case 'head':
        return standardMethod(method);
    }
  },
});
