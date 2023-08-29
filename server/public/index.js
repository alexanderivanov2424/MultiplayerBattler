console.log("creating client");
const client = new Colyseus.Client("ws://localhost:3000");
const room = await client.joinOrCreate("game");

room.state.listen("tiles", (currentValue, previousValue) => {
  console.log(`currentTurn is now ${currentValue}`);
  console.log(`previous value was: ${previousValue}`);
});

const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

const zoomInButton = document.getElementById("zoom-in");
const zoomOutButton = document.getElementById("zoom-out");
const resetButton = document.getElementById("reset");
const rangeInput = document.getElementById("range");

const panzoom = Panzoom(canvas, { canvas: true, contain: "inside" });
zoomInButton.addEventListener("click", panzoom.zoomIn);
zoomOutButton.addEventListener("click", panzoom.zoomOut);
resetButton.addEventListener("click", panzoom.reset);
rangeInput.addEventListener("input", (event) => {
  panzoom.zoom(event.target.valueAsNumber);
});

//canvas.width = window.innerWidth;
//canvas.height = window.innerHeight;
//window.addEventListener("resize", (event) => {
//  canvas.width = window.innerWidth;
//  canvas.height = window.innerHeight;
//  drawHexagon(0, 0, "#000000", "#ff00ff");
//  drawHexagon(100, 50, "#000000", "#ff0000");
//});

const TILE_SIZE = 50; // distance from hexagon center to vertices

const HORIZONTAL_UNIT = 1.5 * TILE_SIZE;
const VERTICAL_UNIT = Math.sqrt(3) * TILE_SIZE;

const EDGES = 6;
const ANGLE = (2 * Math.PI) / EDGES;
const VERTICES = []; // precompute flat top hex vertices
for (let i = 0; i < EDGES; i++) {
  VERTICES.push([
    TILE_SIZE * Math.cos(i * ANGLE),
    TILE_SIZE * Math.sin(i * ANGLE),
  ]);
}

const radius = 20;

function drawHexagon(x, y, borderColor, fillColor) {
  ctx.beginPath();
  for (let i = 0; i < VERTICES.length; i++) {
    let xx = x + VERTICES[i][0];
    let yy = y + VERTICES[i][1];
    ctx.lineTo(xx, yy);
  }
  ctx.closePath();

  ctx.strokeStyle = borderColor;
  ctx.stroke();

  ctx.fillStyle = fillColor;
  ctx.fill();
}

drawHexagon(0, 0, "#000000", "#ff00ff");
drawHexagon(100, 50, "#000000", "#ff0000");

let moved;
let downListener = (event) => {
  moved = false;
  console.log(event.pageX + "  " + event.pageY);
};

let moveListener = () => {
  moved = true;
};

let upListener = () => {
  if (moved) {
    console.log("moved");
  } else {
    console.log("not moved");
  }
};

canvas.addEventListener("mousedown", downListener);
canvas.addEventListener("mousemove", moveListener);
canvas.addEventListener("mouseup", upListener);

// // release memory
// element.removeEventListener("mousedown", downListener);
// element.removeEventListener("mousemove", moveListener);
// element.removeEventListener("mouseup", upListener);
