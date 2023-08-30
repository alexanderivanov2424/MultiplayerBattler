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

function drawHexagon(x, y, borderColor, fillColor) {
  ctx.beginPath();
  for (let i = 0; i < VERTICES.length; i++) {
    let xx = x + VERTICES[i][0] + MAP_SHIFT_X;
    let yy = y + VERTICES[i][1] + MAP_SHIFT_Y;

    ctx.lineTo(xx, yy);
  }
  ctx.closePath();

  ctx.strokeStyle = borderColor;
  ctx.stroke();

  ctx.fillStyle = fillColor;
  ctx.fill();
}

function drawTileFromMap(tileCoord, tile) {
  let [q, r] = tileCoord.split(",");
  // TODO check that q and r are ints
  q = Number(q);
  r = Number(r);
  let x = HORIZONTAL_UNIT * q;
  let y = VERTICAL_UNIT * (q / 2 + r);
  drawHexagon(x, y, "#000000", "#ff6060");
}

function render() {
  console.log(room.state.tiles);
  for (const [tileCoord, tile] of room.state.tiles) {
    drawTileFromMap(tileCoord, tile);
  }

  // drawHexagon(0, 0, "#000000", "#ff00ff");
  // drawHexagon(100, 50, "#000000", "#ff0000");

  // drawHexagon(300, 300, "#000000", "#ff0000");

  // drawHexagon(900, 300, "#000000", "#ff0000");
  // drawHexagon(300, 900, "#000000", "#ff0000");
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

function canvasClicked(event) {
  let x = event.offsetX - MAP_SHIFT_X;
  let y = event.offsetY - MAP_SHIFT_Y;

  let q = x / HORIZONTAL_UNIT;
  let r = -x / (3.0 * TILE_SIZE) + y / VERTICAL_UNIT;

  [q, r] = axialRound([q, r]);
  console.log(q, r);
}

console.log("creating client");
const client = new Colyseus.Client("ws://localhost:3000");
const room = await client.joinOrCreate("game");

render();

room.state.listen("tiles", (currentValue, previousValue) => {
  //console.log(`currentTurn is now ${currentValue}`);
  //console.log(`previous value was: ${previousValue}`);
  render();
});

/*
 - level generation (simple for now, just a rect)
 - click detection on tiles
 - units to draw on tiles (temp units for now)




*/
