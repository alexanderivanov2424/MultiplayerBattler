import { Schema, MapSchema, type } from "@colyseus/schema";
import { Tile } from "./Tile";
import { Player } from "./Player";
import { TileCoord } from "../../../common/utils";

export class Province extends Schema {
  @type("string") ownerId: string;
  @type("string") name: string;

  @type({ map: Tile }) tiles = new MapSchema<Tile, TileCoord>();

  @type("number") money: number = 10;
  @type("number") income: number = 0;

  constructor(owner: Player, name: string) {
    super();
    this.ownerId = owner.playerId;
    this.name = name;
  }
}
