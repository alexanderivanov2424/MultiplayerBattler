import { Schema, MapSchema, type } from "@colyseus/schema";
import { Tile } from "./Tile";

export class Province extends Schema {
  @type("string") playerId: string;
  @type("string") name: string;

  @type({ map: Tile }) tiles = new MapSchema<Tile>();

  @type("number") money: number;
}
