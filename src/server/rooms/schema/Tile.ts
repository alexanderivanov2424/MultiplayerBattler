import { Schema, type } from "@colyseus/schema";
import { UnitType, Unit, getUnitData } from "./Unit";
import {
  AxialCoords,
  TileCoord,
  hexToTileCoord,
  parseTileCoord,
  HEX_NEIGHBORS,
} from "common/utils";

export class Tile extends Schema {
  @type("string") ownerId: string = null; // name of owner or null if not owned
  @type("string") provinceName: string = null; // key into owner's provinces map or null if not owned
  @type("uint8") unitType = UnitType.None;

  get unit(): Unit {
    return getUnitData(this.unitType);
  }

  set unit(unit: Unit) {
    this.unitType = unit?.type ?? UnitType.None;
  }

  coord: AxialCoords;
}

export class TileMap {
  map: Map<TileCoord, Tile>;

  constructor(map: Map<TileCoord, Tile>) {
    this.map = map;
    this.neighbors = this.neighbors.bind(this);
  }

  clear() {
    return this.map.clear();
  }

  get(coord: AxialCoords) {
    const tile = this.map.get(hexToTileCoord(coord));
    if (tile) {
      tile.coord = coord;
    }
    return tile;
  }

  set(coord: AxialCoords, tile: Tile) {
    tile.coord = coord;
    this.map.set(hexToTileCoord(coord), tile);
    return this;
  }

  delete(coord: AxialCoords) {
    return this.map.delete(hexToTileCoord(coord));
  }

  getATile() {
    return this[Symbol.iterator]().next().value;
  }

  tileSet() {
    const tileSet = new Set();
    this.map.forEach((tile, coord) => {
      tile.coord = parseTileCoord(coord);
      tileSet.add(tile);
    });
    return tileSet;
  }

  get size() {
    return this.map.size;
  }

  *[Symbol.iterator](): Generator<Tile> {
    for (const [coord, tile] of this.map) {
      tile.coord = parseTileCoord(coord);
      yield tile;
    }
  }

  *neighbors(node: Tile): Generator<Tile> {
    const [q, r] = node.coord;
    for (const [shift_q, shift_r] of HEX_NEIGHBORS) {
      const coord: AxialCoords = [q + shift_q, r + shift_r];
      const neighbor = this.get(coord);
      if (neighbor) {
        yield neighbor;
      }
    }
  }
}
