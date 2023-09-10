// clockwise order
const HEX_NEIGHBORS = [
  [1, 0],
  [0, 1],
  [-1, 1],
  [-1, 0],
  [0, -1],
  [1, -1],
];

const MAX_LEVEL = 4;

export function hexToTileCoord([q, r]) {
  return q + "," + r;
}

export function parseTileCoord(tileCoord) {
  let [q, r] = tileCoord.split(",");
  q = Number(q);
  r = Number(r);
  return [q, r];
}

export function captureTile(
  tiles,
  srcProvinceName,
  playerProvinces,
  [q, r],
  playerId
) {
  const tileCoord = hexToTileCoord([q, r]);
  const tile = tiles.get(tileCoord);
  if (!tile) {
    return;
  }
  removeTileFromProvince();
  addTileToProvince();
  // TODO: split provinces of the previous owner if necessary
}

// Check 6 neighbors of [q,r] and return any members of collection that are there.
export function* getHexNeighbors(collection, [q, r]) {
  for (const [shift_q, shift_r] of HEX_NEIGHBORS) {
    const new_q = q + shift_q;
    const new_r = r + shift_r;
    if (collection.get(new_q + "," + new_r)) {
      yield [new_q, new_r];
    }
  }
}

export function* getNeighbors(collection, [q, r]) {
  for (const [shift_q, shift_r] of HEX_NEIGHBORS) {
    const new_q = q + shift_q;
    const new_r = r + shift_r;
    const neighbor = collection.get(new_q + "," + new_r);
    if (neighbor) {
      yield neighbor;
    }
  }
}

function getTilesInMoveRange(tiles, moveSource, unit) {
  let tileCoordsInMoveRange = new Set();
  let tilesInMoveRange = [];

  let neighbors = [];
  let next_neighbors = [moveSource];
  let distance = unit.moveRange;

  while (distance >= 0) {
    neighbors = next_neighbors;
    next_neighbors = [];

    for (let [q, r] of neighbors) {
      tileCoordsInMoveRange.add(q + "," + r);
      tilesInMoveRange.push([q, r]);
      // We don't add neighbors for a tile that we don't own.
      // You can only move 1 tile outside of your own teritory.
      if (tiles.get(q + "," + r).ownerId !== unit.ownerId) {
        continue;
      }
      for (const [new_q, new_r] of getHexNeighbors(tiles, [q, r])) {
        if (tileCoordsInMoveRange.has(new_q + "," + new_r)) {
          continue;
        }
        next_neighbors.push([new_q, new_r]);
      }
    }
    distance--;
  }

  return tilesInMoveRange;
}

function isValidMoveTile(tiles, units, unit, moveDest) {
  const destTileCoord = moveDest[0] + "," + moveDest[1];
  const destTile = tiles.get(destTileCoord);
  if (!destTile) {
    return false;
  }
  if (destTile.ownerId === unit.ownerId) {
    //TODO combine units
    return !units.get(destTileCoord);
  }
  return [moveDest, ...getHexNeighbors(units, moveDest)].every(([q, r]) => {
    const defendingUnit = units.get(q + "," + r);
    return (
      !defendingUnit ||
      destTile.ownerId !== defendingUnit.ownerId ||
      unit.level === MAX_LEVEL ||
      unit.level > defendingUnit.level
    );
  });
}

export function getValidMoveTiles(tiles, units, moveSource, unit) {
  const validMoveTiles = getTilesInMoveRange(tiles, moveSource, unit).filter(
    (moveDest) => isValidMoveTile(tiles, units, unit, moveDest)
  );
  let validMoveTileCoords = new Set();
  for (const [q, r] of validMoveTiles) {
    validMoveTileCoords.add(q + "," + r);
  }
  return validMoveTileCoords;
}

export function getProvinceSizeAtTile(tiles, [q, r]) {
  return getAllConnectedTiles(tiles, [q, r]).length;
}

export function getAllConnectedTilesByProvince(tiles, [q, r]) {
  return [];
}
