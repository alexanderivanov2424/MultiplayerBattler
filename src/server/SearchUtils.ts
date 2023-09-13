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

export function findConnected<T>(
  src: T,
  getNeighbors: (node: T) => Iterable<T>
) {
  let checked = new Set<T>();
  let frontier = [src];

  while (frontier.length > 0) {
    let node = frontier.pop();
    for (let neighbor of getNeighbors(node)) {
      if (checked.has(neighbor)) {
        continue;
      }
      frontier.push(neighbor);
    }
    checked.add(node);
  }
  return checked;
}
