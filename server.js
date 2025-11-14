const net = require('net');
const fs = require('fs');
const { HOST, PORT } = require('./server/config');

const MAX_CLIENTS = 3;         
const activeClients = new Set(); 
const clientsWithRequests = new Set();  

const messages = [];

const clientDataStore = new Map(); 

const server = net.createServer((socket) => {
    const clientAddress = socket.remoteAddress + ":" + socket.remotePort;


    if (clientDataStore.has(clientAddress)) {
        const data = clientDataStore.get(clientAddress);
        socket.role = data.role;
        socket.write(`🟩 Mirësevini përsëri! Roli yt është rikuperuar: ${socket.role}\n`);
        console.log(`Klienti u rikuperua: ${clientAddress}`);
    } else {
        socket.role = "super"; 
        socket.write("🟩 Roli yt aktual: " + socket.role + "\n");

        clientDataStore.set(clientAddress, {
            role: socket.role,
            lastMessages: [],
            messageCount: 0,
            bytesSent: 0,
            bytesReceived: 0,
            reconnected: true
        });
    }

    if (activeClients.size >= MAX_CLIENTS) {
        socket.write("Serveri ka arritur numrin maksimal të klientëve. Provo më vonë.\n");
        socket.end();
        console.log(`Lidhja e re u refuzua: ${clientAddress}`);
        return;
    }

    activeClients.add(socket);
    console.log(`Klienti i ri u lidh: ${clientAddress}`);
    socket.write("Je lidhur me serverin!\n");
    const TIMEOUT_MS = 30000; 
    const clientTimers = new Map();

    function resetTimer() {
    if (clientTimers.has(socket)) clearTimeout(clientTimers.get(socket));

    const timeout = setTimeout(() => {
        socket.write("Koha e pritjes ka skaduar. Lidhja po mbyllet.\n");
        socket.end();
        console.log(`Klienti u mbyll për shkak të paaktivitetit: ${clientAddress}`);
    }, TIMEOUT_MS);

    clientTimers.set(socket, timeout);
}

resetTimer();


  

    socket.on("data", (data) => {
        const message = data.toString().trim();
        console.log(`Mesazh nga ${clientAddress}: ${message}`);


          const clientData = clientDataStore.get(clientAddress);

        clientData.messageCount += 1;
        clientData.bytesReceived += Buffer.byteLength(data);


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
            clientData.role = newRole;   
            clientDataStore.set(clientAddress, clientData);
            socket.write("Roli u ndryshua në: " + socket.role + "\n");
            return;
        }

        const restrictedCommands = ["/upload", "/delete", "/download", "/execute"];
        const cmd = message.split(" ")[0];

    if (restrictedCommands.includes(cmd) && socket.role !== "super") {
        socket.write(" Nuk ke leje për këtë komandë!\n");
        return;
    }

     if (message.startsWith("/ls") && socket.role === "super") {
            const parts = message.split(" ");
            const dir = parts[1] || "."; 
            fs.readdir(dir, (err, files) => {
                if (err) {
                    socket.write(`Gabim gjatë leximit të folderit: ${err.message}\n`);
                } else {
                    socket.write(`Përmbajtja e folderit '${dir}':\n` + files.join("\n") + "\n");
                }
            });
            return;
        }

        if (message.startsWith("/cat") && socket.role === "super") {
            const parts = message.split(" ");
            const file = parts[1];
            if (!file) {
                socket.write("Përdorimi: /cat <filename>\n");
                return;
            }
            fs.readFile(file, "utf8", (err, data) => {
                if (err) {
                    socket.write(`Gabim gjatë leximin e file-it: ${err.message}\n`);
                } else {
                    socket.write(`Përmbajtja e file-it '${file}':\n${data}\n`);
                }
            });
            return;
        }



        messages.push({ client: clientAddress, message: message, timestamp: new Date() });

         clientDataStore.set(clientAddress, clientData);

        fs.appendFileSync('server_messages.txt', `[${new Date().toLocaleString()}] ${clientAddress}: ${message}\n`);


        clientsWithRequests.add(clientAddress);
        

       const response = `Serveri mori mesazhin: ${message}\n`;
        socket.write(response);
        clientData.bytesSent += Buffer.byteLength(response);
        
     
        console.log(`Klientët që kanë bërë të paktën një request: ${Array.from(clientsWithRequests).join(", ")}`);

   
        const clientsWithoutRequests = Array.from(activeClients)
            .map(s => s.remoteAddress + ":" + s.remotePort)
            .filter(addr => !clientsWithRequests.has(addr));
        console.log(`Klientët që nuk kanë bërë ende request: ${clientsWithoutRequests.join(", ")}`);

        if (message === "/stats") {
            let statsMessage = "\n--- STATISTIKAT E SERVERIT ---\n";
            statsMessage += `Lidhje aktive: ${activeClients.size}\n`;
            for (const [addr, data] of clientDataStore.entries()) {
                statsMessage += `Klienti: ${addr}\n`;
                statsMessage += `  Role: ${data.role}\n`;
                statsMessage += `  Numri i mesazheve: ${data.messageCount}\n`;
                statsMessage += `  Bytes të dërguara: ${data.bytesSent}\n`;
                statsMessage += `  Bytes të pranuara: ${data.bytesReceived}\n`;
            }
            console.log(statsMessage);
            fs.appendFileSync('server_stats.txt', statsMessage + '\n');
            socket.write(" Statistikat u shfaqën në server log.\n");
        }

        resetTimer(); 

    });

    socket.on("end", () => {
        if (clientTimers.has(socket)) clearTimeout(clientTimers.get(socket));
        activeClients.delete(socket);
           clientsWithRequests.delete(clientAddress); 
        console.log(`Klienti u shkëput: ${clientAddress}`);
    });

    socket.on("error", (err) => {
        if (clientTimers.has(socket)) clearTimeout(clientTimers.get(socket)); 
        activeClients.delete(socket);
         clientsWithRequests.delete(clientAddress); 
        console.log(`Gabim me klientin ${clientAddress}: ${err.message}`);
    });
});
server.listen ( PORT, HOST, () => {
  console.log(`Serveri po dëgjon në ${HOST}:${PORT}`);
});
