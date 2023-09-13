import { Tile, TileMap } from "server/rooms/schema/Tile";

export type AxialCoords = [q: number, r: number];
export type TileCoord = `${number},${number}`;

// clockwise order
export const HEX_NEIGHBORS = [
  [1, 0],
  [0, 1],
  [-1, 1],
  [-1, 0],
  [0, -1],
  [1, -1],
];

const MAX_LEVEL = 4;

export function hexToTileCoord([q, r]: AxialCoords): TileCoord {
  return `${q},${r}`;
}

export function parseTileCoord(tileCoord: TileCoord): AxialCoords {
  let [q, r] = tileCoord.split(",");
  return [Number(q), Number(r)];
}

function getMovesInRange(tiles: TileMap, src: Tile) {
  let tilesInMoveRange: Set<Tile> = new Set();

  let frontier = [];
  let next_neighbors = [src];
  let distance = src.unit.moveRange;

  while (distance >= 0) {
    frontier = next_neighbors;
    next_neighbors = [];

    for (const tile of frontier) {
      tilesInMoveRange.add(tile);
      // We don't add neighbors for a tile that we don't own.
      // You can only move 1 tile outside of your own teritory.
      if (tile.ownerId !== src.ownerId) {
        continue;
      }
      for (const neighbor of tiles.neighbors(tile)) {
        if (tilesInMoveRange.has(neighbor)) {
          continue;
        }
        next_neighbors.push(neighbor);
      }
    }
    distance--;
  }

  return tilesInMoveRange;
}

function isValidMove(tiles: TileMap, src: Tile, dest: Tile) {
  if (dest.ownerId === src.ownerId) {
    //TODO combine units
    return true;
  }
  const unit = src.unit;
  return [dest, ...tiles.neighbors(dest)].every((tile) => {
    const defendingUnit = tile.unit;
    return (
      !defendingUnit ||
      dest.ownerId !== tile.ownerId ||
      unit.level === MAX_LEVEL ||
      unit.level > defendingUnit.level
    );
  });
}

export function getValidMoves(tiles: TileMap, src: Tile) {
  const validMoves = new Set();
  for (const dest of getMovesInRange(tiles, src)) {
    if (isValidMove(tiles, src, dest)) {
      validMoves.add(dest);
    }
  }
  return validMoves;
}
