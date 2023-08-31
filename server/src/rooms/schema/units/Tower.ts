import { Schema, type } from "@colyseus/schema";
import { Unit } from "../Unit";

export class Tower extends Unit {
  @type("number") level: number;

  constructor(level: number) {
    super("tower" + level);
  }
}
