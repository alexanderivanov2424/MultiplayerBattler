import { Schema, type } from "@colyseus/schema";

export class Unit extends Schema {
  @type("string") unitName: string;
  @type("string") ownerId: string = "none"; // name of owner or none if not owned
  // @type("number") moveRange: number = 0;
  @type("number") level: number = 0;
  @type("number") cost: number = 0;
  @type("number") income: number = 0;
}
