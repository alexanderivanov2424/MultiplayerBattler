// import { Client } from "colyseus.js";

console.log("creating client");
const client = new Colyseus.Client("ws://localhost:3000");
const room = await client.joinOrCreate("game");

const counter = document.getElementById("counter");
const button = document.getElementById("button");

room.state.listen("counter", (currentValue, previousValue) => {
  console.log(`currentTurn is now ${currentValue}`);
  console.log(`previous value was: ${previousValue}`);
  counter.textContent = currentValue;
});

button.addEventListener("click", (e) => {
  var x = room.state.counter;
  console.log("the number is " + x + " before send");
  room.send("increment");
});
