import net from "net";
import { SERVER_IP, SERVER_PORT } from "./config.js";

const client = new net.Socket();

client.connect(SERVER_PORT, SERVER_IP, () => {
  console.log("Connected to server");
  client.write("/list");
});

client.on("data", data => {
  console.log("Server:", data.toString());
});

client.on("close", () => console.log("Connection closed"));
