import { Unit } from "../Unit";
import { Player } from "../Player";

export class Farm extends Unit {
  static create(owner: Player) {
    return new Farm().assign({
      unitName: "farm",
      ownerId: owner.playerId,
      cost: 16, // TODO should scale with number of farms
      income: 2,
    });
  }
}
