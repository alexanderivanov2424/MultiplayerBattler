// Utils and algorithms for HexGrid

export function findPath(
  src: any,
  dest: any,
  getNeighbors: (node: any) => any[],
  heuristic: (node: any) => number
) {
  const checkedTiles = new Set();
  const frontier: [number, [number, number]][] = []; // [cost, [q, r]]

  while (frontier.length > 0) {
    let [cost, [q, r]] = frontier.pop();
  }
}

export function findConnected<T>(
  src: T,
  getNeighbors: (node: T) => Iterable<T>
) {
  const checked = new Set<T>();
  const frontier = [src];

  while (frontier.length > 0) {
    const node = frontier.pop();
    for (const neighbor of getNeighbors(node)) {
      if (checked.has(neighbor)) {
        continue;
      }
      frontier.push(neighbor);
    }
    checked.add(node);
  }
  return checked;
}
