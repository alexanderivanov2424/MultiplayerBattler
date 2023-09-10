import { Schema, MapSchema, ArraySchema, type } from "@colyseus/schema";
import { Tile } from "./Tile";
import { Player } from "./Player";
import { Province } from "./Province";
import { Unit } from "./Unit";
import { Soldier } from "./units/Soldier";
import { Tower } from "./units/Tower";
import { Pine } from "./units/Pine";
import * as utils from "../../../public/utils";
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
  @type({ map: Tile }) tiles = new MapSchema<Tile>();

  @type({ map: Unit }) units = new MapSchema<Unit>();

  @type({ map: Player }) players = new MapSchema<Player>();

  @type("boolean") gameStarted = false;

  @type("number") currentPlayerNumber = 0;

  //TODO maybe remove
  playerOrder: string[] = [];

  constructor() {
    super();

    for (let tileCoord of generation.generateMap()) {
      this.tiles.set(tileCoord, new Tile());
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
    for (let [id, player] of this.players) {
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
      utils.captureTile(this.tiles, province1.name, player.provinces, [q, r], player.playerId);
      utils.captureTile(this.tiles, province1.name, player.provinces, [q + 1, r], player.playerId);
      utils.captureTile(this.tiles, province1.name, player.provinces, [q + 1, r + 1], player.playerId);
      utils.captureTile(this.tiles, province2.name, player.provinces, [q - 1, r - 1], player.playerId);
      utils.captureTile(this.tiles, province1.name, player.provinces, [q - 1, r + 1], player.playerId);
    });
  }

  startNextTurn() {
    this.currentPlayerNumber =
      (this.currentPlayerNumber + 1) % this.players.size;
  }

  removePlayer(id: string) {
    this.players.delete(id);
  }

  moveUnit(src: [number, number], dest: [number, number]) {
    const src_coord = src[0] + "," + src[1];
    const dest_coord = dest[0] + "," + dest[1];

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
    this.units.set(dest_coord, unit);

    const player = this.players.get(unit.ownerId);
    const srcProvinceName = this.tiles.get(src_coord).provinceName;
    utils.captureTile(this.tiles, srcProvinceName, player.provinces, dest, unit.ownerId);
  }
}
