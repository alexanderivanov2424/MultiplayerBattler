import { Unit } from "../Unit";

export class Grave extends Unit {
  static create() {
    return new Grave().assign({ unitName: "grave" });
  }
}
