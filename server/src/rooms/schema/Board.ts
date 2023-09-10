import { Schema, MapSchema, ArraySchema, type } from "@colyseus/schema";
import { Tile } from "./Tile";
import { Player } from "./Player";
import { Province } from "./Province";
import { Unit } from "./Unit";
import { Soldier } from "./units/Soldier";
import { Pine } from "./units/Pine";
import { TileCoord } from "../../common/utils";
import * as utils from "../../common/utils";
import * as generation from "../../WorldGen";

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
      let randCoord;
      do {
        [q, r] = generation.getRandomCoord();
        q = Math.round(q * 0.75);
        r = Math.round(r * 0.75);
        randCoord = utils.hexToTileCoord([q, r]);
      } while (!this.tiles.get(randCoord) || this.units.get(randCoord));
      this.units.set(utils.hexToTileCoord([q, r]), new Soldier(1, player));
      const adjCoord = utils.hexToTileCoord([q + 1, r]);
      if (this.tiles.get(adjCoord)) {
        this.units.set(adjCoord, new Soldier(1, player));
      }
      const province1 = player.createProvince();
      const province2 = player.createProvince();
      utils.captureTile(
        this.tiles,
        province1.name,
        player.provinces,
        [q, r],
        player.playerId
      );
      utils.captureTile(
        this.tiles,
        province1.name,
        player.provinces,
        [q + 1, r],
        player.playerId
      );
      utils.captureTile(
        this.tiles,
        province1.name,
        player.provinces,
        [q + 1, r + 1],
        player.playerId
      );
      utils.captureTile(
        this.tiles,
        province2.name,
        player.provinces,
        [q - 1, r - 1],
        player.playerId
      );
      utils.captureTile(
        this.tiles,
        province1.name,
        player.provinces,
        [q - 1, r + 1],
        player.playerId
      );
    });
  }

  startNextTurn() {
    this.currentPlayerNumber =
      (this.currentPlayerNumber + 1) % this.players.size;
    if (this.currentPlayerNumber === 0) {
      this.spreadTrees();
    }
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

    let previousOwnerId = this.tiles.get(dest_coord).ownerId;
    let newOwnerId = srcTile.ownerId;

    let previousOwner = this.players.get(previousOwnerId);
    let newOwner = this.players.get(newOwnerId);

    let srcProvince = newOwner.provinces.get(srcTile.provinceName);

    this.removeUnitFromTile(dest);
    if (previousOwnerId !== newOwnerId && previousOwnerId !== "none") {
      let destProvince = previousOwner.provinces.get(srcTile.provinceName);
      this.removeTileFromProvince(dest, destProvince, previousOwner);

      this.checkProvinceSplit(dest, destProvince, previousOwnerId);
    }

    if (previousOwnerId !== newOwnerId) {
      this.addTileToProvince(dest, srcProvince);
      this.checkProvinceMerge(dest, newOwner);
    }

    this.units.set(dest_coord, unit);

    // const player = this.players.get(unit.ownerId);
    // const srcProvinceName = this.tiles.get(src_coord).provinceName;
    // utils.captureTile(
    //   this.tiles,
    //   srcProvinceName,
    //   player.provinces,
    //   dest,
    //   unit.ownerId
    // );
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

    province.tiles.delete(tileCoord);
    province.income -= 1;

    // check if province is empty
    if (province.tiles.size === 1) {
      const [tileCoord] = [...province.tiles.keys()];
      let [q_n, r_n] = utils.parseTileCoord(tileCoord);
      this.handleOneTileProvince([q_n, r_n]);
    }
    if (province.tiles.size === 0) {
      provinceOwner.provinces.delete(province.name);
    }
  }

  handleOneTileProvince([q, r]: [number, number]) {
    let tile = this.tiles.get(utils.hexToTileCoord([q, r]));
    let provinceName = tile.provinceName;
    let province = this.players.get(tile.ownerId).provinces.get(provinceName);
    province.income = 0;
    province.money = 0;
    // TODO careful about this being reset.
  }

  checkProvinceSplit(
    [q, r]: [number, number],
    previousProvince: Province,
    previousOwnerId: string
  ) {
    // check if the change in ownership of this tile has caused a province to split.
    const neighborTiles = [];

    const previousProvinceMoney = previousProvince.money;

    for (const [q_n, r_n] of utils.getHexNeighbors(this.tiles, [q, r])) {
      const neighborTile = this.tiles.get(utils.hexToTileCoord([q_n, r_n]));
      if (neighborTile.ownerId === previousOwnerId) {
        neighborTiles.push([q_n, r_n]);
      }
    }

    // get neighbors
    // save the original province info
    // delete original province
    // for each neighbor:
    //   if neighbor is still in the original province:
    //     create a new province (flood-fills all connected)
    // find largest province and assign province info

    let largestProvinceSize = 0;
    let LargestProvinceTile = neighborTiles[0];

    for (const [q_d, r_d] of neighborTiles) {
      const size = utils.getProvinceSizeAtTile(null, [q_d, r_d]); // TODO replace null
      if (size <= 0) {
        //TODO error message, this shouldn't happen
        continue;
      }
      if (size === 1) {
        this.handleOneTileProvince([q_d, r_d]);
        continue;
      }
      if (size > largestProvinceSize) {
        largestProvinceSize = size;
        LargestProvinceTile = [q_d, r_d];
      }
    }

    for (let [q_d, r_d] of neighborTiles) {
      if (q_d === LargestProvinceTile[0] && r_d === LargestProvinceTile[1]) {
        continue;
      }
      this.startNewProvince([q_d, r_d]);
    }
  }

  startNewProvince([q, r]: [number, number]) {
    const tile = this.tiles.get(utils.hexToTileCoord([q, r]));
    const province = this.players.get(tile.ownerId).createProvince();
    const tilesHex = utils.getAllConnectedTilesByProvince(this.tiles, [q, r]);
    for (const [q_c, r_c] of tilesHex) {
      const tileCoord = utils.hexToTileCoord([q_c, r_c]);
      const tileConnected = this.tiles.get(tileCoord);
      province.tiles.set(tileCoord, tileConnected);
      tileConnected.provinceName = province.name;
    }

    //TODO add castle
  }

  addTileToProvince([q, r]: [number, number], province: Province) {
    const tileCoord = utils.hexToTileCoord([q, r]);
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
    for (const [q_n, r_n] of utils.getHexNeighbors(null, [q, r])) {
      // TODO replace null
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
