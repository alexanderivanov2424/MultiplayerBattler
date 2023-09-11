import { Unit } from "../Unit";
import { Player } from "../Player";

export class Tower extends Unit {
  constructor(level: number, owner: Player) {
    super("tower" + level, owner, level);
  }
}
