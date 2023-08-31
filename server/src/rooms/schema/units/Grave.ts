import { Schema, type } from "@colyseus/schema";
import { Unit } from "../Unit";

export class Grave extends Unit {
  constructor() {
    super("grave");
  }
}
