import type { ExpressionAst } from './ast';
import type { QueryAst } from './query';

/** Projects parsed expression evidence into query ASTs without reclassifying source ownership. */
export interface LaravelQueryProducerInterface {
  readonly kind: 'laravel_query_producer';
  readonly closed: true;
  readonly contractVersion: 1;
  readonly produce: (input: Readonly<{ readonly expressions: readonly ExpressionAst[] }>) => readonly QueryAst[];
}
