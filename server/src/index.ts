/**
 * IMPORTANT:
 * ---------
 * Do not manually edit this file if you'd like to host your server on Colyseus Cloud
 *
 * If you're self-hosting (without Colyseus Cloud), you can manually
 * instantiate a Colyseus Server as documented here:
 *
 * See: https://docs.colyseus.io/server/api/#constructor-options
 */
// // import { listen } from "@colyseus/tools";

// // Import Colyseus config
// import app from "./app.config";

// // Create and listen on 2567 (or PORT environment variable.)
// listen(app);

// Colyseus + Express
import { Server } from "colyseus";
import { playground } from "@colyseus/playground";

import { createServer } from "http";
import express from "express";

import { MyRoom } from "./rooms/MyRoom";

const port = Number(process.env.port) || 3000;

const app = express();
app.use(express.json());
app.use(express.static("public"));

app.use("/playground", playground);

const gameServer = new Server({
  server: createServer(app),
});

// gameServer
//   .define("my_room", MyRoom)
//   .on("create", (room) => console.log("room created:", room.roomId))
//   .on("dispose", (room) => console.log("room disposed:", room.roomId))
//   .on("join", (room, client) => console.log(client.id, "joined", room.roomId))
//   .on("leave", (room, client) => console.log(client.id, "left", room.roomId));

// client.joinOrCreate("my_room", { maxClients: 10 }).then(room => {/* ... */});
// client.joinOrCreate("battle", { maxClients: 20 }).then(room => {/* ... */});

import { LobbyRoom } from "colyseus";

// Expose the "lobby" room.
gameServer.define("lobby", LobbyRoom);

// Expose your game room with realtime listing enabled.
gameServer.define("game", MyRoom).enableRealtimeListing();

app.get("/hello_world", (req, res) => {
  res.send("It's time to kick ass and chew bubblegum!");
});

gameServer.listen(port);
