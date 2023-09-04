import "./utils";

const MAP_SIZE_X = 2000;
const MAP_SIZE_Y = 2000;

const MAP_SHIFT_X = MAP_SIZE_X / 2.0; // how much to shift all graphics
const MAP_SHIFT_Y = MAP_SIZE_Y / 2.0; // how much to shift all graphics

const TILE_SIZE = 50.0; // distance from hexagon center to vertices

const HORIZONTAL_UNIT = 1.5 * TILE_SIZE;
const VERTICAL_UNIT = Math.sqrt(3.0) * TILE_SIZE;

const EDGES = 6;
const ANGLE = (2 * Math.PI) / EDGES;
const VERTICES = []; // precompute flat top hex vertices
for (let i = 0; i < EDGES; i++) {
  VERTICES.push([
    TILE_SIZE * Math.cos(i * ANGLE),
    TILE_SIZE * Math.sin(i * ANGLE),
  ]);
}

const IMG_SOLDIER0 = document.getElementById("soldier0");
const IMG_SOLDIER1 = document.getElementById("soldier1");
const IMG_SOLDIER2 = document.getElementById("soldier2");
const IMG_TOWER0 = document.getElementById("tower0");
const IMG_TOWER1 = document.getElementById("tower1");
const IMG_PINE = document.getElementById("pine");

const TextureMap = {
  soldier0: IMG_SOLDIER0,
  soldier1: IMG_SOLDIER1,
  soldier2: IMG_SOLDIER2,
  tower0: IMG_TOWER0,
  tower1: IMG_TOWER1,
  pine: IMG_PINE,
};

const TILE_COLOR = "#ff6060";
const TILE_BORDER = "#000000";

const TILE_COLOR_SHADDED = "#cc4040";
const TILE_BORDER_SHADDED = "#000000";

// ################################

const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

canvas.style.width = `${MAP_SIZE_X}px`;
canvas.style.height = `${MAP_SIZE_Y}px`;

const scale = 4 * window.devicePixelRatio;
canvas.width = Math.floor(MAP_SIZE_X * scale);
canvas.height = Math.floor(MAP_SIZE_Y * scale);
ctx.scale(scale, scale);

const panzoom = Panzoom(canvas, {
  canvas: true,
  minScale: 0.5,
  maxScale: 2,
  startX: (window.innerWidth - MAP_SIZE_X) / 2,
  startY: (window.innerHeight - MAP_SIZE_Y) / 2,
});
canvas.parentElement.addEventListener("wheel", panzoom.zoomWithWheel);
canvas.addEventListener("click", canvasClicked);

// ################################

let isMovingUnit = false;
let moveSource = [0, 0];
let possibleMoveTiles = new Set();

// ################################

function drawHexagon(x, y, borderColor, fillColor) {
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

function parseTileCoord(tileCoord) {
  let [q, r] = tileCoord.split(",");
  q = Number(q);
  r = Number(r);
  return [q, r];
}

function getPixelFromTileCoord([q, r]) {
  let x = HORIZONTAL_UNIT * q;
  let y = VERTICAL_UNIT * (q / 2 + r);
  return [x, y];
}

function drawTileFromMap(tileCoord, tile) {
  let [x, y] = getPixelFromTileCoord(parseTileCoord(tileCoord));
  const [borderColor, fillColor] =
    isMovingUnit && !possibleMoveTiles.has(tileCoord)
      ? [TILE_BORDER_SHADDED, TILE_COLOR_SHADDED]
      : [TILE_BORDER, TILE_COLOR];
  drawHexagon(x, y, borderColor, fillColor);
}

function drawUnitFromMap(tileCoord, unit) {
  let [x, y] = getPixelFromTileCoord(parseTileCoord(tileCoord));
  let size = TILE_SIZE * 1.5;

  let image = TextureMap[unit.unitName] || IMG_SOLDIER0;

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
  }

  for (const [unitCoord, unit] of room.state.units) {
    drawUnitFromMap(unitCoord, unit);
  }
}

function renderHUD() {
  let thisPlayer = room.state.players.get(room.sessionId);
  if (!thisPlayer) {
    return;
  }
  if (room.state.gameStarted) {
    readyButton.style.display = "none";
  } else if (thisPlayer.readyToStart) {
    readyButton.innerText = "Waiting for other players...";
    readyButton.style.display = "inline-block";
    readyButton.style.disabled = true;
  } else {
    readyButton.innerText = "Ready to Start!";
    readyButton.style.display = "inline-block";
    readyButton.style.disabled = false;
  }
}

function render() {
  renderCanvas();
  renderHUD();
}

function axialRound([q, r]) {
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

function getUnitInTile([q, r]) {
  return room.state.units.get(q + "," + r);
}

function tileExists([q, r]) {
  return room.state.tiles.get(q + "," + r);
}

function canvasClicked(event) {
  let x = event.offsetX - MAP_SHIFT_X;
  let y = event.offsetY - MAP_SHIFT_Y;

  let q = x / HORIZONTAL_UNIT;
  let r = -x / (3.0 * TILE_SIZE) + y / VERTICAL_UNIT;

  [q, r] = axialRound([q, r]);

  let unit = getUnitInTile([q, r]);

  if (unit && unit.moveRange > 0 && !isMovingUnit) {
    isMovingUnit = true;
    moveSource = [q, r];
    possibleMoveTiles = getPossibleMoveTiles(unit.moveRange, tileExists);
    render();
  } else if (isMovingUnit) {
    isMovingUnit = false;
    if (moveSource[0] != q || moveSource[1] != r) {
      room.send("move", [moveSource, [q, r]]);
    }
    render();
  }
}

const readyButton = document.getElementById("ready-button");
readyButton.addEventListener("click", () => room.send("readyToStart"));

console.log("creating client");
const client = new Colyseus.Client("ws://localhost:3000");

let room;
const cachedReconnectionToken =
  window.localStorage.getItem("reconnectionToken");

let joinedRoom = false;

if (cachedReconnectionToken) {
  try {
    room = await client.reconnect(cachedReconnectionToken);
    console.log("reconnected successfully", room);
    joinedRoom = true;
  } catch (e) {
    console.log("server probably died, joining room normally");
  }
}

if (!joinedRoom) {
  room = await client.joinOrCreate("game");
  console.log("joined successfully", room);
}
window.localStorage.setItem("reconnectionToken", room.reconnectionToken);

room.state.listen("generation", () => {
  render();
});

/*
All image sources: https://github.com/yiotro/Antiyoy/tree/master/assets/field_elements

- click on tower -> show shields (client side only)

-Start mutliplayer features
  - fake second player territory for tiles with different ownership
  - move only your own units
  - capture empty tiles are border

- player HUD
  - income, money, provinces
  - purchase buttons

- house keeping
  - constants and helper functions in their own file.
  - pull out rendering functions


- multiple players generate UUIDs
*/
