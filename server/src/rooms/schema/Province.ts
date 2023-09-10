import { Schema, MapSchema, type } from "@colyseus/schema";
import { Tile } from "./Tile";
import { Player } from "./Player";

export class Province extends Schema {
  @type("string") ownerId: string;
  @type("string") name: string;

  @type({ map: Tile }) tiles = new MapSchema<Tile>();

  @type("number") money: number = 10;
  @type("number") income: number = 2;

  constructor(owner: Player, name: string) {
    super();
    this.ownerId = owner.playerId;
    this.name = name;
  }
}
