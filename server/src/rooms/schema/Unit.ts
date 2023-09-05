import { Schema, type } from "@colyseus/schema";
import { Player } from "./Player";

export class Unit extends Schema {
  @type("string") unitName: string;

  @type("string") ownerId: string = "none"; // name of owner or none if not owned

  @type("number") moveRange: number = 0;

  @type("number") level: number = 0;

  constructor(unitName: string, owner?: Player, level: number = 0) {
    super();
    this.unitName = unitName;
    if (owner) {
      this.ownerId = owner.playerId;
    }
    this.level = level;
  }

  getMovementRange() {
    return this.moveRange;
  }
}
