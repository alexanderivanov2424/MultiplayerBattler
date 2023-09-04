import { Schema, type } from "@colyseus/schema";
import { Unit } from "../Unit";
import { Player } from "../Player";

export class Soldier extends Unit {
  @type("number") level: number;

  constructor(level: number, owner: Player) {
    super("soldier" + level, owner);
    this.moveRange = 5;
  }
}
