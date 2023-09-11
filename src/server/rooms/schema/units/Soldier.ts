import { Unit } from "../Unit";
import { Player } from "../Player";

export class Soldier extends Unit {
  constructor(level: number, owner: Player) {
    super("soldier" + level, owner, level);
    this.moveRange = 5;
  }
}
