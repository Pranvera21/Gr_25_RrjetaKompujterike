const net = require('net');
const readline = require('readline');
const fs = require('fs');
const path = require('path');

const crypto = require('crypto');

const clientIDPath = "clientID.txt";
let clientID;

if (fs.existsSync(clientIDPath)) {
    clientID = fs.readFileSync(clientIDPath, "utf8").trim();
} else {
    clientID = crypto.randomUUID();
    fs.writeFileSync(clientIDPath, clientID);
}

const HOST = '127.0.0.1';
const PORT = 8084;


const rlRole = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

let clientRole = "super";


rlRole.question("Zgjidhni rolin tuaj (super/admin/user): ", (roleInput) =>   {
    clientRole = roleInput.trim().toLowerCase();
    rlRole.close();

    const client = new net.Socket();

    client.connect(PORT, HOST, () => {
        console.log(' U lidhët me serverin me sukses!');
         client.write(`/id ${clientID}\n`);
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

    

        function handleUpload(client) {
    rl.question("➡ Shkruaj path-in e file-it që dëshiron të ngarkosh: ", (localPath) => {

        localPath = localPath.trim();

        if (!fs.existsSync(localPath)) {
            console.log("Gabim: File-i nuk ekziston!");
            return;
        }

        rl.question("➡ Me cilin emër dëshiron të ruhet në server? ", (serverFilename) => {

            serverFilename = serverFilename.trim();
            if (!serverFilename) {
                console.log("Duhet të japësh një emër file-i!");
                return;
            }

            const fileData = fs.readFileSync(localPath);
            const base64 = fileData.toString("base64");

            client.write(`/upload ${serverFilename} ${base64}\n`);
            console.log(`File '${localPath}' po dërgohet te serveri si '${serverFilename}'...`);
        });
    });
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
            const encoded = Buffer.from(content).toString("base64");
            client.write(`/write ${filename} ${encoded}\n`);
        }

        rl.on("line", (input) => {
            const parts = input.trim().split(" ");
            const cmd = parts[0];
            const arg = parts[1];

            if (clientRole === "super") {
                switch(cmd) {
                    case "/read": handleRead(client, arg); break;
                    case "/execute": client.write(input + '\n'); break;
                    case "/write": 
                        const filename = parts[1];
                        const content = parts.slice(2).join(" ");
                        handleWrite(client, filename, content);
                        break;
                    default: 
                   if (!cmd.startsWith("/")) client.write(input + '\n');
                else console.log("Komandë e ndaluar për super. Lejohen vetëm: /read, /execute, /write");
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
                                if (!cmd.startsWith("/")) client.write(input + '\n');
                else console.log("Komandë e ndaluar për admin.");

}
            

                  
  else if (clientRole === "user") {
    switch(cmd) {
        case "/read": handleRead(client, arg); break;
        case "/stats": client.write(input + '\n'); break;
        default:
            if (!cmd.startsWith("/")) {
                client.write(input + '\n');  
            } else {
                console.log("Komandë e ndaluar për user. Lejohet vetëm: /read dhe /stats");
            }
    }
}


        client.on('close', () => {
            console.log(' Lidhja me serverin u mbyll.');
            rl.close();
        });
    });

    let dataBuffer = '';
    client.on('data', (data) => {
        dataBuffer += data.toString();
        const messages = dataBuffer.split('\n');
        dataBuffer = messages.pop() || '';
        
        messages.forEach(msg => {
            msg = msg.trim();
            if (!msg) return;
            
            if (msg.startsWith("/file ")) {
            const parts = msg.split(" ");
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
            console.log(msg);
        });
    });

    client.on('error', (err) => {
        console.error(' Gabim:', err.message);
    });

    });
});
