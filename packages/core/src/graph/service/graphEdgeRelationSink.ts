import type { ServiceDependency } from '../../types/semantic/modelGraphTypes';
import type { GraphEdgeRelation } from './graphEdgeRelation';

const referenceKey = (reference: GraphEdgeRelation['from']): string =>
  `${reference.kind}:${reference.name.value.value}`;

const relationKey = (relation: GraphEdgeRelation): string =>
  `${referenceKey(relation.from)}|${referenceKey(relation.to)}|${relation.type}|${relation.weight}`;

/** The sole graph-edge materialization authority. */
export class GraphEdgeRelationSink {
  private readonly relations = new Map<string, GraphEdgeRelation>();

  public accept(relation: GraphEdgeRelation): void {
    const key = relationKey(relation);
    if (!this.relations.has(key)) this.relations.set(key, relation);
  }

  public acceptAll(relations: readonly GraphEdgeRelation[]): void {
    for (const relation of relations) this.accept(relation);
  }

  public getRelations(): readonly GraphEdgeRelation[] {
    return Object.freeze([...this.relations.values()]);
  }

  public materialize(): readonly ServiceDependency[] {
    return Object.freeze(this.getRelations().map(relation => Object.freeze({
      from: relation.from,
      to: relation.to,
      type: relation.type,
      weight: relation.weight,
    })));
  }
}
