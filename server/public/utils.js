const HEX_NEIGHBORS = [
  [1, 0],
  [-1, 0],
  [0, 1],
  [0, -1],
  [1, -1],
  [-1, 1],
];

const MAX_LEVEL = 4;

export function captureTile(tiles, tileCoord, playerId) {
  tiles.get(tileCoord).ownerId = playerId;
}

export function tileExists(tiles, tileCoord) {
  return tiles.get(tileCoord);
}

function* getNeighbors(tiles, [q, r]) {
  for (const [shift_q, shift_r] of HEX_NEIGHBORS) {
    const new_q = q + shift_q;
    const new_r = r + shift_r;
    if (tileExists(tiles, new_q + "," + new_r)) {
      yield [new_q, new_r];
    }
  }
}

export function getTilesInMoveRange(tiles, moveSource, unit) {
  let tilesInMoveRange = new Set();

  let neighbors = [];
  let next_neighbors = [moveSource];
  let distance = unit.moveRange;

  while (distance >= 0) {
    neighbors = next_neighbors;
    next_neighbors = [];

    for (let [q, r] of neighbors) {
      tilesInMoveRange.add(q + "," + r);
      if (tiles.get(q + "," + r).ownerId !== unit.ownerId) {
        continue;
      }
      for (const [new_q, new_r] of getNeighbors(tiles, [q, r])) {
        if (tilesInMoveRange.has(new_q + "," + new_r)) {
          continue;
        }
        next_neighbors.push([new_q, new_r]);
      }
    }
    distance--;
  }

  return tilesInMoveRange;
}

function isCapturable(units, unit, destTile) {
  return [moveDest, ...getNeighbors(units, moveDest)].every(([q, r]) => {
    const defendingUnit = units.get(q + "," + r);
    return (
      moveDest.ownerId === unit.ownerId && // you can't take your own units
      moveDest.ownerId !== defendingUnit.ownerId && //
      (unit.level === MAX_LEVEL || unit.level > defendingUnit.level)
    );
  });
}

export function getValidMoveTiles(tiles, units, moveSource, unit) {
  const validMoveTiles = getTilesInMoveRange(tiles, moveSource, unit);
  for (const moveDest of validMoveTiles) {
    if (!isCapturable()) {
      validMoveTiles.delete(moveDest);
    }
  }
  return validMoveTiles;
}
