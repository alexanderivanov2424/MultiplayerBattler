import { Schema, MapSchema, ArraySchema, type } from "@colyseus/schema";
import { Tile } from "./Tile";
import { Player } from "./Player";
import { Unit } from "./Unit";
import { Soldier } from "./units/Soldier";
import { Tower } from "./units/Tower";

export class Board extends Schema {
  @type("number") generation = 0;

  @type({ map: Tile }) tiles = new MapSchema<Tile>();

  @type({ map: Unit }) units = new MapSchema<Unit>();

  @type([Player]) players = new ArraySchema<Player>();

  @type(["boolean"]) playerStartConfirmations = new ArraySchema<"boolean">();

  @type("boolean") gameStarted = false;

  @type("number") currentPlayerTurn = 0;

  constructor() {
    super();

    for (let i = -4; i < 5; i++) {
      for (let j = -4; j < 5; j++) {
        this.tiles.set(i + "," + j, new Tile());
      }
    }

    this.units.set("0,0", new Soldier(0));
    this.units.set("3,-2", new Soldier(1));

    this.units.set("-2,-2", new Tower(0));
  }

  updateClients() {
    this.generation++;
  }

  moveUnit(src: [number, number], dest: [number, number]) {
    const src_coord = src[0] + "," + src[1];
    const dest_coord = dest[0] + "," + dest[1];

    let unit = this.units.get(src_coord);

    if (!unit || !unit.movable) {
      return;
    }
    if (this.units.get(dest_coord)) {
      return;
    }

    this.units.delete(src_coord);
    this.units.set(dest_coord, unit);

    this.updateClients();
  }
}
