import { Schema, MapSchema, ArraySchema, type } from "@colyseus/schema";
import { Tile } from "./Tile";
import { Player } from "./Player";
import { Unit } from "./Unit";
import { Soldier } from "./units/Soldier";
import { Tower } from "./units/Tower";
import { Pine } from "./units/Pine";
import "../../../public/utils";

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

  @type(["boolean"]) playerStartConfirmations = new ArraySchema<"boolean">();

  @type("boolean") gameStarted = false;

  @type("number") currentPlayerTurn = 0;

  constructor() {
    super();

    for (let i = -5; i < 6; i++) {
      for (let j = -5; j < 6; j++) {
        this.tiles.set(i + "," + j, new Tile());
      }
    }

    this.units.set("0,0", new Soldier(0));
    this.units.set("3,-2", new Soldier(1));

    this.units.set("-2,-2", new Tower(0));
    this.units.set("-2,2", new Tower(1));

    this.units.set("3,-4", new Pine());
  }

  addPlayer(id: string) {
    this.players.set(id, new Player(id));
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
    //
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
    const moveDistance = getDistance(
      src,
      dest,
      unit.moveRange,
      this.tileExists
    );
    console.log(moveDistance);
    if (moveDistance > unit.moveRange || moveDistance === -1) {
      return;
    }

    this.units.delete(src_coord);
    this.units.set(dest_coord, unit);

    this.updateClients();
  }

  tileExists([q, r]: [number, number]) {
    return this.tiles.get(q + "," + r);
  }
}
