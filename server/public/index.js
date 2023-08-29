// import { Client } from "colyseus.js";

console.log("creating client");
const client = new Colyseus.Client("ws://localhost:3000");
const lobby = await client.joinOrCreate("game", {});

let allRooms = [];

lobby.onMessage("rooms", (rooms) => {
  allRooms = rooms;
});

lobby.onMessage("+", ([roomId, room]) => {
  const roomIndex = allRooms.findIndex((room) => room.roomId === roomId);
  if (roomIndex !== -1) {
    allRooms[roomIndex] = room;
  } else {
    allRooms.push(room);
  }
});

lobby.onMessage("-", (roomId) => {
  allRooms = allRooms.filter((room) => room.roomId !== roomId);
});
