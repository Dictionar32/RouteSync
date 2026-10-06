import type { InterfaceDependencyBoundary } from '../interfaces/interfaceDependencyBoundary';
import type { DataFlowInterface } from './dataFlowInterface';

/**
 * Downstream materialization capability for a canonical data-flow result.
 *
 * The four data-flow parameters stay explicit so this specialization never
 * widens or erases its upstream contract. A projection is valid only when
 * its upstream satisfies the canonical DataFlowInterface<Input, State, Node> contract.
 */
export interface DataFlowProjectionInterface<
  Input,
  State,
  Node,
  Output,
> extends InterfaceDependencyBoundary<
  DataFlowInterface<Input, State, Node>,
  Output
> {}
