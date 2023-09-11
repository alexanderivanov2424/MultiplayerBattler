import { Unit } from "../Unit";

export class Pine extends Unit {
  static create() {
    return new Pine().assign({ unitName: "pine", income: -1 });
  }
}
