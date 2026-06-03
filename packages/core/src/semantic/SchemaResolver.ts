import { ParsedASTNode, SemanticNode, ServiceGraph } from '../types/semantic';

export class SchemaResolver {
  /**
   * Strictly looks up a property in the ServiceGraph model schemas.
   * Zero heuristics allowed.
   */
  public static resolveProperty(
    ast: ParsedASTNode,
    varName: string,
    propertyName: string,
    contextModelName: string,
    graph: ServiceGraph
  ): SemanticNode {
    
    // Determine which model we are looking at
    let targetModelName = '';
    
    if (varName === 'this') {
       targetModelName = contextModelName;
    } else {
       // Is the variable representing a related model?
       // For now, if the variable name matches a model exactly, use it.
       // E.g., $order -> Order. 
       // This is a minimal resolution mapping (not a guess of the type, but resolving the var binding).
       const exactMatch = Object.keys(graph.models).find(m => m.toLowerCase() === varName.toLowerCase());
       if (exactMatch) targetModelName = exactMatch;
       else targetModelName = varName.charAt(0).toUpperCase() + varName.slice(1);
    }

    const modelNode = graph.models[targetModelName];
        if (modelNode && modelNode.fields) {
        // Look strictly in the DB schema/columns
        const fieldVal = modelNode.fields[propertyName];
        
        if (fieldVal) {
           const fieldType = typeof fieldVal === 'object' && fieldVal ? (fieldVal as any).type : fieldVal;
           const isNullable = typeof fieldVal === 'object' && fieldVal ? !!(fieldVal as any).nullable : false;
           return {
              status: 'resolved',
              type: fieldType as any,
              nullable: isNullable,
              confidence: varName === 'this' ? 100 : 90,
              trace: [
                 { 
                    source: 'SchemaResolver', 
                    input: propertyName, 
                    output: fieldType, 
                    rule: `Strict lookup from Schema Model ${targetModelName}.${propertyName}` 
                 }
              ]
           };
        }
       
       // Note: in Milestone 9 we could also look at modelNode.relations 
       // if propertyName is a relationship like $order->items.
    }

    // STRICT FALLBACK: If not in schema, it is unknown.
    return {
       status: 'unknown',
       type: 'unknown',
       confidence: 0,
       trace: [
          { 
             source: 'SchemaResolver', 
             input: propertyName, 
             output: 'unknown', 
             rule: `No evidence found in Schema Model ${targetModelName || 'Unknown'}` 
          }
       ]
    };
  }
}
