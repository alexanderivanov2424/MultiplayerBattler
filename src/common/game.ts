type Coord = [number, number];
type Action =
  | { type: "move"; src: Coord; dest: Coord }
  | { type: "purchase"; unitType: number; tile: Coord }
  | { type: "endTurn" };

const MAX_LEVEL = 4;

class GameError extends Error {}

class Game {
  board: Board;
  players: Player[];
  turn: number;

  get current() {
    return this.players[this.turn % this.players.length];
  }

  setup() {}

  private merge(unit: Unit, existing: Unit): Unit {
    // TODO: combine units by upgrading level
    return unit;
  }

  private capture(unit: Unit, tile: Tile) {
    if (
      unit.level < MAX_LEVEL &&
      [tile, ...this.board.neighbors(tile)]
        .map((tile) => tile.unit)
        .filter((unit) => unit && unit.owner === tile.owner)
        .some((defender) => defender.level >= unit.level)
    ) {
      throw new GameError("tile is defended");
    }
    unit.tile = tile;
  }

  private place(unit: Unit, tile: Tile) {
    if (tile.owner !== unit.owner) {
      this.capture(unit, tile);
    } else if (tile.unit) {
      unit = this.merge(unit, tile.unit);
      unit.tile = tile;
    }
  }

  move(unit: Unit, tile: Tile) {
    if (!this.board.getTilesInRange(unit.coord, unit.moveRange).has(tile)) {
      throw new GameError("tile must be in unit's move range");
    }
    this.place(unit, tile);
  }

  purchase(unit: Unit, tile: Tile) {
    const province = unit.province;
    if (![...this.board.neighbors(tile)].some((n) => n.province === province)) {
      throw new GameError("tile must be in or adjancent to province");
    }
    if (province.money < unit.cost) {
      throw new GameError("not enough money to purchase unit");
    }
    this.place(unit, tile);
    province.money -= unit.cost;
  }

  endTurn() {
    this.turn++;
  }

  doAction(action: Action) {
    switch (action.type) {
      case "move": {
        const unit = this.board.get(action.src)?.unit;
        if (!unit) {
          throw new GameError("no unit at source coord");
        }
        const tile = this.board.get(action.dest);
        if (!tile) {
          throw new GameError("no tile at destination coord");
        }
        return this.move(unit, tile);
      }
      case "purchase": {
        // TODO: construct new unit
        const unit = this.board.get(action.tile)?.unit;
        if (!unit) {
          throw new GameError("invalid unit type");
        }
        const tile = this.board.get(action.tile);
        if (!tile) {
          throw new GameError("no tile at destination coord");
        }
        return this.purchase(unit, tile);
      }
      case "endTurn":
        return this.endTurn();
    }
  }
}

class Board {
  static HEX_NEIGHBORS = [
    [1, 0],
    [0, 1],
    [-1, 1],
    [-1, 0],
    [0, -1],
    [1, -1],
  ];

  // TODO: convert hex coord to tile coord
  map: Map<Coord, Tile>;

  get(coord: Coord): Tile {
    return this.map.get(coord);
  }

  getTilesInRange(coord: Coord, range: number) {
    const tilesInRange = new Set<Tile>();
    const src = this.get(coord);
    if (!src) {
      return tilesInRange;
    }
    let frontier = [src];

    for (let i = 0; i <= range; i++) {
      const nextFrontier = [];
      for (const tile of frontier) {
        tilesInRange.add(tile);
        // We don't add neighbors for a tile that we don't own.
        // You can only move 1 tile outside of your own teritory.
        if (tile.owner !== src.owner) {
          continue;
        }
        for (const neighbor of this.neighbors(tile)) {
          if (!tilesInRange.has(neighbor)) {
            nextFrontier.push(neighbor);
          }
        }
      }
      frontier = nextFrontier;
    }

    return tilesInRange;
  }

  *neighbors(tile: Tile): Generator<Tile> {
    const [q, r] = tile.coord;
    for (const [shift_q, shift_r] of Board.HEX_NEIGHBORS) {
      const neighbor = this.get([q + shift_q, r + shift_r]);
      if (neighbor) {
        yield neighbor;
      }
    }
  }

  // TODO: move into player
  neighborProvinces(tile: Tile): Set<Province> {
    const provinces = new Set<Province>();
    for (const neighbor of this.neighbors(tile)) {
      if (neighbor.province) {
        provinces.add(neighbor.province);
      }
    }
    return provinces;
  }
}

class Player {
  game: Game;
  provinces: Set<Province>;

  get board() {
    return this.game.board;
  }

  checking = false;

  checkMerge(tile: Tile) {
    // find all other neighboring provinces with tile's owner
    const neighborProvinces = this.board.neighborProvinces(tile);
    neighborProvinces.delete(tile.province);

    // add money and income from neighboring province
    // to tile's province and remove neighboring province
    for (const province of neighborProvinces) {
      for (const t of province.tiles) {
        // handles transferring income from units and tiles
        // TODO: size 1 province?
        t.changeProvince(tile.province);
      }
      tile.province.money += province.money;
      this.provinces.delete(province);
    }
  }

  checkSplit(tile: Tile) {
    // flood-fill all neighboring regions with tile's owner
    const neighbors = new Set(this.board.neighbors(tile));
    const regions: Set<Tile>[] = [];
    for (const neighbor of neighbors) {
      // TODO
    }

    // create new provinces for all regions but the largest
  }
}

class Province {
  money: number;
  income: number;

  owner: Player;
  tiles: Set<Tile>; // controlled by Tile

  addIncome(income: number) {
    this.income += income;
  }

  addTile(tile: Tile) {
    this.income += 1;
    this.tiles.add(tile);
    if (!this.owner.checking) {
      this.owner.checking = true;
      this.owner.checkMerge(tile);
      this.owner.checking = false;
    }
  }

  deleteTile(tile: Tile) {
    this.income -= 1;
    this.tiles.delete(tile);
    if (!this.owner.checking) {
      this.owner.checking = true;
      this.owner.checkSplit(tile);
      this.owner.checking = false;
    }
  }
}

class Tile {
  coord: [number, number];

  private _province?: Province;
  get province() {
    return this._province;
  }
  set province(province: Province) {
    if (province === this._province) {
      return;
    }
    this._province?.deleteTile(this);
    this._province = province;
    this._province?.addTile(this);
  }

  get owner() {
    return this.province?.owner;
  }
  // can't set owner, only province

  unit?: Unit; // controlled by Unit

  changeProvince(province: Province) {
    if (this.unit) {
      this.unit.province = province;
    } else {
      this.province = province;
    }
  }
}

class Unit {
  level: number;
  moveRange: number;
  cost: number;
  income: number;

  private _tile: Tile;
  get tile() {
    return this._tile;
  }
  set tile(tile: Tile) {
    this._tile.unit = null;
    tile.unit = this;
    tile.province = this.province;
    this._tile = tile;
  }

  get coord() {
    return this.tile.coord;
  }

  get province() {
    return this.tile.province;
  }
  set province(province: Province) {
    if (province === this.province) {
      return;
    }
    this.tile.province?.addIncome(-this.income);
    this.tile.province = province;
    this.tile.province?.addIncome(this.income);
  }

  get owner() {
    return this.tile.owner;
  }
  // can't set owner, only province
}
