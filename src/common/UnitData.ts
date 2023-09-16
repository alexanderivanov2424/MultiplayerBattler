export enum UnitType {
  Castle,
  Farm,
  Grave,
  Pine,
  Palm,
  Soldier1,
  Soldier2,
  Soldier3,
  Soldier4,
  Tower2,
  Tower3,
}

export type UNIT_NONE = -1;

export type OptionalUnitType = UNIT_NONE | UnitType;

const UNIT_CASTLE = { moveRange: 0, cost: 0, level: 1, income: 0 };
const UNIT_FARM = { moveRange: 0, cost: 10, level: 0, income: 4 };
const UNIT_GRAVE = { moveRange: 0, cost: 0, level: 0, income: 0 };
const UNIT_PINE = { moveRange: 0, cost: 0, level: 0, income: -1 };
const UNIT_PALM = { moveRange: 0, cost: 0, level: 0, income: -1 };
const UNIT_SOLDIER1 = { moveRange: 4, cost: 10, level: 1, income: -1 };
const UNIT_SOLDIER2 = { moveRange: 4, cost: 20, level: 2, income: -6 };
const UNIT_SOLDIER3 = { moveRange: 4, cost: 30, level: 3, income: -18 };
const UNIT_SOLDIER4 = { moveRange: 4, cost: 40, level: 4, income: -36 };
const UNIT_TOWER2 = { moveRange: 0, cost: 15, level: 2, income: -1 };
const UNIT_TOWER3 = { moveRange: 0, cost: 35, level: 3, income: -6 };

export interface UnitData {
  moveRange: number;
  cost: number;
  level: number;
  income: number;
}

const UNIT_DATA_MAP: Record<UnitType, UnitData> = {
  [UnitType.Castle]: UNIT_CASTLE,
  [UnitType.Farm]: UNIT_FARM,
  [UnitType.Grave]: UNIT_GRAVE,
  [UnitType.Pine]: UNIT_PINE,
  [UnitType.Palm]: UNIT_PALM,
  [UnitType.Soldier1]: UNIT_SOLDIER1,
  [UnitType.Soldier2]: UNIT_SOLDIER2,
  [UnitType.Soldier3]: UNIT_SOLDIER3,
  [UnitType.Soldier4]: UNIT_SOLDIER4,
  [UnitType.Tower2]: UNIT_TOWER2,
  [UnitType.Tower3]: UNIT_TOWER3,
};

export function getUnitData(unitType: UnitType) {
  return UNIT_DATA_MAP[unitType];
}

export function getUnitMoveRange(unitType: UnitType) {
  return UNIT_DATA_MAP[unitType].moveRange;
}

export function getUnitCost(unitType: UnitType) {
  return UNIT_DATA_MAP[unitType].cost;
}

export function getUnitLevel(unitType: UnitType) {
  return UNIT_DATA_MAP[unitType].level;
}

export function getUnitIncome(unitType: UnitType) {
  return UNIT_DATA_MAP[unitType].income;
}
