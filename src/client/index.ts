import { type Room, Client } from "colyseus.js";
import Panzoom from "@panzoom/panzoom";

import { Board } from "server/rooms/schema/Board";
import type { Tile } from "server/rooms/schema/Tile";
import type { Unit } from "server/rooms/schema/Unit";
import type { Player } from "server/rooms/schema/Player";

import * as utils from "common/utils";
import { AxialCoords, TileCoord } from "common/utils";

const MAP_SIZE_X = 2000;
const MAP_SIZE_Y = 2000;

const MAP_SHIFT_X = MAP_SIZE_X / 2.0; // how much to shift all graphics
const MAP_SHIFT_Y = MAP_SIZE_Y / 2.0; // how much to shift all graphics

const TILE_SIZE = 50.0; // distance from hexagon center to vertices

const HORIZONTAL_UNIT = 1.5 * TILE_SIZE;
const VERTICAL_UNIT = Math.sqrt(3.0) * TILE_SIZE;

const EDGES = 6;
const ANGLE = (2 * Math.PI) / EDGES;
const VERTICES: AxialCoords[] = []; // precompute flat top hex vertices
for (let i = 0; i < EDGES; i++) {
  VERTICES.push([
    TILE_SIZE * Math.cos(i * ANGLE),
    TILE_SIZE * Math.sin(i * ANGLE),
  ]);
}

const TILE_BORDER = "#000000";
const NEUTRAL_TILE_COLORS = ["#a0a0a0", "#606060"];
const PLAYER_TILE_COLORS = [
  ["#ff6060", "#cc4040"],
  ["#6060ff", "#4040cc"],
  ["#60ff60", "#40cc40"],
];

const IMG_SOLDIER1 = document.getElementById("soldier1") as HTMLImageElement;
const IMG_SOLDIER2 = document.getElementById("soldier2") as HTMLImageElement;
const IMG_SOLDIER3 = document.getElementById("soldier3") as HTMLImageElement;
const IMG_SOLDIER4 = document.getElementById("soldier4") as HTMLImageElement;
const IMG_TOWER2 = document.getElementById("tower2") as HTMLImageElement;
const IMG_TOWER3 = document.getElementById("tower3") as HTMLImageElement;
const IMG_PINE = document.getElementById("pine") as HTMLImageElement;

const TextureMap: Partial<Record<string, HTMLImageElement>> = {
  Soldier1: IMG_SOLDIER1,
  Soldier2: IMG_SOLDIER2,
  Soldier3: IMG_SOLDIER3,
  Soldier4: IMG_SOLDIER4,
  Tower2: IMG_TOWER2,
  Tower3: IMG_TOWER3,
  Pine: IMG_PINE,
};

// ################################

const canvas = document.getElementById("canvas") as HTMLCanvasElement;
const ctx = canvas.getContext("2d");

canvas.style.width = `${MAP_SIZE_X}px`;
canvas.style.height = `${MAP_SIZE_Y}px`;

const scale = window.devicePixelRatio;
canvas.width = Math.floor(MAP_SIZE_X * scale);
canvas.height = Math.floor(MAP_SIZE_Y * scale);
ctx.scale(scale, scale);

const panzoom = Panzoom(canvas, {
  canvas: true,
  minScale: 0.5,
  maxScale: 1.5,
  step: 0.15,
  startX: (window.innerWidth - MAP_SIZE_X) / 2,
  startY: (window.innerHeight - MAP_SIZE_Y) / 2,
});
canvas.parentElement.addEventListener("wheel", panzoom.zoomWithWheel);
canvas.addEventListener("click", canvasClicked);

// ################################

let thisPlayer: Player;
let isMovingUnit = false;
let moveSource: AxialCoords = [0, 0];
let possibleMoveTiles = new Set();

// ################################

function drawHexagon(
  x: number,
  y: number,
  borderColor: string,
  fillColor: string
) {
  ctx.beginPath();
  for (let i = 0; i < VERTICES.length; i++) {
    let xx = x + VERTICES[i][0] + MAP_SHIFT_X;
    let yy = y + VERTICES[i][1] + MAP_SHIFT_Y;

    ctx.lineTo(xx, yy);
  }
  ctx.closePath();

  ctx.lineWidth = 3;
  ctx.strokeStyle = borderColor;
  ctx.stroke();

  ctx.fillStyle = fillColor;
  ctx.fill();
}

function getPixelFromTileCoord([q, r]: AxialCoords) {
  let x = HORIZONTAL_UNIT * q;
  let y = VERTICAL_UNIT * (q / 2 + r);
  return [x, y];
}

function drawTileFromMap(tileCoord: TileCoord, tile: Tile) {
  let [x, y] = getPixelFromTileCoord(utils.parseTileCoord(tileCoord));
  let [color, shadedColor] =
    PLAYER_TILE_COLORS[room.state.players.get(tile.ownerId)?.playerNumber] ||
    NEUTRAL_TILE_COLORS;
  let fillColor =
    isMovingUnit && !possibleMoveTiles.has(tileCoord) ? shadedColor : color;
  drawHexagon(x, y, TILE_BORDER, fillColor);
}

function drawUnitFromMap(tileCoord: TileCoord, unit: Unit) {
  let [x, y] = getPixelFromTileCoord(utils.parseTileCoord(tileCoord));
  let size = TILE_SIZE * 1.5;

  let image = TextureMap[unit.constructor.name] || IMG_SOLDIER1;

  ctx.drawImage(
    image,
    x - size / 2 + MAP_SHIFT_X,
    y - size / 2 + MAP_SHIFT_Y,
    size,
    size
  );
}

function renderCanvas() {
  for (const [tileCoord, tile] of room.state.tiles) {
    drawTileFromMap(tileCoord, tile);
    if (tile.unit) {
      drawUnitFromMap(tileCoord, tile.unit);
    }
  }
}

function renderHUD() {
  if (!thisPlayer) {
    return;
  }

  // Ready Button
  if (room.state.gameStarted) {
    readyButton.style.display = "none";
  } else if (thisPlayer.readyToStart) {
    readyButton.innerText = "Waiting for other players...";
    readyButton.style.display = "inline-block";
    readyButton.disabled = true;
  } else {
    readyButton.innerText = "Ready to Start!";
    readyButton.style.display = "inline-block";
    readyButton.disabled = false;
  }

  // Next Turn Button
  if (room.state.gameStarted && isPlayersTurn()) {
    endTurnButton.style.display = "inline-block";
  } else {
    endTurnButton.style.display = "none";
  }
}

function render() {
  thisPlayer = room.state.players.get(room.sessionId);
  renderHUD();
  renderCanvas();
  thisPlayer?.provinces?.forEach((province, name) => {
    console.log(
      `Province ${name} Income: ${province.income} Money ${province.money}`
    );
  });
}

function axialRound([q, r]: AxialCoords) {
  let s = -q - r; // convert to cube coords

  let q_i = Math.round(q);
  let r_i = Math.round(r);
  let s_i = Math.round(s);

  let q_diff = Math.abs(q_i - q);
  let r_diff = Math.abs(r_i - r);
  let s_diff = Math.abs(s_i - s);

  if (q_diff > r_diff && q_diff > s_diff) {
    q_i = -r_i - s_i;
  } else if (r_diff > s_diff) {
    r_i = -q_i - s_i;
  }
  // in cube version also calc s_i

  return [0 + q_i, 0 + r_i];
}

function getTile([q, r]: AxialCoords) {
  return room.state.tiles.get(utils.hexToTileCoord([q, r]));
}

function canvasClicked(event: MouseEvent) {
  if (!isPlayersTurn()) {
    return;
  }
  let x = event.offsetX - MAP_SHIFT_X;
  let y = event.offsetY - MAP_SHIFT_Y;

  let q = x / HORIZONTAL_UNIT;
  let r = -x / (3.0 * TILE_SIZE) + y / VERTICAL_UNIT;

  [q, r] = axialRound([q, r]);

  let tile = getTile([q, r]);
  let unit = tile.unit;

  if (
    unit &&
    tile.ownerId === thisPlayer.playerId &&
    unit.moveRange > 0 &&
    !isMovingUnit
  ) {
    isMovingUnit = true;
    moveSource = [q, r];

    possibleMoveTiles = utils.getValidMoveTiles(room.state.tiles, moveSource);

    render();
  } else if (isMovingUnit) {
    isMovingUnit = false;
    if (moveSource[0] != q || moveSource[1] != r) {
      room.send("move", [moveSource, [q, r]]);
    }
    render();
  }
}

function isPlayersTurn() {
  return room.state.currentPlayerNumber === thisPlayer.playerNumber;
}

const readyButton = document.getElementById("ready") as HTMLButtonElement;
const endTurnButton = document.getElementById("end-turn") as HTMLButtonElement;
readyButton.addEventListener("click", () => room.send("readyToStart"));
endTurnButton.addEventListener("click", () => {
  if (!isMovingUnit) {
    room.send("endTurn");
  }
});

console.log("creating client");
const client = new Client(`ws://${window.location.host}`);

let room: Room<Board>;
const cachedReconnectionToken =
  window.localStorage.getItem("reconnectionToken");

let joinedRoom = false;

if (cachedReconnectionToken) {
  try {
    room = await client.reconnect(cachedReconnectionToken, Board);
    console.log("reconnected successfully", room);
    joinedRoom = true;
  } catch (e) {
    console.log("server probably died, joining room normally");
  }
}

if (!joinedRoom) {
  room = await client.joinOrCreate("game", {}, Board);
  console.log("joined successfully", room);
}
window.localStorage.setItem("reconnectionToken", room.reconnectionToken);

room.onStateChange(() => {
  render();
});

/*
All image sources: https://github.com/yiotro/Antiyoy/tree/master/assets/field_elements

- Gameplay:
  - debug provinces having wrong income, and split provinces getting wrong money
  - click on tower -> show shields (client side only)
  - combining units
  - killing provinces with no money

  - buying units
  - render provinces
    - draw an outline
  - clickable provinces

  - world generation
    - single continent (merge blobs)
  - tree spreading

- Optimization:
  - separate canvas for rendering tiles, units, highlight, shading ...


- Player HUD:
  - display player name and color in top left
  - display all players in top left (durring start up too)
  - income, money, provinces
  - display province names
  - purchase buttons for units

- house keeping
  - tiles should have a unit in them
  - tiles should know their coordinate (but not replicate it)
    - makes neighboring / adjancency cleaner
  - make provinces id-able across all players (use unique ids for provinces)
  - delete 1 tile provinces and handle correctly in merging
  - use schema types on client side:
    - e.g. not replicating unitName (use polymorphism / check instanceof)
  - hex coord / tilecoord conversions??? Make less ugly
  - pull out rendering functions
  - pull out game logic from schema classes

*/
