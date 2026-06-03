import { ParsedASTNode, SemanticIRNode } from '../types/semantic';

export class ASTNormalizer {
  /**
   * Normalizes an AST node by extracting structure from raw_code
   * and converting it into a proper AST representation without mutating the original.
   */
  public static normalize(node: SemanticIRNode | ParsedASTNode): ParsedASTNode {
    if (node && 'node' in node) {
      if (node.node.parsed_ast) {
        return node.node.parsed_ast;
      }
      if (node.node.code) {
        return this.normalizeCode(node.node.code);
      }
      return { kind: 'unknown', code: '' };
    }

    return node as ParsedASTNode;
  }

  private static normalizeCode(code: string): ParsedASTNode {
    // Check for variable ($user)
    const varMatch = code.match(/^\$([a-zA-Z_\x7f-\xff][a-zA-Z0-9_\x7f-\xff]*)$/);
    if (varMatch) {
       return {
          kind: 'variable',
          name: varMatch[1]
       };
    }

    // Check for property access ($user->name or $user?->name)
    const propMatch = code.match(/^\$([a-zA-Z_\x7f-\xff][a-zA-Z0-9_\x7f-\xff]*)(->|\?->)([a-zA-Z_\x7f-\xff][a-zA-Z0-9_\x7f-\xff]*)$/);
    if (propMatch) {
       return {
          kind: propMatch[2] === '?->' ? 'nullsafe_property_access' : 'property_access',
          target: { kind: 'variable', name: propMatch[1] },
          property: propMatch[3]
       };
    }

    // Check for method call ($user->created_at?->toISOString() or $user->format('Y-m-d H:i:s'))
    const methodPropMatch = code.match(/^\$([a-zA-Z_\x7f-\xff][a-zA-Z0-9_\x7f-\xff]*)(?:\?|)->([a-zA-Z_\x7f-\xff][a-zA-Z0-9_\x7f-\xff]*)(?:\?|)->([a-zA-Z_\x7f-\xff][a-zA-Z0-9_\x7f-\xff]*)\(.*\)$/);
    if (methodPropMatch) {
       return {
          kind: 'method_call',
          target: {
             kind: 'property_access',
             target: { kind: 'variable', name: methodPropMatch[1] },
             property: methodPropMatch[2]
          },
          name: methodPropMatch[3],
          args: []
       };
    }

    // Single method call ($user->format(...))
    const singleMethodMatch = code.match(/^\$([a-zA-Z_\x7f-\xff][a-zA-Z0-9_\x7f-\xff]*)(?:\?|)->([a-zA-Z_\x7f-\xff][a-zA-Z0-9_\x7f-\xff]*)\(.*\)$/);
    if (singleMethodMatch) {
       return {
          kind: 'method_call',
          target: { kind: 'variable', name: singleMethodMatch[1] },
          name: singleMethodMatch[2],
          args: []
       };
    }

    return {
       kind: 'unknown',
       code: code
    };
  }
}
