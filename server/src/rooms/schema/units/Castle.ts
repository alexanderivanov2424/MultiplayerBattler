import { Schema, type } from "@colyseus/schema";
import { Unit } from "../Unit";
import { Player } from "../Player";

export class Castle extends Unit {
  constructor(owner: Player) {
    super("castle", owner);
  }
}
