const net = require('net');

const HOST = '127.0.0.1';
const PORT = 8084;

const client = new net.Socket();

client.connect(PORT, HOST, () => {
    console.log(' U lidhët me serverin me sukses!');
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
