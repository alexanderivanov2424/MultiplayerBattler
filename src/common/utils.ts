import { MapSchema } from "@colyseus/schema";
import { Tile } from "../server/rooms/schema/Tile";
import { Unit } from "../server/rooms/schema/Unit";
import { Province } from "../server/rooms/schema/Province";
import * as UnitData from "./UnitData";

export type AxialCoords = [q: number, r: number];
export type TileCoord = `${number},${number}`;
export type CoordMap<T> = MapSchema<T, TileCoord>;
export type Tiles = MapSchema<Tile, TileCoord>;
export type Units = MapSchema<Unit, TileCoord>;

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

export function hexToTileCoord([q, r]: AxialCoords): TileCoord {
  return `${q},${r}`;
}

export function parseTileCoord(tileCoord: TileCoord): AxialCoords {
  let [q, r] = tileCoord.split(",");
  return [Number(q), Number(r)];
}

export function getUnitDataAtTile(tile: Tile) {
  if (tile.unitType !== -1) {
    return UnitData.getUnitData(tile.unitType);
  }
}

export function captureTile(
  tiles: Tiles,
  srcProvinceName: string,
  playerProvinces: MapSchema<Province>,
  [q, r]: AxialCoords,
  playerId: string
) {
  const tileCoord = hexToTileCoord([q, r]);
  const tile = tiles.get(tileCoord);
  if (!tile) {
    return;
  }
  // removeTileFromProvince(...[]);
  // addTileToProvince();
  // TODO: split provinces of the previous owner if necessary
}

// Check 6 neighbors of [q,r] and return any members of collection that are there.
export function* getHexNeighbors<T>(
  collection: CoordMap<T>,
  [q, r]: AxialCoords
): Generator<AxialCoords> {
  for (const [shift_q, shift_r] of HEX_NEIGHBORS) {
    const new_q = q + shift_q;
    const new_r = r + shift_r;
    if (collection.get(hexToTileCoord([new_q, new_r]))) {
      yield [new_q, new_r];
    }
  }
}

export function* getNeighbors<T>(
  collection: CoordMap<T>,
  [q, r]: AxialCoords
): Generator<T> {
  for (const [shift_q, shift_r] of HEX_NEIGHBORS) {
    const new_q = q + shift_q;
    const new_r = r + shift_r;
    const neighbor = collection.get(hexToTileCoord([new_q, new_r]));
    if (neighbor) {
      yield neighbor;
    }
  }
}

function getTilesInMoveRange(
  tiles: Tiles,
  playerId: string,
  moveSource: AxialCoords,
  unitData: UnitData.UnitData
): AxialCoords[] {
  let tileCoordsInMoveRange = new Set();
  let tilesInMoveRange: AxialCoords[] = [];

  let neighbors = [];
  let next_neighbors = [moveSource];
  let distance = unitData.moveRange;

  while (distance >= 0) {
    neighbors = next_neighbors;
    next_neighbors = [];

    for (let [q, r] of neighbors) {
      tileCoordsInMoveRange.add(q + "," + r);
      tilesInMoveRange.push([q, r]);
      // We don't add neighbors for a tile that we don't own.
      // You can only move 1 tile outside of your own teritory.
      if (tiles.get(hexToTileCoord([q, r])).ownerId !== playerId) {
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

function isValidMoveTile(
  tiles: Tiles,
  playerId: string,
  unitData: UnitData.UnitData,
  moveDest: AxialCoords
) {
  const destTileCoord = hexToTileCoord(moveDest);
  const destTile = tiles.get(destTileCoord);
  if (!destTile) {
    return false;
  }
  if (destTile.ownerId === playerId) {
    //TODO combine units
    return true;
  }
  return [destTile, ...getNeighbors(tiles, moveDest)].every(neighborTile => {
    if (neighborTile.unitType === -1) {
      return true;
    }
    const defendingUnit = UnitData.getUnitData(neighborTile.unitType);
    return (
      !defendingUnit ||
      destTile.ownerId !== neighborTile.ownerId ||
      unitData.level === MAX_LEVEL ||
      unitData.level > defendingUnit.level
    );
  });
}

export function getValidMoveTiles(
  tiles: Tiles,
  playerId: string,
  moveSource: AxialCoords,
  unitData: UnitData.UnitData
) {
  const validMoveTiles = getTilesInMoveRange(tiles, playerId, moveSource, unitData).filter(
    (moveDest) => isValidMoveTile(tiles, playerId, unitData, moveDest)
  );
  let validMoveTileCoords = new Set();
  for (const [q, r] of validMoveTiles) {
    validMoveTileCoords.add(q + "," + r);
  }
  return validMoveTileCoords;
}

export function getProvinceSizeAtTile(
  tiles: Tiles,
  [q, r]: AxialCoords
): number {
  // TODO: return getAllConnectedTiles(tiles, [q, r]).length;
  return 0;
}

export function getAllConnectedTilesByProvince(
  tiles: Tiles,
  [q, r]: AxialCoords
): AxialCoords[] {
  return [];
}
