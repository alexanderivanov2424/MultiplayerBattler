import { Schema, type } from "@colyseus/schema";
import { OptionalUnitType } from "common/UnitData";

export class Tile extends Schema {
  @type("string") ownerId: string = "none"; // name of owner or none if not owned
  @type("string") provinceName: string = "none"; // key into owner's provinces map or none if not owned
  @type("number") unitType: OptionalUnitType; // -1 if there is no unit
}
