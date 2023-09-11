import { Unit } from "../Unit";
import { Player } from "../Player";

export class Farm extends Unit {
  constructor(owner: Player) {
    super("farm", owner, -1, 2);
  }
}
