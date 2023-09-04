import { Schema, type } from "@colyseus/schema";
import { Player } from "./Player";

export class Unit extends Schema {
  @type("string") ownerId: string = "none"; // name of owner or none if not owned

  @type("string") unitName: string;

  @type("number") moveRange: number = 0;

  constructor(unitName: string, owner: Player) {
    super();
    this.unitName = unitName;
    if (owner) {
      this.ownerId = owner.playerId;
    }
  }

  getMovementRange() {
    return this.moveRange;
  }
}
