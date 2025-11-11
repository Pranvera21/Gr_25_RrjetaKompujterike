const net = require('net');
const HOST = '127.0.0.1';   
const PORT = 8080;   
const MAX_CLIENTS = 3;         // Maksimumi i klientëve aktivë
const activeClients = new Set(); // Set për klientët aktivë
const server = net.createServer((socket) => {
    const clientAddress = socket.remoteAddress + ":" + socket.remotePort;

    if (activeClients.size >= MAX_CLIENTS) {
        socket.write("Serveri ka arritur numrin maksimal të klientëve. Provo më vonë.\n");
        socket.end();
        console.log(`Lidhja e re u refuzua: ${clientAddress}`);
        return;
    }

    activeClients.add(socket);
    console.log(`Klienti i ri u lidh: ${clientAddress}`);
    socket.write("Je lidhur me serverin!\n");

    socket.on("data", (data) => {
        const message = data.toString().trim();
        console.log(`Mesazh nga ${clientAddress}: ${message}`);
        socket.write(`Serveri mori mesazhin: ${message}\n`);
    });

    socket.on("end", () => {
        activeClients.delete(socket);
        console.log(`Klienti u shkëput: ${clientAddress}`);
    });

    socket.on("error", (err) => {
        activeClients.delete(socket);
        console.log(`Gabim me klientin ${clientAddress}: ${err.message}`);
    });
});
server.listen ( PORT, HOST, () => {
  console.log(`✅ Serveri po dëgjon në ${HOST}:${PORT}`);
});
