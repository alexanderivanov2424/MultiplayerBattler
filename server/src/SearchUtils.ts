import { Tile } from "./rooms/schema/Tile";
import * as utils from "./common/utils";

// Utils and algorithms for HexGrid

export function findPath(
  src: any,
  dest: any,
  getNeighbors: (node: any) => any[],
  heuristic: (node: any) => number
) {
  let checkedTiles = new Set();
  let frontier: [number, [number, number]][] = []; // [cost, [q, r]]

  while (frontier.length > 0) {
    let [cost, [q, r]] = frontier.pop();
  }
}

export function findConnectedHashed<T, Hashable>(
  src: T,
  getNeighbors: (node: T) => Iterable<T>,
  getHash: (node: T) => Hashable
) {
  let checked = new Set<Hashable>();
  let frontier = [src];

  while (frontier.length > 0) {
    let node = frontier.pop();
    for (let neighbor of getNeighbors(node)) {
      if (checked.has(getHash(neighbor))) {
        continue;
      }
      frontier.push(neighbor);
    }
    checked.add(getHash(node));
  }
  return checked;
}
