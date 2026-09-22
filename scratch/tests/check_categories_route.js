const fs = require('fs');
const manifest = JSON.parse(fs.readFileSync('C:/Users/User/toko-online/routesync.manifest.json', 'utf8'));
const categoriesRoute = manifest.routes.find(r => r.path === '/categories');
console.log(JSON.stringify(categoriesRoute, null, 2));
