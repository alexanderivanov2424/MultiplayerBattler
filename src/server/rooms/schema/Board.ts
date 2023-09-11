import { Schema, MapSchema, type } from "@colyseus/schema";
import { Tile } from "./Tile";
import { Player } from "./Player";
import { Province } from "./Province";
import { Unit } from "./Unit";
import { Soldier } from "./units/Soldier";
import { Pine } from "./units/Pine";
import { TileCoord, AxialCoords } from "common/utils";
import * as utils from "common/utils";
import * as generation from "server/WorldGen";
import * as searchUtils from "server/SearchUtils";

const HEX_NEIGHBORS = [
  [1, 0],
  [-1, 0],
  [0, 1],
  [0, -1],
  [1, -1],
  [-1, 1],
];

export class Board extends Schema {
  @type({ map: Tile }) tiles = new MapSchema<Tile, TileCoord>();

  @type({ map: Unit }) units = new MapSchema<Unit, TileCoord>();

  @type({ map: Player }) players = new MapSchema<Player>();

  @type("boolean") gameStarted = false;

  @type("number") currentPlayerNumber = 0;

  //TODO maybe remove
  playerOrder: string[] = [];

  constructor() {
    super();

    for (const tileCoord of generation.generateMap()) {
      this.tiles.set(tileCoord as TileCoord, new Tile());
    }

    this.units.set("3,-4", new Pine());
  }

  addPlayer(id: string) {
    const playerNumber = this.players.size;
    this.players.set(id, new Player(id, playerNumber));
    this.playerOrder.push(id);
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
      let startCoord;
      do {
        [q, r] = generation.getRandomCoord();
        q = Math.round(q * 0.75);
        r = Math.round(r * 0.75);
        startCoord = utils.hexToTileCoord([q, r]);
      } while (!this.tiles.get(startCoord) || this.units.get(startCoord));

      const startingProvince = player.createProvince();

      this.addTileToProvince(startCoord, startingProvince);
      this.units.set(startCoord, new Soldier(1, player));

      // add a single neighbor tile
      for (let [q_n, r_n] of utils.getHexNeighbors(this.tiles, [q, r])) {
        let neighborCoord = utils.hexToTileCoord([q_n, r_n]);
        if (this.tiles.get(neighborCoord).ownerId == "none") {
          this.addTileToProvince(neighborCoord, startingProvince);
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

  moveUnit(src: [number, number], dest: [number, number]) {
    const src_coord = utils.hexToTileCoord(src);
    const dest_coord = utils.hexToTileCoord(dest);

    let unit = this.units.get(src_coord);

    if (!unit || unit.moveRange === 0) {
      return;
    }
    // TODO: possible optimization, only need to check if path exists
    if (
      !utils
        .getValidMoveTiles(this.tiles, this.units, src, unit)
        .has(dest_coord)
    ) {
      return;
    }

    this.units.delete(src_coord);

    let srcTile = this.tiles.get(src_coord);
    let destTile = this.tiles.get(dest_coord);

    let previousOwnerId = destTile.ownerId;
    let newOwnerId = srcTile.ownerId;

    let previousOwner = this.players.get(previousOwnerId);
    let newOwner = this.players.get(newOwnerId);

    let srcProvince = newOwner.provinces.get(srcTile.provinceName);

    this.removeUnitFromTile(dest);
    if (previousOwnerId !== newOwnerId && previousOwnerId !== "none") {
      let destProvince = previousOwner.provinces.get(destTile.provinceName);
      this.removeTileFromProvince(dest, destProvince, previousOwner);

      this.checkProvinceSplit(dest, destProvince, previousOwner);
    }

    if (previousOwnerId !== newOwnerId) {
      this.addTileToProvince(dest_coord, srcProvince);
      this.checkProvinceMerge(dest, newOwner);
    }

    this.units.set(dest_coord, unit);
  }

  purchaseUnit([q, r]: [number, number], unit: Unit, province: Province) {
    const tileCoord = utils.hexToTileCoord([q, r]);
    if (province.money - unit.cost >= 0) {
      province.money -= unit.cost;
    } else {
      return;
    }
    this.units.set(tileCoord, unit);
  }

  removeUnitFromTile([q, r]: [number, number]) {
    const tileCoord = utils.hexToTileCoord([q, r]);
    const tile = this.tiles.get(tileCoord);
    const unitToRemove = this.units.get(tileCoord);

    if (!unitToRemove || tile.ownerId === "none") {
      // tile has no unit or owner, so nothing to remove
      return;
    }

    const tileOwner = this.players.get(tile.ownerId);
    const province = tileOwner.provinces.get(tile.provinceName);
    province.income -= unitToRemove.income;

    // TODO unit could be a castle
  }

  removeTileFromProvince(
    [q, r]: [number, number],
    province: Province,
    provinceOwner: Player
  ) {
    const tileCoord = utils.hexToTileCoord([q, r]);
    const tileToRemove = this.tiles.get(tileCoord);
    if (tileToRemove.ownerId != provinceOwner.playerId) {
      return;
    }
    tileToRemove.ownerId = "none";
    tileToRemove.provinceName = "none";

    province.tiles.delete(tileCoord);
    province.income -= 1;

    // check if province is empty
    if (province.tiles.size === 1) {
      const [tileCoord] = [...province.tiles.keys()];
      this.handleOneTileProvince(tileCoord);
    }
    if (province.tiles.size === 0) {
      provinceOwner.provinces.delete(province.name);
    }
  }

  handleOneTileProvince(tileCoord: TileCoord) {
    let tile = this.tiles.get(tileCoord);
    let provinceName = tile.provinceName;
    let province = this.players.get(tile.ownerId).provinces.get(provinceName);
    province.income = 0;
    province.money = 0;
    // TODO careful about this being reset.
  }

  checkProvinceSplit(
    [q, r]: [number, number],
    previousProvince: Province,
    previousOwner: Player
  ) {
    // check if the change in ownership of this tile has caused a province to split.

    let regions: Set<TileCoord>[] = [];

    const provinceTiles = previousProvince.tiles;
    for (let [q_n, r_n] of utils.getHexNeighbors(provinceTiles, [q, r])) {
      let isNewRegion = true;
      for (let region of regions) {
        if (region.has(utils.hexToTileCoord([q_n, r_n]))) {
          isNewRegion = false;
          break;
        }
      }
      if (!isNewRegion) {
        continue;
      }

      const getNeighbors = ([q, r]: AxialCoords) =>
        utils.getHexNeighbors(previousProvince.tiles, [q, r]);
      const getHash = utils.hexToTileCoord;
      let region = searchUtils.findConnectedHashed(
        [q_n, r_n],
        getNeighbors,
        getHash
      );
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
        let tileCoord: TileCoord = region.values().next().value;
        this.handleOneTileProvince(tileCoord);
      }
    }
  }

  updateNewProvince(province: Province, region: Set<TileCoord>) {
    province.tiles.clear();
    province.income = 0;
    for (const tileCoord of region) {
      let tile = this.tiles.get(tileCoord);

      tile.ownerId = province.ownerId;
      tile.provinceName = province.name;
      province.tiles.set(tileCoord, tile);
      province.income += 1;

      let unit = this.units.get(tileCoord);
      if (unit) {
        province.income += unit.income;
      }
    }

    //TODO add castle
  }

  addTileToProvince(tileCoord: TileCoord, province: Province) {
    const tileToAdd = this.tiles.get(tileCoord);
    const newOwner = this.players.get(province.ownerId);

    if (province.tiles.get(tileCoord)) {
      // the tile already belongs to the given province
      return;
    }

    tileToAdd.ownerId = newOwner.playerId;
    tileToAdd.provinceName = province.name;
    province.tiles.set(tileCoord, tileToAdd);
    province.income += 1;
  }

  checkProvinceMerge([q, r]: [number, number], newOwner: Player) {
    // merge adjacent provinces of the same owner if necessary
    const tileCoord = utils.hexToTileCoord([q, r]);
    const newTile = this.tiles.get(tileCoord);
    const mergedProvince = newOwner.provinces.get(newTile.provinceName);
    for (const [q_n, r_n] of utils.getHexNeighbors(this.tiles, [q, r])) {
      const neighborTile = this.tiles.get(utils.hexToTileCoord([q_n, r_n]));
      if (neighborTile.ownerId === newTile.ownerId) {
        if (neighborTile.provinceName !== mergedProvince.name) {
          const provinceToMerge = newOwner.provinces.get(
            neighborTile.provinceName
          );

          provinceToMerge.tiles.forEach((tileToMerge, coord) => {
            tileToMerge.provinceName = mergedProvince.name;
            mergedProvince.tiles.set(coord, tileToMerge);
          });
          newOwner.provinces.delete(provinceToMerge.name);
          mergedProvince.income += provinceToMerge.income;
          mergedProvince.money += provinceToMerge.money;
          if (provinceToMerge.tiles.size === 1) {
            mergedProvince.income += 1;
          }
        }
      }
    }
  }

  spreadTrees() {
    this.units.forEach((unit, coord) => {
      if (unit.unitName === "pine") {
        const coordArray = utils.parseTileCoord(coord);
        for (const [q, r] of utils.getHexNeighbors(this.tiles, [
          coordArray[0],
          coordArray[1],
        ])) {
          const neighborCoord = utils.hexToTileCoord([q, r]);
          if (
            this.tiles.get(neighborCoord) &&
            this.tiles.get(neighborCoord).ownerId !== "none" &&
            !this.units.get(neighborCoord)
          ) {
            const player = this.players.get(
              this.tiles.get(neighborCoord).ownerId
            );
            const province = player.provinces.get(
              this.tiles.get(neighborCoord).provinceName
            );
            this.units.set(neighborCoord, unit);
            province.income += unit.income;
          }
        }
      }
    });
  }
}
