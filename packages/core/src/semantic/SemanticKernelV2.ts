import { IRContext, ParsedASTNode, SemanticIRNode, SemanticNode, ServiceGraph } from '../types/semantic';
import { ASTNormalizer } from './ASTNormalizer';
import { camelCase } from '../utils';

export class SemanticKernelV2 {
  private graph: ServiceGraph | null = null;

  public loadGraph(graph: ServiceGraph) {
    this.graph = graph;
  }

  public resolve(node: SemanticIRNode | ParsedASTNode, context?: IRContext): SemanticNode {
    // 1. NORMALIZE AST (No Regex in Kernel)
    const normalizedAst = ASTNormalizer.normalize(node);

    // 2. ORCHESTRATE RESOLUTION PASSES (Deterministic)

    // A. Handle explicit primitive
    if (normalizedAst.kind === 'primitive') {
      return {
        status: 'resolved',
        type: normalizedAst.type as any,
        confidence: 100,
        provenance: []
      };
    }

    // B. Handle Resource::collection() or new Resource()
    if (normalizedAst.kind === 'method_call' && normalizedAst.target && normalizedAst.target.kind === 'resource') {
      return {
        status: 'resolved',
        type: 'resource' as any,
        resource: normalizedAst.target.resource,
        collection: !!normalizedAst.target.collection,
        confidence: 100,
        provenance: []
      };
    }

    if (normalizedAst.kind === 'new_instance' && normalizedAst.target && normalizedAst.target.kind === 'resource') {
      return {
        status: 'resolved',
        type: 'resource' as any,
        resource: normalizedAst.target.resource,
        collection: false,
        confidence: 100,
        provenance: []
      };
    }

    // Handle simple resources (OrderResource::collection)
    if (normalizedAst.kind === 'method_call' && normalizedAst.target && normalizedAst.target.kind === 'property_access' && normalizedAst.target.property === 'collection') {
      if (normalizedAst.resource) {
        return {
           status: 'resolved',
           type: 'resource',
           resource: normalizedAst.resource,
           collection: normalizedAst.collection || true,
           confidence: 100,
           provenance: []
        };
      }
    }
    
    // Check new_instance directly
    if (normalizedAst.kind === 'new_instance') {
      if (normalizedAst.target && normalizedAst.target.kind === 'property_access') {
         const resourceName = normalizedAst.target.property;
         if (resourceName && resourceName.endsWith('Resource')) {
            return {
               status: 'resolved',
               type: 'resource',
               resource: resourceName,
               collection: false,
               confidence: 90,
               provenance: []
            };
         }
      }
    }

    // C. GENERAL VARIABLE RESOLUTION
    if (normalizedAst.kind === 'variable') {
      return this.resolveVariable(normalizedAst.name, context);
    }

    // D. GENERAL RESOURCE AND MODEL RESOLUTION
    if (normalizedAst.kind === 'resource') {
      return {
        status: 'resolved',
        type: 'resource',
        resource: normalizedAst.resource,
        collection: !!normalizedAst.collection,
        confidence: 100,
        provenance: []
      };
    }

    if (normalizedAst.kind === 'model') {
      return {
        status: 'resolved',
        type: 'model',
        model: normalizedAst.model,
        confidence: 100,
        provenance: []
      };
    }

    if (normalizedAst.kind === 'static_method_call') {
      const target = normalizedAst.target ? this.resolve(normalizedAst.target, context) : { status: 'unknown', type: 'unknown', confidence: 0, provenance: [] } as SemanticNode;
      const methodName = normalizedAst.name;
      if (target.status === 'resolved' && target.type === 'model') {
        const isCollection = ['all', 'get', 'paginate', 'cursorPaginate'].includes(methodName);
        const isPaginated = ['paginate', 'cursorPaginate'].includes(methodName);
        return {
          status: 'resolved',
          type: 'model',
          model: target.model,
          collection: isCollection,
          paginated: isPaginated,
          confidence: 90,
          provenance: [
            ...target.provenance,
            {
              step: 'kernel_resolve',
              input: methodName,
              output: `model ${target.model}`,
              rule: `Static method call ${target.model}::${methodName}`
            }
          ]
        };
      }
    }

    // E. TYPE CASTS
    if (normalizedAst.kind === 'type_cast') {
      let castedType: any = 'unknown';
      if (normalizedAst.castType === 'int' || normalizedAst.castType === 'float') castedType = 'number';
      else if (normalizedAst.castType === 'string') castedType = 'string';
      else if (normalizedAst.castType === 'bool') castedType = 'boolean';
      
      return {
        status: 'resolved',
        type: castedType,
        confidence: 100,
        provenance: []
      };
    }

    // F. BINARY EXPRESSIONS (Arithmetic & Coalesce)
    if (normalizedAst.kind === 'binary_expression') {
      const leftNode = this.resolve(normalizedAst.left, context);
      const rightNode = this.resolve(normalizedAst.right, context);
      
      if (normalizedAst.operator === '??') {
        if (leftNode.status === 'resolved' && leftNode.type !== 'unknown') {
          return leftNode;
        }
        if (rightNode.status === 'resolved' && rightNode.type !== 'unknown') {
          return rightNode;
        }
      }
      
      if (leftNode.type === 'number' || rightNode.type === 'number') {
        return {
          status: 'resolved',
          type: 'number',
          confidence: Math.max(leftNode.confidence, rightNode.confidence),
          provenance: []
        };
      }
    }

    // G. TERNARY EXPRESSIONS
    if (normalizedAst.kind === 'ternary') {
      const truthyNode = normalizedAst.truthy ? this.resolve(normalizedAst.truthy, context) : { status: 'unknown', type: 'unknown', confidence: 0, provenance: [] } as SemanticNode;
      const falsyNode = normalizedAst.falsy ? this.resolve(normalizedAst.falsy, context) : { status: 'unknown', type: 'unknown', confidence: 0, provenance: [] } as SemanticNode;
      
      if (truthyNode.status === 'resolved' && truthyNode.type !== 'unknown') {
        return truthyNode as any;
      }
      if (falsyNode.status === 'resolved' && falsyNode.type !== 'unknown') {
        return falsyNode as any;
      }
    }

    // H. TARGETLESS METHOD CALLS (Global framework helpers)
    if (normalizedAst.kind === 'method_call' && !normalizedAst.target) {
      if (['asset', 'url', 'route', 'ltrim', 'trim', 'strval', 'strtoupper', 'strtolower'].includes(normalizedAst.name)) {
        return {
          status: 'resolved',
          type: 'string',
          confidence: 100,
          provenance: []
        };
      }
      if (['intval', 'floatval', 'doubleval', 'count'].includes(normalizedAst.name)) {
        return {
          status: 'resolved',
          type: 'number',
          confidence: 100,
          provenance: []
        };
      }
      if (['boolval'].includes(normalizedAst.name)) {
        return {
          status: 'resolved',
          type: 'boolean',
          confidence: 100,
          provenance: []
        };
      }
    }

    // H2. GENERAL METHOD CALL RESOLUTION (With targets)
    if (normalizedAst.kind === 'method_call' && normalizedAst.target) {
       // 1. Check special conditional wrappers first (whenLoaded, when, mergeWhen)
       if (['whenLoaded', 'when', 'mergeWhen'].includes(normalizedAst.name || '')) {
          const args = (normalizedAst as any).arguments || [];
          if (normalizedAst.name === 'whenLoaded') {
             if (args.length >= 2) {
                return this.resolve(args[1], context);
             } else if (args.length === 1 && args[0].kind === 'primitive' && args[0].type === 'string' && args[0].value) {
                const relationName = args[0].value;
                const resolvedThis = this.resolve({ kind: 'variable', name: 'this' }, context);
                if (resolvedThis.status === 'resolved' && resolvedThis.type === 'model' && resolvedThis.model && this.graph && this.graph.models) {
                   const modelNode = this.graph.models[resolvedThis.model];
                   if (modelNode && (modelNode as any).relations && (modelNode as any).relations[relationName]) {
                      const relation = (modelNode as any).relations[relationName];
                      return {
                         status: 'resolved',
                         type: 'model',
                         model: relation.model,
                         collection: ['hasMany', 'belongsToMany', 'morphMany', 'morphToMany', 'morphedByMany'].includes(relation.type),
                         confidence: 100,
                         provenance: []
                      };
                   }
                }
             }
          } else { // when / mergeWhen
             if (args.length >= 2) {
                return this.resolve(args[1], context);
             }
          }
       }

       // 2. Fallback to target resolution
       const resolvedTarget = this.resolve(normalizedAst.target, context);
       if (['toDateTimeString', 'toISOString', 'toIso8601String', 'format', 'diffForHumans', 'toDateString', 'toDateTime'].includes(normalizedAst.name || '')) {
          return {
             status: 'resolved',
             type: 'string',
             confidence: resolvedTarget.confidence,
             provenance: [
                ...resolvedTarget.provenance,
                {
                   step: 'kernel_resolve',
                   input: normalizedAst.name || '',
                   output: 'string',
                   rule: `Carbon date method call`
                }
             ]
          };
       }

        if (resolvedTarget.status === 'resolved' && resolvedTarget.type === 'model') {
           if (['all', 'get', 'paginate', 'cursorPaginate'].includes(normalizedAst.name || '')) {
              return {
                 ...resolvedTarget,
                 collection: true,
                 paginated: ['paginate', 'cursorPaginate'].includes(normalizedAst.name || ''),
                 provenance: [
                    ...resolvedTarget.provenance,
                    {
                       step: 'kernel_resolve',
                       input: normalizedAst.name || '',
                       output: resolvedTarget.model || 'unknown',
                       rule: `Eloquent query collection method ${normalizedAst.name}`
                    }
                 ]
              };
           }
           if (['find', 'findOrFail', 'first', 'firstOrFail', 'create'].includes(normalizedAst.name || '')) {
              return {
                 ...resolvedTarget,
                 collection: false,
                 provenance: [
                    ...resolvedTarget.provenance,
                    {
                       step: 'kernel_resolve',
                       input: normalizedAst.name || '',
                       output: resolvedTarget.model || 'unknown',
                       rule: `Eloquent query single instance method ${normalizedAst.name}`
                    }
                 ]
              };
           }
        }

       if (['createToken'].includes(normalizedAst.name || '')) {
          return {
             status: 'resolved',
             type: 'object' as any,
             fields: {
                plainTextToken: 'string'
             },
             confidence: 100,
             provenance: [
                {
                   step: 'kernel_resolve',
                   input: 'createToken',
                   output: 'object',
                   rule: `Sanctum createToken method call`
                }
             ]
          };
       }

       if (resolvedTarget.status === 'resolved') {
          return resolvedTarget;
       }
    }

    if ((normalizedAst.kind === 'property_access' || normalizedAst.kind === 'nullsafe_property_access') && normalizedAst.target) {
       const propertyName = normalizedAst.property || '';
       const resolvedTarget = this.resolve(normalizedAst.target, context);
       
       if (resolvedTarget.status === 'resolved' && resolvedTarget.type === 'object' && resolvedTarget.fields && resolvedTarget.fields[propertyName]) {
          const fieldVal = resolvedTarget.fields[propertyName];
          const fieldType = typeof fieldVal === 'object' && fieldVal ? (fieldVal as any).type : fieldVal;
          const isNullable = typeof fieldVal === 'object' && fieldVal ? !!(fieldVal as any).nullable : false;
          return {
             status: 'resolved',
             type: fieldType as any,
             nullable: isNullable,
             confidence: Math.min(resolvedTarget.confidence, 100),
             provenance: [
                {
                   step: 'kernel_resolve',
                   input: propertyName,
                   output: fieldType,
                   rule: `Field lookup from resolved object type fields.${propertyName}`
                }
             ]
          };
       }

       if (resolvedTarget.status === 'resolved' && resolvedTarget.type === 'model' && resolvedTarget.model && this.graph && this.graph.models) {
          const modelNode = this.graph.models[resolvedTarget.model];
          if (modelNode) {
             // 1. Check database fields
             if (modelNode.fields && modelNode.fields[propertyName]) {
                const fieldVal = modelNode.fields[propertyName];
                const fieldType = typeof fieldVal === 'object' && fieldVal ? (fieldVal as any).type : fieldVal;
                const isNullable = typeof fieldVal === 'object' && fieldVal ? !!(fieldVal as any).nullable : false;
                return {
                   status: 'resolved',
                   type: fieldType as any,
                   nullable: isNullable,
                   confidence: Math.min(resolvedTarget.confidence, 100),
                   provenance: [
                      {
                         step: 'kernel_resolve',
                         input: propertyName,
                         output: fieldType,
                         rule: `Field lookup from Schema Model ${resolvedTarget.model}.${propertyName}`
                      }
                   ]
                };
             }
             // 2. Check model relations
             if ((modelNode as any).relations && (modelNode as any).relations[propertyName]) {
                const relation = (modelNode as any).relations[propertyName];
                return {
                   status: 'resolved',
                   type: 'model',
                   model: relation.model,
                   collection: ['hasMany', 'belongsToMany', 'morphMany', 'morphToMany', 'morphedByMany'].includes(relation.type),
                   confidence: Math.min(resolvedTarget.confidence, 100),
                   provenance: [
                      {
                         step: 'kernel_resolve',
                         input: propertyName,
                         output: relation.model,
                         rule: `Relation lookup from Schema Model ${resolvedTarget.model}.${propertyName}`
                      }
                   ]
                };
             }
             // 3. Check model accessors
             if ((modelNode as any).accessors) {
                const exactAccessor = (modelNode as any).accessors[propertyName];
                const camelAccessor = (modelNode as any).accessors[camelCase(propertyName)];
                const accessor = exactAccessor || camelAccessor;
                if (accessor) {
                   const expr = accessor.expression || accessor;
                   if (expr && expr.status === 'resolved') {
                      return {
                         status: 'resolved',
                         type: expr.type as any,
                         model: expr.model,
                         collection: !!expr.collection,
                         confidence: Math.min(resolvedTarget.confidence, 100),
                         provenance: [
                            {
                               step: 'kernel_resolve',
                               input: propertyName,
                               output: expr.type,
                               rule: `Accessor lookup from Schema Model ${resolvedTarget.model}.${propertyName}`
                            }
                         ]
                      };
                   }
                }
             }
          }
       }
       
       return {
          status: 'unknown',
          type: 'unknown',
          confidence: 0,
          provenance: [
             {
                step: 'kernel_resolve',
                input: propertyName,
                output: 'unknown',
                rule: `Property not found in Schema Model ${resolvedTarget.model || 'Unknown'}`
             }
          ]
       };
    }

    // Default: Unresolved (STRICT)
    return {
      status: 'unknown',
      type: 'unknown',
      confidence: 0,
      provenance: [
        { step: 'fallback', input: normalizedAst.kind, output: 'unknown', rule: `Unsupported AST kind: ${normalizedAst.kind}` }
      ]
    };
  }

  private resolveVariable(name: string, context?: IRContext): SemanticNode {
    if (name === 'this') {
      let contextModelName = '';
      if (context) {
         if ((context as any).layer === 'resource') {
            contextModelName = (context as any).fileName?.replace(/Resource$/, '') || '';
         } else if ((context as any).layer === 'model') {
            contextModelName = (context as any).fileName || '';
         }
      }
      if (contextModelName) {
        return {
          status: 'resolved',
          type: 'model',
          model: contextModelName,
          confidence: 100,
          provenance: []
        };
      }
    }

    if (context && (context as any).assignments && (context as any).assignments[name]) {
      const assignedNode = (context as any).assignments[name];
      return this.resolve(assignedNode, context);
    }

    if (this.graph && this.graph.models) {
      const exactMatch = Object.keys(this.graph.models).find(m => m.toLowerCase() === name.toLowerCase());
      if (exactMatch) {
        return {
          status: 'resolved',
          type: 'model',
          model: exactMatch,
          confidence: 80,
          provenance: []
        };
      }
      const capName = name.charAt(0).toUpperCase() + name.slice(1);
      if (this.graph.models[capName]) {
        return {
          status: 'resolved',
          type: 'model',
          model: capName,
          confidence: 70,
          provenance: []
        };
      }
    }

    return {
      status: 'unknown',
      type: 'unknown',
      confidence: 0,
      provenance: []
    };
  }
}
