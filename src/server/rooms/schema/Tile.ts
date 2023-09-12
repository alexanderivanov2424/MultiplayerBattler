import { Schema, type } from "@colyseus/schema";
import { Unit } from "./Unit";

export class Tile extends Schema {
  @type("string") ownerId: string = null; // name of owner or null if not owned
  @type("string") provinceName: string = null; // key into owner's provinces map or null if not owned
  @type(Unit) unit: Unit = null;
}
