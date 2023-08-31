import { Schema, type } from "@colyseus/schema";
import { Unit } from "../Unit";

export class Soldier extends Unit {
  @type("number") level: number;

  constructor(level: number) {
    super("soldier" + level);
    this.movable = true;
  }
}
