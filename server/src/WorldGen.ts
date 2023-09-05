const GRID_Q_START = -12;
const GRID_Q_SIZE = 24;

const GRID_R_START = -10;
const GRID_R_SIZE = 21;

export function generateMap() {
  let tileGrid = makeEmptyGrid();

  //TODO actual gen code

  return convertGridtoCoords(tileGrid);
}

function makeEmptyGrid() {
  let tileGrid: number[][] = [];
  for (let i = 0; i < GRID_Q_SIZE + 1; i++) {
    tileGrid.push([]);
    for (let j = 0; j < GRID_R_SIZE + 1; j++) {
      tileGrid[i].push(1);
    }
  }
  return tileGrid;
}

function convertGridtoCoords(grid: number[][]) {
  let tiles = [];
  for (let i = 0; i < grid.length; i++) {
    for (let j = 0; j < grid[0].length; j++) {
      if (grid[i][j] === 0) {
        continue;
      }
      let q = i + GRID_Q_START;
      let r = j + GRID_R_START + getGridRShift(q);
      tiles.push(q + "," + r);
    }
  }
  return tiles;
}

function getGridRShift(q: number) {
  return -Math.round(q / 2);
}

export function getRandomCoord() {
  let q = Math.floor(Math.random() * (GRID_Q_SIZE + 1)) + GRID_Q_START;
  let r =
    Math.floor(Math.random() * (GRID_R_SIZE + 1)) +
    GRID_R_START +
    getGridRShift(q);
  return [q, r];
}
