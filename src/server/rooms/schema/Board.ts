import { Schema, MapSchema, type } from "@colyseus/schema";
import { Tile, TileMap } from "./Tile";
import { Player } from "./Player";
import { Province } from "./Province";
import { Unit, Soldier1, Pine } from "./Unit";
import { TileCoord, AxialCoords } from "common/utils";
import * as utils from "common/utils";
import * as generation from "server/WorldGen";
import * as searchUtils from "server/SearchUtils";

export class Board extends Schema {
  @type({ map: Tile }) _tiles = new MapSchema<Tile, TileCoord>();
  @type({ map: Player }) players = new MapSchema<Player>();
  @type("boolean") gameStarted = false;
  @type("number") currentPlayerNumber = 0;

  tiles = new TileMap(this._tiles);

  static create() {
    const state = new Board();
    for (const coord of generation.generateMap()) {
      state.tiles.set(coord, new Tile());
    }
    const tile = state.tiles.get([3, 4]);
    if (tile) {
      tile.unit = new Pine();
    }
    return state;
  }

  addPlayer(id: string) {
    const playerNumber = this.players.size;
    this.players.set(id, Player.create(id, playerNumber));
  }

  playerReadyToStart(id: string) {
    if (this.players.get(id).readyToStart) {
      return;
    }
    this.players.get(id).readyToStart = true;
    if (this.players.size < 2) {
      return;
    }
    if (this.allPlayersReady()) {
      this.startGame();
    }
  }

  allPlayersReady() {
    for (const [_, player] of this.players) {
      if (!player.readyToStart) {
        return false;
      }
    }
    return true;
  }

  startGame() {
    this.gameStarted = true;
    // TODO assign players to colors / provinces
    // Generate map
    this.players.forEach((player: Player) => {
      let q;
      let r;
      let tile;
      do {
        [q, r] = generation.getRandomCoord();
        q = Math.round(q * 0.75);
        r = Math.round(r * 0.75);
        tile = this.tiles.get([q, r]);
      } while (!tile || tile.unit);

      const startingProvince = player.createProvince();
      startingProvince.money = 10;

      this.addTileToProvince(tile, startingProvince);
      tile.unit = new Soldier1();

      // add a single neighbor tile
      for (const neighbor of this.tiles.neighbors(tile)) {
        if (!neighbor.ownerId) {
          this.addTileToProvince(neighbor, startingProvince);
          break;
        }
      }
      startingProvince.income = 1;
    });
  }

  startNextTurn() {
    this.currentPlayerNumber =
      (this.currentPlayerNumber + 1) % this.players.size;
    for (const [_, player] of this.players) {
      if (player.playerNumber === this.currentPlayerNumber) {
        for (const [_, province] of player.provinces) {
          province.money += province.income;
        }
        break;
      }
    }
    // if (this.currentPlayerNumber === 0) {
    //   this.spreadTrees();
    // }
  }

  removePlayer(id: string) {
    this.players.delete(id);
  }

  moveUnit(srcCoord: AxialCoords, destCoord: AxialCoords) {
    let src = this.tiles.get(srcCoord);
    let dest = this.tiles.get(destCoord);
    if (!src || !dest) {
      return;
    }

    let unit = src.unit;
    if (!unit || unit.moveRange === 0) {
      return;
    }
    // TODO: possible optimization, only need to check if path exists
    if (!utils.getValidMoves(this.tiles, src).has(dest)) {
      return;
    }

    src.unit = null;

    let previousOwnerId = dest.ownerId;
    let newOwnerId = src.ownerId;

    let previousOwner = this.players.get(previousOwnerId);
    let newOwner = this.players.get(newOwnerId);

    let srcProvince = newOwner.provinces.get(src.provinceName);

    this.removeUnitFromTile(dest);
    if (previousOwnerId !== newOwnerId && previousOwnerId) {
      let destProvince = previousOwner.provinces.get(dest.provinceName);
      this.removeTileFromProvince(dest, destProvince, previousOwner);

      this.checkProvinceSplit(dest, destProvince, previousOwner);
    }

    if (previousOwnerId !== newOwnerId) {
      this.addTileToProvince(dest, srcProvince);
      this.checkProvinceMerge(dest, newOwner);
    }

    dest.unit = unit;
  }

  purchaseUnit(tile: Tile, unit: Unit, province: Province) {
    const unitCost = 0; // TODO: calculate unit cost
    if (province.money - unitCost >= 0) {
      province.money -= unitCost;
      tile.unit = unit;
    }
  }

  removeUnitFromTile(tile: Tile) {
    if (!tile.unit || !tile.ownerId) {
      // tile has no unit or owner, so nothing to remove
      return;
    }

    const tileOwner = this.players.get(tile.ownerId);
    const province = tileOwner.provinces.get(tile.provinceName);
    province.income -= tile.unit.income;

    // TODO unit could be a castle
  }

  removeTileFromProvince(
    tile: Tile,
    province: Province,
    provinceOwner: Player
  ) {
    if (tile.ownerId != provinceOwner.playerId) {
      return;
    }
    tile.ownerId = null;
    tile.provinceName = null;

    province.tiles.delete(tile.coord);
    province.income -= 1;

    // check if province is empty
    if (province.tiles.size === 1) {
      const [tile] = [...province.tiles];
      this.handleOneTileProvince(tile);
    }
    if (province.tiles.size === 0) {
      provinceOwner.provinces.delete(province.name);
    }
  }

  handleOneTileProvince(tile: Tile) {
    let provinceName = tile.provinceName;
    let province = this.players.get(tile.ownerId).provinces.get(provinceName);
    province.income = 0;
    province.money = 0;
    // TODO careful about this being reset.
  }

  checkProvinceSplit(
    tile: Tile,
    previousProvince: Province,
    previousOwner: Player
  ) {
    // check if the change in ownership of this tile has caused a province to split.

    let regions: Set<Tile>[] = [];

    for (const neighbor of previousProvince.tiles.neighbors(tile)) {
      let isNewRegion = true;
      for (let region of regions) {
        if (region.has(neighbor)) {
          isNewRegion = false;
          break;
        }
      }
      if (!isNewRegion) {
        continue;
      }

      const getNeighbors = previousProvince.tiles.neighbors;
      let region = searchUtils.findConnected(neighbor, getNeighbors);
      regions.push(region);
    }

    if (regions.length < 2) {
      // No Split occured, we are done
      return;
    }

    let largestRegion = regions[0];
    let largestRegionSize = 0;
    for (let region of regions) {
      let size = region.size;
      if (size > largestRegionSize) {
        largestRegion = region;
        largestRegionSize = size;
      }
    }

    for (let region of regions) {
      if (region === largestRegion) {
        this.updateNewProvince(previousProvince, largestRegion);
      } else {
        const province = previousOwner.createProvince();
        this.updateNewProvince(province, region);
      }
      if (region.size === 1) {
        const [tile] = [...region];
        this.handleOneTileProvince(tile);
      }
    }
  }

  updateNewProvince(province: Province, region: Set<Tile>) {
    province.tiles.clear();
    province.income = 0;
    for (const tile of region) {
      tile.ownerId = province.ownerId;
      tile.provinceName = province.name;
      province.tiles.set(tile.coord, tile);
      province.income += 1;
      province.income += tile.unit?.income ?? 0;
    }

    //TODO add castle
  }

  addTileToProvince(tile: Tile, province: Province) {
    const newOwner = this.players.get(province.ownerId);

    if (tile.provinceName === province.name) {
      // the tile already belongs to the given province
      return;
    }

    tile.ownerId = newOwner.playerId;
    tile.provinceName = province.name;
    province.tiles.set(tile.coord, tile);
    province.income += 1;
  }

  checkProvinceMerge(newTile: Tile, newOwner: Player) {
    // merge adjacent provinces of the same owner if necessary
    const mergedProvince = newOwner.provinces.get(newTile.provinceName);
    for (const neighbor of this.tiles.neighbors(newTile)) {
      if (neighbor.ownerId !== newTile.ownerId) {
        continue;
      }
      if (neighbor.provinceName === mergedProvince.name) {
        continue;
      }
      const provinceToMerge = newOwner.provinces.get(neighbor.provinceName);

      for (const tileToMerge of provinceToMerge.tiles) {
        tileToMerge.provinceName = mergedProvince.name;
        mergedProvince.tiles.set(tileToMerge.coord, tileToMerge);
      }
      newOwner.provinces.delete(provinceToMerge.name);
      mergedProvince.income += provinceToMerge.income;
      mergedProvince.money += provinceToMerge.money;
      if (provinceToMerge.tiles.size === 1) {
        mergedProvince.income += 1;
      }
    }
  }

  spreadTrees() {
    for (const tile of this.tiles) {
      const unit = tile.unit;
      if (unit instanceof Pine) {
        for (const neighbor of this.tiles.neighbors(tile)) {
          if (neighbor && neighbor.ownerId && !neighbor.unit) {
            const player = this.players.get(neighbor.ownerId);
            const province = player.provinces.get(neighbor.provinceName);
            neighbor.unit = unit;
            province.income += unit.income;
          }
        }
      }
    }
  }
}
