const net = require('net');
const readline = require('readline');
const fs = require('fs');
const path = require('path');

const HOST = '127.0.0.1';
const PORT = 8084;

const rlRole = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

let clientRole = "super";


rlRole.question("Zgjidhni rolin tuaj (super/admin/user): ", (roleInput) => {
    clientRole = roleInput.trim().toLowerCase();
    rlRole.close();

    const client = new net.Socket();

    client.connect(PORT, HOST, () => {
        console.log(' U lidhët me serverin me sukses!');
        client.write(`/role ${clientRole}\n`);

        const rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout
        });

        function handleList(client) { client.write("/list\n"); }
        function handleRead(client, filename) {
            if (!filename) return console.log("Përdorimi: /read <filename>");
            client.write(`/read ${filename}\n`);
        }
        function handleUpload(client, filename) {
            if (!filename) return console.log("Përdorimi: /upload <filename>");
            const filePath = path.join(__dirname, filename);
            if (!fs.existsSync(filePath)) return console.log("Gabim: File nuk ekziston në klient!");
            const content = fs.readFileSync(filePath);
            const encoded = Buffer.from(content).toString("base64");
            client.write(`/upload ${filename} ${encoded}\n`);
        }
        function handleDownload(client, filename) {
            if (!filename) return console.log("Përdorimi: /download <filename>");
            rl.question("Shkruaj path-in ku dëshiron ta ruash file-in: ", (savePath) => {
                client.downloadPath = savePath.trim(); 
                client.write(`/download ${filename}\n`);
            });
        }
        function handleDelete(client, filename) {
            if (!filename) return console.log("Përdorimi: /delete <filename>");
            client.write(`/delete ${filename}\n`);
        }
        function handleSearch(client, keyword) {
            if (!keyword) return console.log("Përdorimi: /search <keyword>");
            client.write(`/search ${keyword}\n`);
        }
        function handleInfo(client, filename) {
            if (!filename) return console.log("Përdorimi: /info <filename>");
            client.write(`/info ${filename}\n`);
        }
        function handleWrite(client, filename, content) {
            if (!filename) return console.log("Përdorimi: /write <filename> <content>");
            if (!content) return console.log("Përdorimi: /write <filename> <content>");
            // Encode content në base64 për të dërguar sigurt
            const encoded = Buffer.from(content).toString("base64");
            client.write(`/write ${filename} ${encoded}\n`);
        }

        rl.on("line", (input) => {
            const parts = input.trim().split(" ");
            const cmd = parts[0];
            const arg = parts[1];

            if (clientRole === "super") {
                // Kontrollo nëse është komandë /write
                if (cmd === "/write") {
                    const filename = parts[1];
                    const content = parts.slice(2).join(" ");
                    handleWrite(client, filename, content);
                } else {
                    // Nëse nuk është komandë /write, dërgo si mesazh
                    client.write(input + '\n');
                }
            } else if (clientRole === "admin") {
               
                switch(cmd) {
                    case "/list": handleList(client); break;
                    case "/read": handleRead(client, arg); break;
                    case "/upload": handleUpload(client, arg); break;
                    case "/download": handleDownload(client, arg); break;
                    case "/delete": handleDelete(client, arg); break;
                    case "/search": handleSearch(client, arg); break;
                    case "/info": handleInfo(client, arg); break;
                    default: console.log(" Komandë e ndaluar për admin.");
                }
                  
    } else if (clientRole === "user") {
        switch(cmd) {
            case "/list": handleList(client); break;
            case "/read": handleRead(client, arg); break;
            default:  client.write(input + '\n');
            // <--- Këtu është problemi: hello server nuk dërgohet tek serveri
        }
    } else {
        console.log("Rol i panjohur. Përdor /role për ta ndryshuar.");
    }
});

        client.on('close', () => {
            console.log(' Lidhja me serverin u mbyll.');
            rl.close();
        });
    });

    client.on('data', (data) => {
        const message = data.toString();
        if (message.startsWith("/file ")) {
            const parts = message.split(" ");
            const filename = parts[1];
            const base64content = parts.slice(2).join(" ");
            const content = Buffer.from(base64content, 'base64');
            const outputPath = client.downloadPath
        ? path.join(client.downloadPath, filename)
        : filename;
            fs.writeFileSync(outputPath, content);
            console.log(`📥 File '${filename}' u shkarkua me sukses te ${outputPath}!`);
            return;
        }
        console.log(" Mesazh nga serveri:", message);
    });

    client.on('error', (err) => {
        console.error(' Gabim:', err.message);
    });
});
