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

gameServer.listen(port);
console.log(`Listening on ws://localhost:${port}`);
