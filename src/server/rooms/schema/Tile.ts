import { Schema, type } from "@colyseus/schema";
import { Unit } from "./Unit";
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
  @type(Unit) unit: Unit = null;

  q: number;
  r: number;
  get coord(): AxialCoords {
    return [this.q, this.r];
  }
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

  get([q, r]: AxialCoords) {
    const tile = this.map.get(hexToTileCoord([q, r]));
    if (tile) {
      tile.q = q;
      tile.r = r;
    }
    return tile;
  }

  set([q, r]: AxialCoords, tile: Tile) {
    tile.q = q;
    tile.r = r;
    this.map.set(hexToTileCoord([q, r]), tile);
    return this;
  }

  delete([q, r]: AxialCoords) {
    return this.map.delete(hexToTileCoord([q, r]));
  }

  get size() {
    return this.map.size;
  }

  *[Symbol.iterator](): Generator<Tile> {
    for (const [coord, tile] of this.map) {
      const [q, r] = parseTileCoord(coord);
      tile.q = q;
      tile.r = r;
      yield tile;
    }
  }

  *neighbors(node: AxialCoords | Tile): Generator<Tile> {
    let q, r;
    if (node instanceof Tile) {
      [q, r] = [node.q, node.r];
    } else {
      [q, r] = node;
    }
    for (const [shift_q, shift_r] of HEX_NEIGHBORS) {
      const coord: AxialCoords = [q + shift_q, r + shift_r];
      const neighbor = this.get(coord);
      if (neighbor) {
        yield neighbor;
      }
    }
  }
}
