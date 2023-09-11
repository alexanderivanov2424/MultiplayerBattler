import { Schema, type } from "@colyseus/schema";
import { Unit } from "../Unit";

export class Pine extends Unit {
  constructor() {
    super("pine", null, -1, -1);
  }
}
