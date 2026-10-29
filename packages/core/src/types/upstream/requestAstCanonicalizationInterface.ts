import type { FormRequestSource, RequestField as DomainRequestField } from '../domain/request';
import type { RequestAst } from './ast';
import type { RequestField as UpstreamRequestField } from './request';

/** Existing source-domain evidence to canonical upstream Request AST projection contract. */
export interface RequestAstCanonicalizationInterface {
  readonly fieldFromSource: (field: DomainRequestField) => UpstreamRequestField;
  readonly astFromSource: (request: FormRequestSource) => RequestAst;
}
