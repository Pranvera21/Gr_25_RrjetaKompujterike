const net = require('net');
const readline = require('readline');


const HOST = '127.0.0.1';
const PORT = 8084;
const rlRole = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

rlRole.question("Zgjidhni rolin tuaj (super/admin): ", (roleInput) => {
    const role = roleInput.trim().toLowerCase();
    let clientRole = role;
    rlRole.close();
const client = new net.Socket();

client.connect(PORT, HOST, () => {
    console.log(' U lidhët me serverin me sukses!');
    client.write(`/role ${clientRole}`);
    client.write('Përshëndetje nga klienti!');
    

});

client.on('data', (data) => {
    console.log(' Mesazh nga serveri:', data.toString());
});

client.on('close', () => {
    console.log(' Lidhja me serverin u mbyll.');
});


client.on('error', (err) => {
    console.error(' Gabim:', err.message);
});
const rl = readline.createInterface({
   input: process.stdin,
    output: process.stdout
});

rl.on("line", (input) => {
    if (role === "super") {
        client.write(input);
    } 
    else if (role === "admin") {
     
        const allowed = ["/list", "/read", "/upload", "/download", "/delete", "/search","/info"];
        const cmd = input.split(" ")[0];
        if (allowed.includes(cmd)) {
            client.write(input);
        } else {
            console.log(" Komandë e ndaluar për admin. Lejohet vetëm:", allowed.join(", "));
        }
    }
});

});
