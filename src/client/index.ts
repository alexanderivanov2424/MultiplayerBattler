import { type Room, Client } from "colyseus.js";
import Panzoom from "@panzoom/panzoom";

import { Board } from "server/rooms/schema/Board";
import { type Tile, TileMap } from "server/rooms/schema/Tile";
import { type Unit, UnitType, getUnitData } from "server/rooms/schema/Unit";
import type { Player } from "server/rooms/schema/Player";
import type { Province } from "server/rooms/schema/Province";

import * as utils from "common/utils";
import { AxialCoords } from "common/utils";

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
  ["#ffff60", "#cccc40"],
  ["#60ffff", "#40cccc"],
  ["#ff60ff", "#cc40cc"],
];

const IMG_SOLDIER1 = document.getElementById("soldier1") as HTMLImageElement;
const IMG_SOLDIER2 = document.getElementById("soldier2") as HTMLImageElement;
const IMG_SOLDIER3 = document.getElementById("soldier3") as HTMLImageElement;
const IMG_SOLDIER4 = document.getElementById("soldier4") as HTMLImageElement;
const IMG_FARM = document.getElementById("farm") as HTMLImageElement;
const IMG_TOWER2 = document.getElementById("tower2") as HTMLImageElement;
const IMG_TOWER3 = document.getElementById("tower3") as HTMLImageElement;
const IMG_PINE = document.getElementById("pine") as HTMLImageElement;

const TextureMap: Partial<Record<UnitType, HTMLImageElement>> = {
  [UnitType.Soldier1]: IMG_SOLDIER1,
  [UnitType.Soldier2]: IMG_SOLDIER2,
  [UnitType.Soldier3]: IMG_SOLDIER3,
  [UnitType.Soldier4]: IMG_SOLDIER4,
  [UnitType.Farm]: IMG_FARM,
  [UnitType.Tower2]: IMG_TOWER2,
  [UnitType.Tower3]: IMG_TOWER3,
  [UnitType.Pine]: IMG_PINE,
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
let src: Tile;
let selectedProvince: Province;
let selectedUnitType: UnitType;
let purchaseMode: boolean = false;
let possibleMoves = new Set();

// ################################

function drawHexagon(
  x: number,
  y: number,
  borderColor: string,
  fillColor: string
) {
  ctx.beginPath();
  for (let i = 0; i < VERTICES.length; i++) {
    const xx = x + VERTICES[i][0] + MAP_SHIFT_X;
    const yy = y + VERTICES[i][1] + MAP_SHIFT_Y;

    ctx.lineTo(xx, yy);
  }
  ctx.closePath();

  ctx.lineWidth = 3;
  ctx.strokeStyle = borderColor;
  ctx.stroke();

  ctx.fillStyle = fillColor;
  ctx.fill();
}

function hexToPixelCoord([q, r]: AxialCoords) {
  const x = HORIZONTAL_UNIT * q;
  const y = VERTICAL_UNIT * (q / 2 + r);
  return [x, y];
}

function drawTileFromMap(tile: Tile) {
  const [x, y] = hexToPixelCoord(tile.coord);
  const [color, shadedColor] =
    PLAYER_TILE_COLORS[room.state.players.get(tile.ownerId)?.playerNumber] ||
    NEUTRAL_TILE_COLORS;
  const fillColor =
    (src || purchaseMode) && !possibleMoves.has(tile) ? shadedColor : color;
  drawHexagon(x, y, TILE_BORDER, fillColor);
}

function drawUnitFromMap(tile: Tile, unit: Unit) {
  const [x, y] = hexToPixelCoord(tile.coord);
  const size = TILE_SIZE * 1.5;

  const image = TextureMap[unit.type] || IMG_SOLDIER1;

  ctx.drawImage(
    image,
    x - size / 2 + MAP_SHIFT_X,
    y - size / 2 + MAP_SHIFT_Y,
    size,
    size
  );
}

function drawHexHighlightInDirection(tile: Tile, direction: AxialCoords) {
  const [x, y] = hexToPixelCoord(tile.coord);
  const [x_d, y_d] = hexToPixelCoord([
    tile.coord[0] + direction[0],
    tile.coord[1] + direction[1],
  ]);

  const perp = [y - y_d, x_d - x];
  const scale = TILE_SIZE / VERTICAL_UNIT;
  const A = [
    0.5 * (x_d + x - perp[0] * scale),
    0.5 * (y_d + y - perp[1] * scale),
  ];
  const B = [
    0.5 * (x_d + x + perp[0] * scale),
    0.5 * (y_d + y + perp[1] * scale),
  ];

  ctx.beginPath();
  ctx.lineTo(A[0] + MAP_SHIFT_X, A[1] + MAP_SHIFT_Y);
  ctx.lineTo(B[0] + MAP_SHIFT_X, B[1] + MAP_SHIFT_Y);
  ctx.closePath();

  ctx.lineWidth = 10;
  ctx.strokeStyle = "rgba(0, 0, 0, 0.5)";
  ctx.stroke();
}

function getProvincePerimiter(tiles: TileMap) {
  const sides: [Tile, AxialCoords][] = [];

  for (const tile of tiles) {
    for (const [shift_q, shift_r] of utils.HEX_NEIGHBORS) {
      // check each direction in order until we find a tile
      if (!tiles.get([tile.coord[0] + shift_q, tile.coord[1] + shift_r])) {
        sides.push([tile, [shift_q, shift_r]]);
      }
    }
  }
  return sides;
}

function getProvinceSinglePerimiter(tiles: TileMap) {
  //TODO rethink how to find the correct single outer perimiter
  let checkTile = tiles.getATile();
  let checkDirection = 0;

  let direction = utils.HEX_NEIGHBORS[checkDirection];
  let nextTile: Tile;

  let [q, r] = checkTile.coord;

  while ((nextTile = tiles.get([q + direction[0], r + direction[1]]))) {
    checkTile = nextTile;
    [q, r] = checkTile.coord;
  }

  const startTile = checkTile; // first tile on province perimiter

  let sides: [Tile, AxialCoords][] = [];

  do {
    for (let i = 0; i < 6; i++) {
      // check each direction in order until we find a tile
      [q, r] = utils.HEX_NEIGHBORS[(checkDirection + i + 6) % 6];
      let tile = tiles.get([checkTile.coord[0] + q, checkTile.coord[1] + r]);
      if (tile) {
        // found valid tile, start checking its edges next
        checkTile = tile;
        checkDirection = (checkDirection + i - 2 + 6) % 6;
        break;
      } else {
        // found an edge for the provice, save it
        sides.push([checkTile, [q, r]]);
      }
    }
  } while (checkTile !== startTile);

  return sides;
}

function renderProvincePerimiter(tiles: TileMap) {
  let sides: [Tile, AxialCoords][] = getProvincePerimiter(tiles);
  for (let [tile, direction] of sides) {
    drawHexHighlightInDirection(tile, direction);
  }
}

function renderCanvas() {
  for (const tile of room.state.tiles) {
    drawTileFromMap(tile);
    if (tile.unit) {
      drawUnitFromMap(tile, tile.unit);
    }
  }

  if (selectedProvince) {
    renderProvincePerimiter(selectedProvince.tiles);
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

  if (room.state.gameStarted && isPlayersTurn() && selectedProvince) {
    purchaseButton.style.display = "inline-block";
    if (!purchaseMode) {
      purchaseButton.textContent = "Purchase";
      unitMenu.classList.add("hidden");
    }
    if (selectedUnitType) {
      unitForPurchase.classList.remove("hidden");
      unitForPurchase.src = TextureMap[selectedUnitType].src;
    } else {
      unitForPurchase.classList.add("hidden");
    }
    for (let i = 0; i < unitMenu.children.length; i++) {
      const unitMenuItem = unitMenu.children.item(i) as HTMLElement;
      if (i === selectedUnitType - 1) {
        unitMenuItem.style.border =
          "5px solid " + PLAYER_TILE_COLORS[thisPlayer.playerNumber][0];
      } else {
        unitMenuItem.style.border = "none";
      }
    }
  } else {
    purchaseButton.style.display = "none";
    unitMenu.classList.add("hidden");
    unitForPurchase.classList.add("hidden");
  }

  // Funds
  if (room.state.gameStarted && selectedProvince) {
    fundsDiv.style.display = "block";
    //TODO render negative correctly
    incomeSpan.textContent = `$${selectedProvince.income} |`;
    moneySpan.textContent = `$${selectedProvince.money}`;
  } else {
    fundsDiv.style.display = "none";
  }

  renderPlayerList();
}

function render() {
  ctx.clearRect(0, 0, MAP_SIZE_X, MAP_SIZE_Y);
  thisPlayer = room.state.players.get(room.sessionId);
  renderHUD();
  renderCanvas();
  thisPlayer?.provinces?.forEach((province, name) => {
    console.log(
      `Province ${name} Income: ${province.income} Money ${province.money}`
    );
  });
}

function axialRound([q, r]: AxialCoords): AxialCoords {
  const s = -q - r; // convert to cube coords

  let q_i = Math.round(q);
  let r_i = Math.round(r);
  let s_i = Math.round(s);

  const q_diff = Math.abs(q_i - q);
  const r_diff = Math.abs(r_i - r);
  const s_diff = Math.abs(s_i - s);

  if (q_diff > r_diff && q_diff > s_diff) {
    q_i = -r_i - s_i;
  } else if (r_diff > s_diff) {
    r_i = -q_i - s_i;
  }
  // in cube version also calc s_i

  return [0 + q_i, 0 + r_i];
}

function canvasClicked(event: MouseEvent) {
  UpdateServerWithPlayerName();
  if (!isPlayersTurn()) {
    return;
  }
  const x = event.offsetX - MAP_SHIFT_X;
  const y = event.offsetY - MAP_SHIFT_Y;

  const q = x / HORIZONTAL_UNIT;
  const r = -x / (3.0 * TILE_SIZE) + y / VERTICAL_UNIT;

  const tile = room.state.tiles.get(axialRound([q, r]));
  const unit = tile?.unit;

  if (src) {
    if (tile && tile !== src) {
      room.send("move", [src.coord, tile.coord]);
    }
    src = null;
  } else if (purchaseMode && selectedUnitType) {
    // TODO: highlight valid purchased
    if (tile) {
      room.send("purchase", [
        selectedProvince.name,
        tile.coord,
        selectedUnitType,
      ]);
    }
    // TODO: update possibleMoves after purchase
    if (!possibleMoves.has(tile)) {
      purchaseMode = false;
    }
  } else if (tile && tile.ownerId === thisPlayer.playerId) {
    selectedProvince = thisPlayer.provinces.get(tile.provinceName);
    purchaseMode = false;
    selectedUnitType = UnitType.None;
    if (unit && unit.moveRange > 0) {
      src = tile;
      possibleMoves = utils.getValidMoves(room.state.tiles, src);
    }
  } else {
    src = null;
    selectedProvince = null;
    purchaseMode = false;
  }
  render();
}

function isPlayersTurn() {
  return room.state.currentPlayerNumber === thisPlayer.playerNumber;
}

const readyButton = document.getElementById("ready") as HTMLButtonElement;
const endTurnButton = document.getElementById("end-turn") as HTMLButtonElement;
const purchaseButton = document.getElementById("purchase") as HTMLButtonElement;
const unitForPurchase = document.getElementById(
  "unit-for-purchase-img"
) as HTMLImageElement;
const playerList = document.getElementById("player-list") as HTMLDivElement;
const fundsDiv = document.getElementById("funds") as HTMLDivElement;
const incomeSpan = document.getElementById("income") as HTMLSpanElement;
const moneySpan = document.getElementById("money") as HTMLSpanElement;

const unitMenu = document.getElementsByClassName("unit-menu")[0];

readyButton.addEventListener("click", () => room.send("readyToStart"));
endTurnButton.addEventListener("click", () => {
  if (!src) {
    room.send("endTurn");
  }
});
purchaseButton.addEventListener("click", () => {
  if (selectedProvince) {
    if (!purchaseMode) {
      purchaseMode = true;
    }
    if (unitMenu.classList.contains("hidden")) {
      unitMenu.classList.remove("hidden");
      purchaseButton.textContent = "Hide Units";
    } else {
      unitMenu.classList.add("hidden");
      purchaseButton.textContent = "Show Units";
    }
  }
});
unitForPurchase.addEventListener("click", () => {
  selectedUnitType = UnitType.None;
});
function getUnitMenuItemClickedCallback(unitType: UnitType) {
  return () => {
    if (selectedProvince) {
      selectedUnitType = unitType;

      src = null;
      possibleMoves = selectedProvince.tiles.tileSet();
      for (const [tile, [shift_q, shift_r]] of getProvincePerimiter(
        selectedProvince.tiles
      )) {
        const neighborTile = room.state.tiles.get([
          tile.coord[0] + shift_q,
          tile.coord[1] + shift_r,
        ]);
        if (
          neighborTile &&
          utils.isValidMove(
            room.state.tiles,
            thisPlayer.playerId,
            getUnitData(selectedUnitType),
            neighborTile
          )
        ) {
          possibleMoves.add(neighborTile);
        }
      }
      renderHUD();
      renderCanvas();
    }
  };
}

function renderPlayerList() {
  while (playerList.firstChild) {
    playerList.removeChild(playerList.firstChild);
  }

  for (const [_, player] of room.state.players) {
    createPlayerItem(player);
  }
}

function createPlayerItem(player: Player) {
  const isThisPlayer = player === thisPlayer;
  const playerItem = document.createElement("div");
  playerItem.innerHTML = `
    <div class="player-item">
      <div class="player-color" style="background-color: ${PLAYER_TILE_COLORS[player.playerNumber][0]
    };"> </div>
      <div ${isThisPlayer ? 'id="this-player-name" ' : ""}>${player.name}</div>
    </div>
  `;

  playerList.appendChild(playerItem);

  if (isThisPlayer) {
    const playerName = document.getElementById("this-player-name");
    playerName.contentEditable = "true";
    playerName.classList.add("contenteditable");
    playerName.addEventListener("click", () => {
      playerName.focus();
    });
  }
}

function UpdateServerWithPlayerName() {
  let newName = document.getElementById("this-player-name").innerText;
  if (thisPlayer.name !== newName) {
    room.send("updateName", newName);
  }
  (document.activeElement as HTMLInputElement).blur();
}

for (const unitType of Board.PurchasableUnits) {
  const unitMenuItem = document.createElement("div");
  unitMenuItem.classList.add("unit-menu-item");
  unitMenuItem.id = "unit-menu-item-" + unitType;
  const unitImg = document.createElement("img");
  unitImg.src = TextureMap[unitType].src;
  unitMenuItem.appendChild(unitImg);
  const unitCost = document.createElement("div");
  unitCost.textContent = "$" + getUnitData(unitType).cost;
  unitMenuItem.appendChild(unitCost);
  unitMenuItem.addEventListener(
    "click",
    getUnitMenuItemClickedCallback(unitType)
  );
  unitMenu.appendChild(unitMenuItem);
}

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
