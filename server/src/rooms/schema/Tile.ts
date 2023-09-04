import { Schema, type } from "@colyseus/schema";

export class Tile extends Schema {
  @type("string") ownerId: string = "none"; // name of owner or none if not owned

  @type("number") terrainType: number = 1; // 1 always

  constructor() {
    super();
  }
}
