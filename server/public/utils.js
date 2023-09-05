const HEX_NEIGHBORS = [
  [1, 0],
  [-1, 0],
  [0, 1],
  [0, -1],
  [1, -1],
  [-1, 1],
];

const MAX_LEVEL = 4;

export function hexToTileCoord([q, r]) {
  return q + "," + r;
}

export function captureTile(tiles, [q, r], playerId) {
  const tile = tiles.get(hexToTileCoord([q, r]));
  if (!tile) {
    return;
  }
  tile.ownerId = playerId;
}

// Check 6 neighbors of [q,r] and return any members of collection that are there.
function* getNeighbors(collection, [q, r]) {
  for (const [shift_q, shift_r] of HEX_NEIGHBORS) {
    const new_q = q + shift_q;
    const new_r = r + shift_r;
    if (collection.get(new_q + "," + new_r)) {
      yield [new_q, new_r];
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
      for (const [new_q, new_r] of getNeighbors(tiles, [q, r])) {
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
  const destTile = tiles.get(moveDest[0] + "," + moveDest[1]);
  if (!destTile) {
    return false;
  }
  if (destTile.ownerId === unit.ownerId) {
    //TODO combine units
    return !units.get(moveDest);
  }
  return [moveDest, ...getNeighbors(units, moveDest)].every(([q, r]) => {
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
