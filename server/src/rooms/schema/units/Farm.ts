import { Schema, type } from "@colyseus/schema";
import { Unit } from "../Unit";

export class Farm extends Unit {
  constructor() {
    super("farm");
  }
}
