const net = require('net');
const fs = require('fs');
const HOST = '127.0.0.1';   
const PORT = 8084;   
const MAX_CLIENTS = 3;         
const activeClients = new Set(); 
const clientsWithRequests = new Set();  

const messages = [];


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

    socket.role = "super";
    socket.write("Roli yt aktual: " + socket.role + "\n");

    socket.role = "admin";
    socket.write("Roli yt aktual: " + socket.role + "\n");

    socket.on("data", (data) => {
        const message = data.toString().trim();
        console.log(`Mesazh nga ${clientAddress}: ${message}`);

        if (message.startsWith("/role")) {
            const parts = message.split(" ");
            const newRole = parts[1];

            if (!newRole) {
                socket.write("Përdorimi: /role admin ose /role super\n");
                return;
            }

            if (!["admin", "super"].includes(newRole)) {
                socket.write("Rol i pavlefshëm! Lejohen vetëm: admin, super\n");
                return;
            }
            socket.role = newRole;
            socket.write("Roli u ndryshua në: " + socket.role + "\n");
            return;
        }

        const restrictedCommands = ["/upload", "/delete", "/download", "/execute"];
        const cmd = message.split(" ")[0];

    if (restrictedCommands.includes(cmd) && socket.role !== "super") {
        socket.write(" Nuk ke leje për këtë komandë!\n");
        return;
    }

        messages.push({ client: clientAddress, message: message, timestamp: new Date() });
        fs.appendFileSync('server_messages.txt', `[${new Date().toLocaleString()}] ${clientAddress}: ${message}\n`);


        clientsWithRequests.add(clientAddress);

        socket.write(`Serveri mori mesazhin: ${message}\n`);
        
     
        console.log(`Klientët që kanë bërë të paktën një request: ${Array.from(clientsWithRequests).join(", ")}`);

   
        const clientsWithoutRequests = Array.from(activeClients)
            .map(s => s.remoteAddress + ":" + s.remotePort)
            .filter(addr => !clientsWithRequests.has(addr));
        console.log(`Klientët që nuk kanë bërë ende request: ${clientsWithoutRequests.join(", ")}`);


    });

    socket.on("end", () => {
        activeClients.delete(socket);
           clientsWithRequests.delete(clientAddress); 
        console.log(`Klienti u shkëput: ${clientAddress}`);
    });

    socket.on("error", (err) => {
        activeClients.delete(socket);
         clientsWithRequests.delete(clientAddress); 
        console.log(`Gabim me klientin ${clientAddress}: ${err.message}`);
    });
});
server.listen ( PORT, HOST, () => {
  console.log(`✅ Serveri po dëgjon në ${HOST}:${PORT}`);
});
