const { SemanticKernelV2 } = require('./dist/core.js'); 
const kernel = new SemanticKernelV2(); 
kernel.setGraph({ models: { User: { fields: { id: 'number', name: 'string', email: 'string' } } } }); 
console.log(kernel.resolve({ kind: 'raw_code', code: '$user->id' }));
console.log(kernel.resolve({ kind: 'raw_code', code: '$user->created_at?->toISOString()' }));
