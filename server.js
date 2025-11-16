const net = require('net');
const fs = require('fs');
const { HOST, PORT } = require('./server/config');
const { exec } = require('child_process'); 
const path = require("path");


const MAX_CLIENTS = 3;         
const activeClients = new Set(); 
const clientsWithRequests = new Set();  
const messages = [];
const clientDataStore = new Map();

const SERVER_BASE_DIR = path.resolve(__dirname); 
const MAX_UPLOAD_BYTES = 5 * 1024 * 1024;

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
    const TIMEOUT_MS = 300000; 
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

 function safeServerPath(requested) {
        const resolved = path.resolve(SERVER_BASE_DIR, requested);
        if (!resolved.startsWith(SERVER_BASE_DIR)) return null; 
        return resolved;
    }


  

    socket.on("data", (data) => {
        const raw = data.toString();
        const message = raw.trim();
        console.log(`Mesazh nga ${clientAddress}: ${message}`);


          const clientData = clientDataStore.get(clientAddress);
        clientData.messageCount += 1;
        clientData.bytesReceived += Buffer.byteLength(data);

       if (message.startsWith("/role")) {
    const parts = message.split(" ");
    const newRole = parts[1];

    if (!newRole) {
        socket.write("Përdorimi: /role <user|admin|super>\n");
        return;
    }

    if (!["user", "admin", "super"].includes(newRole)) {
        socket.write("Rol i pavlefshëm! Lejohen: user, admin, super\n");
        return;
    }

    socket.role = newRole;
    clientData.role = newRole;
    clientDataStore.set(clientAddress, clientData);

    socket.write("Roli u ndryshua në: " + newRole + "\n");
    return;
}

// Kontrollojmë vetëm komandat që fillojnë me '/'
if (message.startsWith("/")) {
    const cmd = message.split(" ")[0];

    const superOnly = ["/execute", "/write"];
    if (superOnly.includes(cmd) && socket.role !== "super") {
        socket.write(" Nuk ke leje për këtë komandë!\n");
        return;
    }

    const adminAllowed = ["/list", "/read", "/upload", "/download", "/delete", "/search", "/info"];
    if (socket.role === "admin" && !adminAllowed.includes(cmd)) {
        socket.write(" Komandë e ndaluar për admin.\n");
        return;
    }

    const userAllowed = ["/read"];
    if (socket.role === "user" && !userAllowed.includes(cmd)) {
        socket.write(" Komandë e ndaluar për user. Lejohet vetëm: /read\n");
        return;
    }

}


if (message === "/list") {
    if (socket.role === "user") {
            socket.write(" Nuk ke leje për këtë komandë!\n");
        return;
    }
    fs.readdir(SERVER_BASE_DIR, (err, files) => {
        if (err) socket.write("Gabim gjatë listimit të direktorive.\n");
        else socket.write("📂 File-at në server:\n" + files.join("\n") + "\n");
    });
    return;
}
if (message.startsWith("/read")) {
    const file = message.split(" ")[1];
    if (!file) return socket.write("Përdorimi: /read <filename>\n");

    const safe = safeServerPath(file);

    if (!safe) return socket.write("Path i pavlefshëm ose jashtë direktoriumit.\n");


    fs.readFile(safe, "utf8", (err, data) => {
        if (err) socket.write("Gabim gjatë leximit të file-it.\n");
        else socket.write(`📄 Përmbajtja e ${file}:\n${data}\n`);
    });
    return;
}
if (message.startsWith("/upload")) {
    const parts = message.split(" ");
    const filename = parts[1];
    const base64data = parts.slice(2).join(" ");

    if (!filename || !base64data)
        return socket.write("Përdorimi: /upload <filename> <data>\n");

   const safe = safeServerPath(filename);


    if (!safe) return socket.write("Path i pavlefshëm ose jashtë direktoriumit.\n");

    const content = Buffer.from(base64data, "base64");
    if (content.length > MAX_UPLOAD_BYTES) {
                return socket.write("Gabim: File i madh. Maksimumi 5MB.\n");
            }



    fs.writeFile(safe, content, (err) => {
        if (err) socket.write("Gabim gjatë ruajtjes së file-it.\n");
        else socket.write(`📤 File '${filename}' u ngarkua me sukses!\n`);
    });
    return;
}

if (message.startsWith("/download")) {
    const file = message.split(" ")[1];
    if (!file) return socket.write("Përdorimi: /download <filename>\n");

    const safe = safeServerPath(file); 
    if (!safe) return socket.write("Path i pavlefshëm ose jashtë direktoriumit.\n");


    fs.readFile(safe, (err, data) => {
        if (err) return socket.write("Gabim gjatë leximit të file-it.\n");


        const base64Content = data.toString("base64");
        socket.write(`/file ${file} ${base64Content}\n`);
    });
    return;
}

if (message.startsWith("/delete")) {
    const file = message.split(" ")[1];
    if (!file) return socket.write("Përdorimi: /delete <filename>\n");

    const safe = safeServerPath(file);


            if (!safe) return socket.write("Path i pavlefshëm ose jashtë direktoriumit.\n");

    fs.unlink(safe, (err) => {
        if (err) socket.write("Gabim gjatë fshirjes së file-it.\n");
        else socket.write(`🗑 File '${file}' u fshi me sukses!\n`);
    });
    return;
}

if (message.startsWith("/search")) {
    const keyword = message.split(" ")[1];
    if (!keyword) return socket.write("Përdorimi: /search <keyword>\n");
    fs.readdir(SERVER_BASE_DIR, (err, files) => {
        if (err) return socket.write("Gabim gjatë kërkimit.\n");

        let results = [];
        files.forEach((f) => {
            const filePath = path.join(SERVER_BASE_DIR, f);
            if (fs.statSync(filePath).isFile()) {
                const content = fs.readFileSync(filePath, "utf8");
                if (content.includes(keyword)) {
                    results.push(f);
                }
            }
        });
        socket.write(`🔍 Rezultatet për '${keyword}':\n${results.join("\n") || "Asgjë nuk u gjet."}\n`);
    });
    return;
}

if (message.startsWith("/info")) {
    const file = message.split(" ")[1];
    if (!file) return socket.write("Përdorimi: /info <filename>\n");

     const safe = safeServerPath(file);
    if (!safe) return socket.write("Path i pavlefshëm ose jashtë direktoriumit.\n");

    fs.stat(safe, (err, stats) => {
        if (err) return socket.write("Gabim gjatë leximit të statistikave.\n");

        socket.write(
            `ℹ Informata për ${file}:\n` +
            `Madhësia: ${stats.size} bytes\n` +
            `Krijuar: ${stats.birthtime}\n` +
            `Modifikuar: ${stats.mtime}\n`
        );
    });
    return;
}
 if (message.startsWith("/execute")) {
            const parts = message.split(" ");
            const command = parts.slice(1).join(" ");
            if (!command) return socket.write("Përdorimi: /execute <cmd>\n");

         
            if (command.length > 200) return socket.write("Komanda shumë e gjatë.\n");

            exec(command, { timeout: 5000, maxBuffer: 1024 * 1024 }, (err, stdout, stderr) => {
                if (err) {
                    socket.write(`Gabim gjatë ekzekutimit: ${err.message}\n`);
                    if (stderr) socket.write(`STDERR: ${stderr}\n`);
                } else {
                    socket.write(`OUTPUT:\n${stdout}\n`);
                }
            });
            return;
        }

if (message.startsWith("/write")) {
    const parts = message.split(" ");
    const filename = parts[1];
    const base64data = parts.slice(2).join(" ");

    if (!filename || !base64data)
        return socket.write("Përdorimi: /write <filename> <content>\n");

    const safe = safeServerPath(filename);
    if (!safe) return socket.write("Path i pavlefshëm ose jashtë direktoriumit.\n");

    const content = Buffer.from(base64data, "base64");
    if (content.length > MAX_UPLOAD_BYTES) {
        return socket.write("Gabim: Përmbajtja shumë e madhe. Maksimumi 5MB.\n");
    }

    fs.writeFile(safe, content, (err) => {
        if (err) socket.write("Gabim gjatë shkrimit në file.\n");
        else socket.write(`✍️ Përmbajtja u shkrua me sukses në '${filename}'!\n`);
    });
    return;
}

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
            return;
        }

        resetTimer(); 

    

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

        resetTimer();
    });

    socket.on("error", (err) => {
        if (clientTimers.has(socket)) clearTimeout(clientTimers.get(socket)); 
        activeClients.delete(socket);
         clientsWithRequests.delete(clientAddress); 
        console.log(`Gabim me klientin ${clientAddress}: ${err.message}`);
    });
    socket.on("close", () => {
    activeClients.delete(socket);
    clientsWithRequests.delete(clientAddress);
    console.log(`Klienti u shkëput: ${clientAddress}`);
});
});
server.listen ( PORT, HOST, () => {
  console.log(`Serveri po dëgjon në ${HOST}:${PORT}`); });
