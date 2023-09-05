import { Schema, type } from "@colyseus/schema";
import { Unit } from "../Unit";
import { Player } from "../Player";

export class Grave extends Unit {
  constructor() {
    super("grave", null, -1);
  }
}
