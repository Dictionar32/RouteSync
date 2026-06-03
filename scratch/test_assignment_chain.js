const { SemanticKernelV2Impl } = require('../dist/core');

const kernel = new SemanticKernelV2Impl();
const graph = {
  models: {
    Order: {
      name: 'Order',
      fields: {},
      relations: {
        shipping: {
          type: 'belongsTo',
          model: 'OrderShipping'
        }
      }
    },
    OrderShipping: {
      name: 'OrderShipping',
      fields: {
        nama: {
          type: 'string',
          nullable: true
        }
      },
      relations: {}
    }
  }
};
kernel.loadGraph(graph);

// Replicates assignment: $shipping = $this->shipping;
const parsedAssignments = {
  shipping: {
    kind: 'property_access',
    target: { kind: 'variable', name: 'this' },
    property: 'shipping'
  }
};

// Replicates resolving assignments like scan.ts:
const resolvedAssignments = {};
const contextForAssignments = {
  modelMap: {},
  relationMap: {},
  layer: 'resource',
  fileName: 'OrderResource',
  assignments: parsedAssignments,
  resolvedAssignments: resolvedAssignments
};

for (const varName in parsedAssignments) {
  const ast = parsedAssignments[varName];
  const resolved = kernel.resolve(ast, contextForAssignments);
  if (resolved && resolved.status !== 'unknown') {
    resolvedAssignments[varName] = resolved;
  }
}

console.log("Resolved assignments for shipping variable:\n", JSON.stringify(resolvedAssignments.shipping, null, 2));

// Replicates field: 'nama' => $shipping?->nama
const fieldAst = {
  kind: 'nullsafe_property_access',
  target: {
    kind: 'variable',
    name: 'shipping'
  },
  property: 'nama'
};

const contextForFields = {
  modelMap: {},
  relationMap: {},
  layer: 'resource',
  fileName: 'OrderResource',
  assignments: parsedAssignments,
  resolvedAssignments: resolvedAssignments
};

const resolvedField = kernel.resolve(fieldAst, contextForFields);
console.log("Resolved field shipping.nama:\n", JSON.stringify(resolvedField, null, 2));

// Assertions to verify correctness
if (resolvedField.status === 'resolved' && resolvedField.type === 'string' && resolvedField.nullable === true) {
  console.log("\nSUCCESS: Assignment-chain resolved correctly to nullable string!");
} else {
  console.error("\nFAILURE: Assignment-chain did not resolve correctly!");
  process.exit(1);
}
