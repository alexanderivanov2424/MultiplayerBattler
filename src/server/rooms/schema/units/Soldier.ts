import { Unit } from "../Unit";
import { Player } from "../Player";

export class Soldier extends Unit {
  static create(level: number, owner: Player) {
    return new Soldier().assign({
      unitName: "soldier" + level,
      ownerId: owner.playerId,
      moveRange: 5,
      level,
      cost: 10 * level,
      income: -1, // TODO should scale with level
    });
  }
}
