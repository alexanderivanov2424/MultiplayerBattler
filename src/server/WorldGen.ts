const GRID_Q_START = -12;
const GRID_Q_SIZE = 24;

const GRID_R_START = -10;
const GRID_R_SIZE = 21;

export function generateMap() {
  let tileGrid = makeEmptyGrid(GRID_Q_SIZE, GRID_R_SIZE);

  // addNoise(tileGrid, 0.8, false);

  // stepAutomata(tileGrid, 5);

  // addNoise(tileGrid, 0.5, true);
  // addNoise(tileGrid, 0.3, false);

  // stepAutomata(tileGrid, 10);
  //addNoise(tileGrid, 0.1, true);
  addBlobs(tileGrid, 15, 4);
  stepAutomata(tileGrid, 3);

  return convertGridtoCoords(tileGrid);
}

function makeEmptyGrid(qSize: number, rSize: number) {
  let tileGrid: number[][] = [];
  for (let i = 0; i < qSize + 1; i++) {
    tileGrid.push([]);
    for (let j = 0; j < rSize + 1; j++) {
      tileGrid[i].push(0);
    }
  }
  return tileGrid;
}

function addNoise(grid: number[][], ratio: number, cut: boolean) {
  for (let i = 0; i < grid.length; i++) {
    for (let j = 0; j < grid[0].length; j++) {
      grid[i][j] = Math.random() > ratio ? Number(!cut) : Number(cut);
    }
  }
}

function addBlobs(grid: number[][], num: number, size: number) {
  for (let i = 0; i < num; i++) {
    addBlob(grid, size);
  }
}

function addBlob(grid: number[][], size: number) {
  let shift_i = Math.random() * grid.length;
  let shift_j = Math.random() * grid[0].length;

  let inset = 3;

  let center_i = Math.random() * (grid.length - inset * 2) + inset;
  let center_j = Math.random() * (grid[0].length - inset * 2) + inset;

  let fall_off = 4;

  for (let i = 0; i < grid.length; i++) {
    for (let j = 0; j < grid[0].length; j++) {
      if (grid[i][j] === 1) {
        continue;
      }
      //distance to center of blob
      let distance_to_center = Math.sqrt(
        (i - center_i) * (i - center_i) + (j - center_j) * (j - center_j)
      );
      distance_to_center = Math.min(
        Math.max(size + fall_off - distance_to_center, 0),
        fall_off
      );

      //distance to edge
      let distance_to_edge = Math.min(
        i,
        grid.length - i - 1,
        j,
        grid[0].length - j - 1,
        fall_off
      );

      let v =
        0.25 * Math.cos((i + shift_i) / 1) +
        0.25 * Math.sin((j + shift_j) / 1) +
        0.5;

      v *= distance_to_center / fall_off;
      v *= distance_to_edge / fall_off;

      grid[i][j] = v > 0.5 ? 1 : 0;
    }
  }
}

function getValueSafe(grid: number[][], q: number, r: number, d: number) {
  if (q < 0 || q >= grid.length || r < 0 || r >= grid[0].length) {
    return d;
  }
  return grid[q][r];
}

function getNeighborsOffsets(distance: number) {
  let neighbors: number[] = [];
  //TODO actually implement this (not trivial)
  // need this for more customizable stepAutomata func
  return neighbors;
}

function stepAutomata(grid: number[][], steps: number) {
  const neighbors = [
    [-1, 0],
    [-1, 1],
    [0, 1],
    [1, 0],
    [1, -1],
    [0, -1],
  ];
  for (let step = 0; step < steps; step++) {
    let grid_next = makeEmptyGrid(grid.length, grid[0].length);

    for (let i = 0; i < grid.length; i++) {
      for (let j = 0; j < grid[0].length; j++) {
        let count = 0;
        for (let [i_shift, j_shift] of neighbors) {
          count += getValueSafe(grid, i + i_shift, j + j_shift, 0.0);
        }
        if (grid_next[i][j] === 1 && count < 2) {
          grid_next[i][j] = 0;
        }
        if (grid_next[i][j] === 0 && count > 4) {
          grid_next[i][j] = 1;
        }
      }
    }

    grid = grid_next;
  }
}

function convertGridtoCoords(grid: number[][]) {
  let tiles: [number, number][] = [];
  for (let i = 0; i < grid.length; i++) {
    for (let j = 0; j < grid[0].length; j++) {
      if (grid[i][j] === 0) {
        continue;
      }
      let q = i + GRID_Q_START;
      let r = j + GRID_R_START + getGridRShift(q);
      tiles.push([q, r]);
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
