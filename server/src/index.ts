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

import { WarRoom } from "./rooms/WarRoom";

const port = Number(process.env.port) || 3000;

const app = express();
app.use(express.json());

app.use("/playground", playground);

const gameServer = new Server({
  server: createServer(app),
});

gameServer.define("game", WarRoom);

app.use(express.static("public"));

// app.get("/hello_world", (req, res) => {
//   res.send("It's time to kick ass and chew bubblegum!");
// });

gameServer.listen(port);
console.log(`Listening on ws://localhost:${port}`);
