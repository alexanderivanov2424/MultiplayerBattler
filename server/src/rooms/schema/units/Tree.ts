import { Schema, type } from "@colyseus/schema";
import { Unit } from "../Unit";

export class Tree extends Unit {
  constructor() {
    super("tree");
  }
}
