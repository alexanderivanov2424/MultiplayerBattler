import { Unit } from "../Unit";
import { Player } from "../Player";

export class Tower extends Unit {
  static create(level: number, owner: Player) {
    return new Tower().assign({
      unitName: "tower" + level,
      ownerId: owner.playerId,
      level,
      cost: level === 2 ? 15 : 35,
    });
  }
}
