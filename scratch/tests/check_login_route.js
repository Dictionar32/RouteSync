const fs = require('fs');
const manifest = JSON.parse(fs.readFileSync('C:/Users/User/toko-online/routesync.manifest.json', 'utf8'));
const loginRoute = manifest.routes.find(r => r.name === 'login.post');
console.log(JSON.stringify(loginRoute, null, 2));
