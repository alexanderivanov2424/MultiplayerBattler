const HEX_NEIGHBORS = [
  [1, 0],
  [-1, 0],
  [0, 1],
  [0, -1],
  [1, -1],
  [-1, 1],
];

export function getDistance(tiles, src, dest, max_distance) {
  let checkedTiles = new Set();

  let tilesToCheck = [];
  let nextTilesToCheck = [src];

  let distance = 0;

  while (nextTilesToCheck.length > 0) {
    tilesToCheck = nextTilesToCheck;
    nextTilesToCheck = [];
    distance++;

    if (distance > max_distance) {
      return -1;
    }

    for (let [q, r] of tilesToCheck) {
      checkedTiles.add(q + "," + r);
      for (let [shift_q, shift_r] of HEX_NEIGHBORS) {
        let new_q = q + shift_q;
        let new_r = r + shift_r;
        if (checkedTiles.has(new_q + "," + new_r)) {
          continue;
        }
        if (!tileExists(tiles, [new_q, new_r])) {
          continue;
        }
        if (new_q === dest[0] && new_r === dest[1]) {
          return distance;
        }
        nextTilesToCheck.push([new_q, new_r]);
      }
    }
  }

  return -1;
}

export function tileExists(tiles, [q, r]) {
  return tiles.get(q + "," + r);
}

export function getPossibleMoveTiles(tiles, moveSource, moveRange) {
  let possibleMoveTiles = new Set();

  let neighbors = [];
  let next_neighbors = [moveSource];
  let distance = moveRange;

  while (distance >= 0) {
    neighbors = next_neighbors;
    next_neighbors = [];

    for (let [q, r] of neighbors) {
      possibleMoveTiles.add(q + "," + r);
      for (let [shift_q, shift_r] of HEX_NEIGHBORS) {
        let new_q = q + shift_q;
        let new_r = r + shift_r;
        if (possibleMoveTiles.has(new_q + "," + new_r)) {
          continue;
        }
        if (!tileExists(tiles, [new_q, new_r])) {
          continue;
        }
        next_neighbors.push([new_q, new_r]);
      }
    }
    distance--;
  }

  return possibleMoveTiles;
}
