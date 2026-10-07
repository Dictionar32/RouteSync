import type { RouteSyncManifest } from './manifest';
import { completeSourceProof } from './ast';
import type { SourceAst, CompleteSourceAst } from './ast';
import type { SourceSpan } from './provenance';
import type { SourceDiscovery, Sequence, CompletenessFailures } from './collections';

export type SourceCategory =
  | { readonly kind: 'model' } | { readonly kind: 'resource' } | { readonly kind: 'request' }
  | { readonly kind: 'route' } | { readonly kind: 'controller' } | { readonly kind: 'response' }
  | { readonly kind: 'service' } | { readonly kind: 'migration' } | { readonly kind: 'dto' }
  | { readonly kind: 'middleware' } | { readonly kind: 'provider' } | { readonly kind: 'attribute' } | { readonly kind: 'channel' };
export type UpstreamStage = { readonly kind: 'source_ast' } | { readonly kind: 'manifest' };
export type CompletenessFailure =
  | { readonly kind: 'source_category_not_scanned'; readonly category: SourceCategory; readonly stage: UpstreamStage; readonly source: SourceSpan }
  | { readonly kind: 'unsupported_source_construct'; readonly source: SourceSpan };
export interface CompleteManifest {
  readonly kind: 'complete_manifest';
  readonly manifest: RouteSyncManifest;
}
export type IncompleteUpstream = { readonly kind: 'incomplete_upstream'; readonly stage: UpstreamStage; readonly failures: CompletenessFailures };
type Check = { readonly kind: 'valid'; readonly failures: Sequence<CompletenessFailure> } | { readonly kind: 'failure'; readonly failures: Sequence<CompletenessFailure> };
const empty = <T>(): Sequence<T> => ({ kind: 'empty' });
const cons = <T>(head: T, tail: Sequence<T>): Sequence<T> => ({ kind: 'cons', head, tail });
const categoryFailure = (category: SourceCategory, source: SourceSpan): CompletenessFailure => ({ kind: 'source_category_not_scanned', category, stage: { kind: 'source_ast' }, source });
const check = <T>(category: SourceCategory, discovery: SourceDiscovery<T>, source: SourceSpan): Check => ({
  not_scanned: (): Check => ({ kind: 'failure', failures: cons(categoryFailure(category, source), empty()) }),
  scanned: (): Check => ({ kind: 'valid', failures: empty() })
}[discovery.kind]());
const concat = (left: Sequence<CompletenessFailure>, right: Sequence<CompletenessFailure>): Sequence<CompletenessFailure> => {
  switch (left.kind) {
    case 'empty':
      return right;
    case 'cons':
      return cons(left.head, concat(left.tail, right));
  }
};
const collect = (checks: Sequence<Check>): Sequence<CompletenessFailure> => {
  switch (checks.kind) {
    case 'empty':
      return empty();
    case 'cons':
      return concat(checks.head.failures, collect(checks.tail));
  }
};
const completeResult = (failures: Sequence<CompletenessFailure>, ast: SourceAst): CompleteSourceAst | IncompleteUpstream => ({
  empty: (): CompleteSourceAst => ({ kind: 'complete_source_ast', ast, [completeSourceProof]: 'complete' }),
  cons: (): IncompleteUpstream => ({ kind: 'incomplete_upstream', stage: { kind: 'source_ast' }, failures: { kind: 'completeness_failures', items: failures } })
}[failures.kind]());
export const validateCompleteSourceAst = (ast: SourceAst, source: SourceSpan): CompleteSourceAst | IncompleteUpstream => completeResult(collect(
  cons(check({ kind: 'model' }, ast.models.items, source), cons(check({ kind: 'resource' }, ast.resources.items, source), cons(check({ kind: 'request' }, ast.requests.items, source), cons(check({ kind: 'route' }, ast.routes.items, source), cons(check({ kind: 'controller' }, ast.controllers.items, source), cons(check({ kind: 'response' }, ast.responses.items, source), cons(check({ kind: 'service' }, ast.services.items, source), cons(check({ kind: 'migration' }, ast.migrations.items, source), cons(check({ kind: 'dto' }, ast.dtos.items, source), cons(check({ kind: 'middleware' }, ast.middlewares.items, source), cons(check({ kind: 'provider' }, ast.providers.items, source), cons(check({ kind: 'attribute' }, ast.attributes.items, source), cons(check({ kind: 'channel' }, ast.channels.items, source), empty())))))))))))))), ast);
