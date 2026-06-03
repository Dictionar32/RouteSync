import { SemanticResolution, TraceNode } from '@routesync/core';
import { ResolverPlugin, ResolutionContext } from '../types';

export class ExpressionResolver implements ResolverPlugin {
  canResolve(meta: any): boolean {
    return meta && (meta.kind === 'literal' || meta.kind === 'type_cast' || meta.kind === 'property_access' || meta.kind === 'binary_operation' || meta.kind === 'variable');
  }

  resolve(meta: any, context: ResolutionContext): SemanticResolution {
    const currentModel = context.contextModel;

    if (meta.kind === 'variable') {
      let resolvedVar: any = null;

      if (meta.name === 'this') {
        let modelName = '';
        if (currentModel) {
          if (currentModel.name) {
            modelName = currentModel.name;
          } else if (currentModel.layer === 'resource') {
            modelName = currentModel.fileName?.replace(/Resource$/, '') || '';
          } else if (currentModel.layer === 'model') {
            modelName = currentModel.fileName || '';
          }
        }
        if (modelName) {
          return {
            status: 'resolved',
            type: 'model',
            model: modelName,
            confidence: 100,
            trace: [{
              source: 'ExpressionResolver',
              rule: 'this variable contexts model mapping',
              input: 'this',
              output: `model: ${modelName}`
            }]
          };
        }
      }

      // Check resolvedAssignments
      if (currentModel && currentModel.resolvedAssignments && currentModel.resolvedAssignments[meta.name]) {
        resolvedVar = currentModel.resolvedAssignments[meta.name];
        return {
          ...resolvedVar,
          trace: [
            {
              source: 'ExpressionResolver',
              rule: `Variable lookup from resolved assignments`,
              input: meta.name,
              output: `${resolvedVar.type} (${resolvedVar.model || resolvedVar.resource || ''})`
            },
            ...resolvedVar.trace
          ]
        };
      }

      // Check raw assignments
      if (currentModel && currentModel.assignments && currentModel.assignments[meta.name]) {
        const assignedExpr = currentModel.assignments[meta.name];
        const res = context.kernel.resolve(assignedExpr, currentModel);
        return {
          ...res,
          trace: [
            {
              source: 'ExpressionResolver',
              rule: `Variable lookup from raw assignments`,
              input: meta.name,
              output: `${res.type} (${res.model || res.resource || ''})`
            },
            ...res.trace
          ]
        };
      }

      return {
        status: 'unknown',
        type: 'unknown',
        confidence: 0,
        trace: [{
          source: 'ExpressionResolver',
          rule: 'Unknown variable',
          input: meta.name
        }]
      };
    }

    if (meta.kind === 'literal') {
      const t = meta.type === 'number' ? 'number' : meta.type === 'boolean' ? 'boolean' : 'string';
      return {
        status: 'resolved',
        type: t,
        confidence: 100,
        trace: [{
          source: 'ExpressionResolver',
          rule: 'Literal type mapping',
          input: String(meta.value),
          output: t
        }]
      };
    }

    if (meta.kind === 'binary_operation') {
      const leftRes = context.kernel.resolve(meta.left, currentModel);
      const rightRes = context.kernel.resolve(meta.right, currentModel);
      
      const trace: TraceNode[] = [
        {
          source: 'ExpressionResolver',
          rule: `Binary operation: ${meta.operator}`,
          input: `${leftRes.type} ${meta.operator} ${rightRes.type}`
        },
        ...leftRes.trace,
        ...rightRes.trace
      ];
      
      let resolvedType = 'number'; // defaults to number for math operators
      if (meta.operator === '.') {
        resolvedType = 'string'; // string concatenation in PHP
      } else if (leftRes.type === 'string' || rightRes.type === 'string') {
        if (meta.operator === '+') {
            resolvedType = 'string';
        }
      }
      
      return {
        status: 'resolved',
        type: resolvedType,
        confidence: 90,
        trace
      };
    }

    if (meta.kind === 'type_cast') {
      const t = meta.type === 'number' ? 'number' : meta.type === 'boolean' ? 'boolean' : 'string';
      const trace: TraceNode[] = [{
        source: 'ExpressionResolver',
        rule: `Type cast to ${meta.type}`,
        input: meta.type,
        output: t
      }];
      if (meta.argument) {
          const argRes = context.kernel.resolve(meta.argument, currentModel);
          trace.push(...argRes.trace);
      }
      return {
        status: 'resolved',
        type: t,
        confidence: 100,
        trace
      };
    }

    if (meta.kind === 'property_access') {
      const prop = meta.property;
      let targetModel = currentModel;
      const trace: TraceNode[] = [];

      if (meta.target) {
          const targetRes = context.kernel.resolve(meta.target, currentModel);
          trace.push(...targetRes.trace);
          
          if (targetRes.status === 'resolved' && targetRes.type !== 'unknown') {
              // Special framework classes
              if (targetRes.type === 'NewAccessToken' && prop === 'plainTextToken') {
                  trace.push({
                    source: 'ExpressionResolver',
                    rule: 'Sanctum token string property access',
                    input: 'plainTextToken',
                    output: 'string'
                  });
                  return {
                    status: 'resolved',
                    type: 'string',
                    confidence: 90,
                    trace
                  };
              }
              
              const targetType = targetRes.type;
              const targetModelName = targetRes.type === 'model' && targetRes.model ? targetRes.model : targetType;
              const typeLower = targetModelName?.toLowerCase();
              const tm = targetModelName && typeLower ? context.models.find((m: any) => m.name === targetModelName || m.name.toLowerCase() === typeLower) : undefined;
              if (tm) {
                  targetModel = tm;
              } else {
                  return {
                    status: 'unknown',
                    type: 'unknown',
                    confidence: 0,
                    trace: [
                      {
                        source: 'ExpressionResolver',
                        rule: `Property access target model not found`,
                        input: targetModelName,
                        output: 'unknown'
                      },
                      ...trace
                    ]
                  };
              }
          } else if (meta.target.kind === 'model') {
              const tm = context.models.find((m: any) => m.name === meta.target.model);
              if (tm) {
                  targetModel = tm;
              }
          } else if (meta.target.kind === 'relation') {
             const relName = meta.target.name;
             const rel = currentModel.relations?.[relName];
             if (rel && rel.model) {
                const tm = context.models.find((m: any) => m.name === rel.model);
                if (tm) {
                    targetModel = tm;
                    trace.push({
                      source: 'ExpressionResolver',
                      rule: `Relation target model lookup`,
                      input: `${currentModel.name || ''}.${relName}`,
                      output: tm.name
                    });
                } else {
                    return {
                      status: 'unknown',
                      type: 'unknown',
                      confidence: 0,
                      trace: [
                        { source: 'ExpressionResolver', rule: `Target model ${rel.model} not found for relation ${relName}` },
                        ...trace
                      ]
                    };
                }
             } else {
                return {
                  status: 'unknown',
                  type: 'unknown',
                  confidence: 0,
                  trace: [
                    { source: 'ExpressionResolver', rule: `Relation ${relName} not found on current model` },
                    ...trace
                  ]
                };
             }
          } else {
              return {
                status: 'unknown',
                type: 'unknown',
                confidence: 0,
                trace: [
                  { source: 'ExpressionResolver', rule: `Cannot resolve target of property access: ${meta.target.kind}` },
                  ...trace
                ]
              };
          }
      }

      const innerMeta = { kind: 'model_column', model: targetModel?.name || currentModel?.name, column: prop };
      const innerRes = context.kernel.resolve(innerMeta, targetModel || currentModel);
      trace.push(...innerRes.trace);
      return {
          status: innerRes.status,
          type: innerRes.type,
          model: innerRes.model,
          resource: innerRes.resource,
          collection: innerRes.collection,
          paginated: innerRes.paginated,
          nullable: innerRes.nullable,
          confidence: innerRes.confidence,
          trace
      };
    }

    return {
      status: 'unknown',
      type: 'unknown',
      confidence: 0,
      trace: [{
        source: 'ExpressionResolver',
        rule: 'Unsupported expression kind',
        input: meta.kind
      }]
    };
  }
}
