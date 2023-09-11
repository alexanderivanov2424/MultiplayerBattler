import { Unit } from "../Unit";
import { Player } from "../Player";

export class Castle extends Unit {
  static create(owner: Player) {
    return new Castle().assign({
      unitName: "castle",
      ownerId: owner.playerId,
    });
  }
}
