import { Schema, MapSchema, ArraySchema, type } from "@colyseus/schema";
import { Tile } from "./Tile";
import { Player } from "./Player";
import { Unit } from "./Unit";

export class Board extends Schema {
  @type({ map: Tile }) tiles = new MapSchema<Tile>();

  @type({ map: Unit }) units = new MapSchema<Unit>();

  @type([Player]) players = new ArraySchema<Player>();

  @type(["boolean"]) playerStartConfirmations = new ArraySchema<"boolean">();

  @type("boolean") gameStarted = false;

  @type("number") currentPlayerTurn = 0;

  constructor() {
    super();

    this.tiles.set("0,0", new Tile());
    this.tiles.set("0,1", new Tile());
    this.tiles.set("1,0", new Tile());
    this.tiles.set("-1,2", new Tile());

    this.tiles.set("6,4", new Tile());
    this.tiles.set("4,-1", new Tile());
  }
}
