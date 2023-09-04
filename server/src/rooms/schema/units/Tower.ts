import { Schema, type } from "@colyseus/schema";
import { Unit } from "../Unit";
import { Player } from "../Player";

export class Tower extends Unit {
  @type("number") level: number;

  constructor(level: number, owner: Player) {
    super("tower" + level, owner);
  }
}
