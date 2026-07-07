import { SemanticResolution, SemanticType, TraceNode } from '../../types/contract';
import { ResolverPlugin, ResolutionContext, ResolverMeta, ModelNode } from '../types';

interface HasFields {
  fields: Record<string, unknown>;
}

function hasFields(obj: unknown): obj is HasFields {
  return !!(obj && typeof obj === 'object' && 'fields' in obj);
}

interface TypedFieldVal {
  type: string;
  nullable?: boolean;
}

function isTypedFieldVal(val: unknown): val is TypedFieldVal {
  return typeof val === 'object' && val !== null && 'type' in val;
}

function isModelNode(obj: unknown): obj is ModelNode {
  return typeof obj === 'object' && obj !== null && 'name' in obj;
}

export class ExpressionResolver implements ResolverPlugin {
  canResolve(meta: ResolverMeta): boolean {
    return !!(meta && (
      meta.kind === 'literal' || 
      meta.kind === 'binary_operation' || 
      meta.kind === 'binary_expression' ||
      meta.kind === 'ternary' ||
      meta.kind === 'ternary_expression' ||
      meta.kind === 'property_access' ||
      meta.kind === 'nullsafe_property_access'
    ));
  }

  resolve(meta: ResolverMeta, context: ResolutionContext): SemanticResolution {
    const currentModel = context.contextModel;

    if (meta.kind === 'literal') {
      const t: SemanticType = meta.type === 'number' ? 'number' : meta.type === 'boolean' ? 'boolean' : 'string';
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

    if (meta.kind === 'binary_operation' || meta.kind === 'binary_expression') {
      const leftRes = context.kernel.resolve(meta.left || { kind: 'unknown', code: '' }, currentModel);
      const rightRes = context.kernel.resolve(meta.right || { kind: 'unknown', code: '' }, currentModel);
      
      const trace: TraceNode[] = [
        {
          source: 'ExpressionResolver',
          rule: `Binary operation: ${meta.operator || ''}`,
          input: `${leftRes.type} ${meta.operator || ''} ${rightRes.type}`
        },
        ...(leftRes.trace || []),
        ...(rightRes.trace || [])
      ];

      if (meta.operator === '??') {
        if (leftRes.status === 'resolved' && leftRes.type !== 'unknown') {
          return leftRes;
        }
        if (rightRes.status === 'resolved' && rightRes.type !== 'unknown') {
          return rightRes;
        }
        return {
          status: 'unknown',
          type: 'unknown',
          confidence: 0,
          trace
        };
      }
      
      let resolvedType: SemanticType = 'number'; // defaults to number for math operators
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
        confidence: Math.max(leftRes.confidence || 90, rightRes.confidence || 90),
        trace
      };
    }

    if (meta.kind === 'ternary' || meta.kind === 'ternary_expression') {
      const fallbackRes: SemanticResolution = { status: 'unknown', type: 'unknown', confidence: 0, trace: [] };
      const conditionRes = meta.condition ? context.kernel.resolve(meta.condition, currentModel) : null;
      const truthyRes = meta.truthy ? context.kernel.resolve(meta.truthy, currentModel) : fallbackRes;
      const falsyRes = meta.falsy ? context.kernel.resolve(meta.falsy, currentModel) : fallbackRes;

      const trace: TraceNode[] = [
        {
          source: 'ExpressionResolver',
          rule: 'Ternary expression resolution',
          input: `condition: ${conditionRes?.type || 'unknown'}`
        },
        ...(conditionRes?.trace || []),
        ...(truthyRes.trace || []),
        ...(falsyRes.trace || [])
      ];

      if (truthyRes.status === 'resolved' && truthyRes.type !== 'unknown') {
        return {
          ...truthyRes,
          trace: [...trace, ...(truthyRes.trace || [])]
        };
      }
      if (falsyRes.status === 'resolved' && falsyRes.type !== 'unknown') {
        return {
          ...falsyRes,
          trace: [...trace, ...(falsyRes.trace || [])]
        };
      }

      return {
        status: 'unknown',
        type: 'unknown',
        confidence: 0,
        trace
      };
    }

    if (meta.kind === 'property_access' || meta.kind === 'nullsafe_property_access') {
      const prop = meta.property || '';
      let targetModel: unknown = currentModel;
      const trace: TraceNode[] = [];

      if (meta.target) {
          const targetRes = context.kernel.resolve(meta.target, currentModel);
          if (targetRes.trace) trace.push(...targetRes.trace);
          
          if (targetRes.status === 'resolved' && targetRes.type !== 'unknown') {
              // Special framework classes / Sanctum / createToken object
              if (targetRes.type === 'object' && hasFields(targetRes) && targetRes.fields[prop]) {
                const fieldVal = targetRes.fields[prop];
                let fieldType = 'unknown';
                let isNullable = false;
                if (isTypedFieldVal(fieldVal)) {
                  fieldType = fieldVal.type;
                  isNullable = !!fieldVal.nullable;
                } else if (typeof fieldVal === 'string') {
                  fieldType = fieldVal;
                }
                trace.push({
                   source: 'ExpressionResolver',
                   rule: `Field lookup from resolved object type fields.${prop}`,
                   input: prop,
                   output: fieldType
                });
                return {
                   status: 'resolved',
                   type: fieldType,
                   nullable: isNullable || undefined,
                   confidence: targetRes.confidence,
                   trace
                };
              }

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
              const tm = targetModelName && typeLower ? context.models.find(m => m.name === targetModelName || m.name.toLowerCase() === typeLower) : undefined;
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
              const targetModelName = meta.target.model || '';
              const tm = context.models.find(m => m.name === targetModelName);
              if (tm) {
                  targetModel = tm;
              }
          } else if (meta.target.kind === 'relation') {
             const relName = meta.target.name || '';
             // Check relations on current model
             if (isModelNode(currentModel)) {
                const rel = currentModel.relations?.[relName];
                if (rel && rel.model) {
                   const tm = context.models.find(m => m.name === rel.model);
                   if (tm) {
                       targetModel = tm;
                       trace.push({
                         source: 'ExpressionResolver',
                         rule: `Relation target model lookup`,
                         input: `${currentModel.name}.${relName}`,
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
                    { source: 'ExpressionResolver', rule: `Current model not resolved for relation lookup` },
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

      let targetModelName: string | undefined = undefined;
      if (isModelNode(targetModel)) {
        targetModelName = targetModel.name;
      } else if (isModelNode(currentModel)) {
        targetModelName = currentModel.name;
      }

      const innerMeta = { kind: 'model_column', model: targetModelName, column: prop };
      const innerRes = context.kernel.resolve(innerMeta, targetModel || currentModel);
      if (innerRes.trace) trace.push(...innerRes.trace);
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
