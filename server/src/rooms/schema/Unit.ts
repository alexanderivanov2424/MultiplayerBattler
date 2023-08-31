import { Schema, type } from "@colyseus/schema";

export class Unit extends Schema {
  @type("string") owner: string = "none"; // name of owner or none if not owned

  @type("string") unitName: string;

  @type("boolean") movable: boolean = false;

  constructor(unitName: string) {
    super();
    this.unitName = unitName;
  }

  getMovementRange() {
    return 5;
  }
}
