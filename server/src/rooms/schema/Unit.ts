import { Schema, type } from "@colyseus/schema";

export class Unit extends Schema {
  @type("string") owner: string = "none"; // name of owner or none if not owned

  @type("string") unitName: string;

  @type("number") moveRange: number = 0;

  constructor(unitName: string) {
    super();
    this.unitName = unitName;
  }

  getMovementRange() {
    return this.moveRange;
  }
}
