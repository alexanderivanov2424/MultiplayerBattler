import { Schema, ArraySchema, type } from "@colyseus/schema";
import { Province } from "./Province";

export class Player extends Schema {
  @type("string") playerId: string;
  @type("string") name: string;
  @type([Province]) provinces = new ArraySchema<Province>();
}
