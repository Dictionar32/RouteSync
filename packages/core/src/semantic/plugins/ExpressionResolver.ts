import { SemanticResolution, TraceNode, JsonMemberResolution, AccessKind } from '../../types/contract';
import { SemanticType } from '../../types/semantic';
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
      meta.kind === 'binary_expression' ||
      meta.kind === 'ternary' ||
      meta.kind === 'property_access' ||
      meta.kind === 'nullsafe_property_access'
    ));
  }

  resolve(meta: ResolverMeta, context: ResolutionContext): SemanticResolution {
    const currentModel = context.contextModel;

    if (meta.kind === 'literal') {
      const v = meta.value;
      const t: SemanticType = typeof v === 'number' ? 'number' : typeof v === 'boolean' ? 'boolean' : v === null ? 'unknown' : 'string';
      return {
        status: v === null ? 'unknown' : 'resolved',
        type: t,
        nullable: v === null ? true : undefined,
        confidence: 100,
        trace: [{
          source: 'ExpressionResolver',
          rule: 'Literal type mapping',
          input: String(v),
          output: t
        }]
      };
    }

    if (meta.kind === 'binary_expression') {
      const leftRes = meta.left ? context.kernel.resolve(meta.left, currentModel) : { status: 'unknown' as const, type: 'unknown', confidence: 0, trace: [] };
      const rightRes = meta.right ? context.kernel.resolve(meta.right, currentModel) : { status: 'unknown' as const, type: 'unknown', confidence: 0, trace: [] };

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
        // `$x ?? null` (or any right-hand side that can't resolve past a null
        // literal) means the left side is reachable-but-possibly-null at
        // runtime, even if the left resolution itself never set `nullable`.
        // We wrap rather than mutate leftRes so callers still see the exact
        // node that produced the value.
        const rightIsNullish = meta.right?.kind === 'literal' && meta.right.value === null;

        if (leftRes.status === 'resolved' && leftRes.type !== 'unknown') {
          if (rightIsNullish) {
            return { ...leftRes, nullable: true, trace };
          }
          return { ...leftRes, trace };
        }
        if (rightRes.status === 'resolved' && rightRes.type !== 'unknown') {
          return { ...rightRes, trace };
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

    if (meta.kind === 'ternary') {
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

              // JSON member access: target already resolved to a json-object
              // (a cast array/json column) or to a previous json-member in the
              // same chain. Rather than trying to look up a model named
              // "json-object", keep descending the chain and let TypeEmitter
              // decide the final TS type — the kernel itself makes no
              // decision about runtime JSON shape.
              if (targetRes.type === 'json-object' || targetRes.type === 'json-member') {
                const accessKind: AccessKind = (meta.kind === 'property_access' ? meta.accessKind : undefined)
                  || (meta.kind === 'nullsafe_property_access' ? 'optional_access' : 'property_access');

                trace.push({
                  source: 'ExpressionResolver',
                  rule: `JSON member access (${accessKind})`,
                  input: `${targetRes.type}['${prop}']`,
                  output: `json-member(${prop})`
                });

                const memberRes: JsonMemberResolution = {
                  status: 'resolved',
                  type: 'json-member',
                  parent: targetRes,
                  key: prop,
                  accessKind,
                  nullable: meta.kind === 'nullsafe_property_access' ? true : targetRes.nullable,
                  confidence: targetRes.confidence,
                  trace
                };
                return memberRes;
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
              const tm = (targetModelName ? context.symbolTable.get(targetModelName) : undefined)
                || (typeLower ? context.symbolTable.getCaseInsensitive(typeLower) : undefined);
              if (tm) {
                  targetModel = tm.node;
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
              const tm = context.symbolTable.get(targetModelName);
              if (tm) {
                  targetModel = tm.node;
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

      const innerRes = context.kernel.resolve({ kind: 'model_column', model: targetModelName || '', column: prop }, targetModel || currentModel);
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
