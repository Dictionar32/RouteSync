const fs = require('fs');
let content = fs.readFileSync('packages/cli/src/resolvers/plugins/MethodReturnResolver.ts', 'utf8');

const oldBlock = `    if (meta.kind === 'method_call') {
      const v = meta.variable;
      const m = meta.method;
      
      // Framework services
      if (v === 'request' && m === 'user') {
        return {
          status: 'resolved',
          type: 'User',
          confidence: 90,
          evidence: [{ kind: 'method_call', name: 'request->user()', detail: 'Resolves to User model' }]
        };
      }
      if (v === 'pdf' && m === 'download') {
        return {
          status: 'resolved',
          type: 'BinaryFile',
          confidence: 80,
          evidence: [{ kind: 'method_call', name: 'pdf->download()', detail: 'Resolves to BinaryFile' }]
        };
      }

      // Check if variable is a known model or 'this' (handled as contextModel)
      let targetModelName: string | undefined = undefined;
      
      if (v === 'this' && context.contextModel) {
        targetModelName = context.contextModel.name;
      } else {
        const found = context.models.find((model: any) => model.name.toLowerCase() === v.toLowerCase());
        if (found) {
            targetModelName = found.name;
        }
      }
      
      if (targetModelName) {
        const modelReturnMethods = ['first', 'find', 'findOrFail', 'create', 'update', 'firstOrCreate'];
        const collectionReturnMethods = ['get', 'all'];

        if (modelReturnMethods.includes(m)) {
          return {
            status: 'resolved',
            type: targetModelName,
            confidence: 90,
            evidence: [{ kind: 'method_call', name: \`\${v}->\${m}()\`, detail: \`Returns Model \${targetModelName}\` }]
          };
        }
        
        if (collectionReturnMethods.includes(m)) {
          return {
            status: 'resolved',
            type: targetModelName,
            confidence: 90,
            evidence: [{ kind: 'method_call', name: \`\${v}->\${m}()\`, detail: \`Returns Collection of \${targetModelName}\` }]
          };
        }
      }

      // Framework / library objects
      if (m === 'createToken') {
        return {
            status: 'resolved',
            type: 'NewAccessToken',
            confidence: 80,
            evidence: [{ kind: 'method_call', name: \`\${v}->createToken()\`, detail: 'Returns NewAccessToken' }]
        };
      }`;

const newBlock = `    if (meta.kind === 'method_call') {
      const v = meta.variable;
      const m = meta.method;
      
      let targetModelName: string | undefined = undefined;
      let varStr = typeof v === 'string' ? v : JSON.stringify(v);

      if (typeof v === 'string') {
          if (v === 'request' && m === 'user') {
            return { status: 'resolved', type: 'User', confidence: 90, evidence: [{ kind: 'method_call', name: 'request->user()', detail: 'Resolves to User model' }] };
          }
          if (v === 'pdf' && m === 'download') {
            return { status: 'resolved', type: 'BinaryFile', confidence: 80, evidence: [{ kind: 'method_call', name: 'pdf->download()', detail: 'Resolves to BinaryFile' }] };
          }
          if (v === 'this' && context.contextModel) {
            targetModelName = context.contextModel.name;
          } else {
            const found = context.models.find((model: any) => model.name.toLowerCase() === v.toLowerCase());
            if (found) {
                targetModelName = found.name;
            }
          }
      } else if (typeof v === 'object' && v !== null) {
          const varRes = context.kernel.resolve(v, context.contextModel);
          if (varRes.status === 'resolved' && varRes.type && varRes.type !== 'unknown') {
              // The property access resolves to a type (like a relation to 'Order')
              targetModelName = varRes.type;
              if (v.kind === 'property_access') {
                  varStr = \`$this->\${v.property}\`;
              }
          }
      }

      if (targetModelName) {
        const modelReturnMethods = ['first', 'find', 'findOrFail', 'create', 'update', 'firstOrCreate'];
        const collectionReturnMethods = ['get', 'all'];

        if (modelReturnMethods.includes(m)) {
          return {
            status: 'resolved',
            type: targetModelName,
            collection: false,
            confidence: 90,
            evidence: [{ kind: 'method_call', name: \`\${varStr}->\${m}()\`, detail: \`Returns Model \${targetModelName}\` }]
          };
        }
        
        if (collectionReturnMethods.includes(m)) {
          return {
            status: 'resolved',
            type: targetModelName,
            collection: true,
            confidence: 90,
            evidence: [{ kind: 'method_call', name: \`\${varStr}->\${m}()\`, detail: \`Returns Collection of \${targetModelName}\` }]
          };
        }
      }

      if (m === 'createToken') {
        return { status: 'resolved', type: 'NewAccessToken', confidence: 80, evidence: [{ kind: 'method_call', name: \`\${varStr}->createToken()\`, detail: 'Returns NewAccessToken' }] };
      }`;

if (content.includes(oldBlock)) {
    content = content.replace(oldBlock, newBlock);
    fs.writeFileSync('packages/cli/src/resolvers/plugins/MethodReturnResolver.ts', content);
    console.log("Patched MethodReturnResolver.ts");
} else {
    console.log("Could not find block in MethodReturnResolver.ts");
}
