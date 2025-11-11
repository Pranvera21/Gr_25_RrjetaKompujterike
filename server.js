const net = require('net');
const HOST = '127.0.0.1';   
const PORT = 8080;         
const server = net.createServer();
server.listen(PORT, HOST, () => {
  console.log(`✅ Serveri po dëgjon në ${HOST}:${PORT}`);
});
