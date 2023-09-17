import { Schema, MapSchema, type } from "@colyseus/schema";
import { Tile, TileMap } from "./Tile";
import { Player } from "./Player";
import { Province } from "./Province";
import { UnitType, Unit, Farm, Soldier1, Pine, isSoldier, MAX_LEVEL, getSoldierOfLevel, isTower, isTree } from "./Unit";
import { TileCoord, AxialCoords } from "common/utils";
import * as utils from "common/utils";
import * as generation from "server/WorldGen";
import * as searchUtils from "server/SearchUtils";

export class Board extends Schema {
  @type({ map: Tile }) _tiles = new MapSchema<Tile, TileCoord>();
  @type({ map: Player }) players = new MapSchema<Player>();
  @type("boolean") gameStarted = false;
  @type("number") currentPlayerNumber = 0;

  _tileMap = new TileMap(this._tiles);
  get tiles() {
    this._tileMap.map = this._tiles;
    return this._tileMap;
  }

  static create() {
    const state = new Board();
    for (const coord of generation.generateMap()) {
      state.tiles.set(coord, new Tile());
    }
    const tile = state.tiles.get([3, 4]);
    if (tile) {
      tile.unit = Pine;
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
      let q, r, tile;
      do {
        [q, r] = generation.getRandomCoord();
        q = Math.round(q * 0.75);
        r = Math.round(r * 0.75);
        tile = this.tiles.get([q, r]);
      } while (!tile || tile.unit);

      const startingProvince = player.createProvince();
      startingProvince.money = 1000;

      this.addTileToProvince(tile, startingProvince);
      tile.unit = Soldier1;

      // add a single neighbor tile
      for (const neighbor of this.tiles.neighbors(tile)) {
        if (!neighbor.ownerId) {
          this.addTileToProvince(neighbor, startingProvince);
          neighbor.unit = Soldier1;
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

  handleUnitPlacement(player: Player, province: Province, unit: Unit, tile: Tile): boolean {
    if (tile.ownerId === player.playerId) {
      return this.mergeUnitAtTile(province, unit, tile);
    } else {
      const previousProvince = this.players.get(tile.ownerId)?.provinces.get(tile.provinceName);
      const newProvince = province;
      return this.captureTile(tile, unit, previousProvince, newProvince);
    }
  }

  // handle change in ownership at tile
  captureTile(tile: Tile, unit: Unit, previousProvince: Province | null, newProvince: Province) {
    const previousOwner = this.players.get(previousProvince?.ownerId);
    const newOwner = this.players.get(newProvince.ownerId);

    this.removeUnitFromTile(tile);
    if (previousOwner !== newOwner) {
      if (previousProvince) {
        this.removeTileFromProvince(tile, previousProvince, previousOwner);
        this.checkProvinceSplit(tile, previousProvince, previousOwner);
      }
      this.addTileToProvince(tile, newProvince);
      this.checkProvinceMerge(tile, newOwner);
    }
    tile.unit = unit;
    return true;
  }

  moveUnit(player: Player, src: Tile, dest: Tile) {
    const unit = src.unit;
    if (!unit || unit.moveRange === 0) {
      return;
    }
    // TODO: possible optimization, only need to check if path exists
    if (!utils.getValidMoves(this.tiles, src).has(dest)) {
      return;
    }

    src.unit = null;

    const newOwnerId = src.ownerId;
    const newOwner = this.players.get(newOwnerId);
    const srcProvince = newOwner.provinces.get(src.provinceName);

    this.handleUnitPlacement(player, srcProvince, unit, dest);
  }

  purchaseUnit(player: Player, province: Province, tile: Tile, unit: Unit) {
    const unitCost = unit.cost;
    if (!unitCost) {
      // unit type cannot be purchased
      return;
    }

    // create a dummy src tile with this unit
    const src = new Tile();
    src.ownerId = player.playerId;
    src.unit = unit;
    if (unit.moveRange === 0 && tile.ownerId !== player.playerId) {
      // you can't purchase immovable units on unowned tiles
      return;
    }
    if (![...province.tiles.neighbors(tile)].length) {
      return;
    }
    // check if the unit can "move" from the dummy tile to the requested location
    if (!utils.isValidMove(this.tiles, src, tile)) {
      return;
    }

    // if the province has enough money, try to place the unit on the tile
    if (province.money - unitCost >= 0) {
      if (this.handleUnitPlacement(player, province, unit, tile)) {
        province.income += unit.income;
        province.money -= unitCost;
      }
    }
  }

  mergeUnitAtTile(province: Province, unit: Unit, tile: Tile): boolean {
    if (!tile.unit) {
      tile.unit = unit;
    } else if (isSoldier(unit.type)) {
      if (isSoldier(tile.unit.type)) {
        const incomeLost = tile.unit.income + unit.income;
        const newLevel = Math.min(tile.unit.level + unit.level - 1, MAX_LEVEL);
        province.income -= incomeLost;
        const newUnit = getSoldierOfLevel(newLevel);
        province.income += newUnit.income;
        tile.unit = newUnit;
      } else if (isTree(tile.unit.type)) {
        // TODO: Do you get money for capturing graves?
        province.money += 3;
        tile.unit = unit;
      } else if (tile.unit.type === UnitType.Grave) {
        tile.unit = unit;
      } else {
        return false;
      }
    } else if (isTower(unit.type)) {
      if (isTower(tile.unit.type) && tile.unit.level < unit.level) {
        province.income -= tile.unit.income;
        province.income += unit.income;
        tile.unit = unit;
      } else {
        return false;
      }
    }
    return true;
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
    const provinceName = tile.provinceName;
    const province = this.players.get(tile.ownerId).provinces.get(provinceName);
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

    const regions: Set<Tile>[] = [];

    for (const neighbor of previousProvince.tiles.neighbors(tile)) {
      if (regions.some((region) => region.has(neighbor))) {
        continue;
      }

      const getNeighbors = previousProvince.tiles.neighbors;
      const region = searchUtils.findConnected(neighbor, getNeighbors);
      regions.push(region);
    }

    if (regions.length < 2) {
      // No Split occured, we are done
      return;
    }

    const largestRegion = regions.reduce(
      (r1, r2) => (r2.size > r1.size ? r2 : r1),
      regions[0]
    );

    for (const region of regions) {
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
    if (tile.unit === Farm) {
      province.farms++;
    }
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
      if (unit === Pine) {
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
