import { Schema, MapSchema, ArraySchema, type } from "@colyseus/schema";
import { Tile } from "./Tile";
import { Player } from "./Player";
import { Unit } from "./Unit";
import { Soldier } from "./units/Soldier";
import { Tower } from "./units/Tower";
import { Pine } from "./units/Pine";
import * as utils from "../../../public/utils";

const HEX_NEIGHBORS = [
  [1, 0],
  [-1, 0],
  [0, 1],
  [0, -1],
  [1, -1],
  [-1, 1],
];

export class Board extends Schema {
  @type("number") generation = 0;

  @type({ map: Tile }) tiles = new MapSchema<Tile>();

  @type({ map: Unit }) units = new MapSchema<Unit>();

  @type({ map: Player }) players = new MapSchema<Player>();

  @type("boolean") gameStarted = false;

  @type("number") currentPlayerNumber = 0;

  //TODO maybe remove
  playerOrder: string[] = [];

  constructor() {
    super();

    for (let i = -5; i < 6; i++) {
      for (let j = -5; j < 6; j++) {
        this.tiles.set(i + "," + j, new Tile());
      }
    }

    // this.units.set("0,0", new Soldier(0));
    // this.units.set("3,-2", new Soldier(1));

    // this.units.set("-3,-3", new Soldier(0));

    // this.units.set("-2,-2", new Tower(0));
    // this.units.set("-2,2", new Tower(1));

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
    // if (this.players.size < 2) {
    //   this.updateClients();
    //   return;
    // }
    if (this.allPlayersReady()) {
      this.startGame();
    }
    this.updateClients();
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
      let randPos;
      do {
        let randIntX = Math.floor(Math.random() * 12) - 5;
        let randIntY = Math.floor(Math.random() * 12) - 5;
        randPos = randIntX + "," + randIntY;
      } while (
        !utils.tileExists(this.tiles, randPos) ||
        this.units.get(randPos)
      );
      this.units.set(randPos, new Soldier(0, player));
      utils.captureTile(this.tiles, randPos, player.playerId);
    });
    this.updateClients();
    //
  }

  startNextTurn() {
    this.currentPlayerNumber =
      (this.currentPlayerNumber + 1) % this.players.size;
    // Tell client to change HUD
    // this.updateClients();
  }

  removePlayer(id: string) {
    this.players.delete(id);
  }

  updateClients() {
    this.generation++;
  }

  moveUnit(src: [number, number], dest: [number, number]) {
    const src_coord = src[0] + "," + src[1];
    const dest_coord = dest[0] + "," + dest[1];

    let unit = this.units.get(src_coord);

    if (!unit || unit.moveRange === 0) {
      return;
    }
    if (this.units.get(dest_coord)) {
      return;
    }
    const moveDistance = utils.getDistance(
      this.tiles,
      src,
      dest,
      unit.moveRange
    );
    console.log(moveDistance);
    if (moveDistance > unit.moveRange || moveDistance === -1) {
      return;
    }
    if (
      moveDistance > 1 &&
      this.tiles.get(dest_coord).ownerId !== unit.ownerId
    ) {
      return;
    }

    this.units.delete(src_coord);
    this.units.set(dest_coord, unit);
    utils.captureTile(this.tiles, dest_coord, unit.ownerId);

    this.updateClients();
  }
}
