export enum UnitType {
  None,
  Soldier1,
  Soldier2,
  Soldier3,
  Soldier4,
  Farm,
  Tower2,
  Tower3,
  Castle,
  Grave,
  Pine,
  Palm
}

export function isSoldier(unitType: UnitType) {
  return (
    unitType === UnitType.Soldier1 ||
    unitType === UnitType.Soldier2 ||
    unitType === UnitType.Soldier3 ||
    unitType === UnitType.Soldier4
  );
}

export function isTower(unitType: UnitType) {
  return unitType === UnitType.Tower2 || unitType === UnitType.Tower3;
}

export function isTree(unitType: UnitType) {
  return unitType === UnitType.Pine || unitType === UnitType.Palm;
}

export const MAX_LEVEL = 4;

export const Castle = {
  type: UnitType.Castle,
  moveRange: 0,
  cost: 0,
  level: 1,
  income: 0,
};
export const Farm = {
  type: UnitType.Farm,
  moveRange: 0,
  cost: 10,
  level: 0,
  income: 4,
};
export const Grave = {
  type: UnitType.Grave,
  moveRange: 0,
  cost: 0,
  level: 0,
  income: 0,
};
export const Pine = {
  type: UnitType.Pine,
  moveRange: 0,
  cost: 0,
  level: 0,
  income: -1,
};
export const Palm = {
  type: UnitType.Palm,
  moveRange: 0,
  cost: 0,
  level: 0,
  income: -1,
};
export const Soldier1 = {
  type: UnitType.Soldier1,
  moveRange: 4,
  cost: 10,
  level: 1,
  income: -2,
};
export const Soldier2 = {
  type: UnitType.Soldier2,
  moveRange: 4,
  cost: 20,
  level: 2,
  income: -6,
};
export const Soldier3 = {
  type: UnitType.Soldier3,
  moveRange: 4,
  cost: 30,
  level: 3,
  income: -18,
};
export const Soldier4 = {
  type: UnitType.Soldier4,
  moveRange: 4,
  cost: 40,
  level: 4,
  income: -36,
};
export const Tower2 = {
  type: UnitType.Tower2,
  moveRange: 0,
  cost: 15,
  level: 2,
  income: -1,
};
export const Tower3 = {
  type: UnitType.Tower3,
  moveRange: 0,
  cost: 35,
  level: 3,
  income: -6,
};

export interface Unit {
  type: UnitType;
  moveRange: number;
  cost: number;
  level: number;
  income: number;
}

const UNIT_DATA_MAP: Record<UnitType, Unit> = {
  [UnitType.None]: null,
  [UnitType.Soldier1]: Soldier1,
  [UnitType.Soldier2]: Soldier2,
  [UnitType.Soldier3]: Soldier3,
  [UnitType.Soldier4]: Soldier4,
  [UnitType.Farm]: Farm,
  [UnitType.Tower2]: Tower2,
  [UnitType.Tower3]: Tower3,
  [UnitType.Castle]: Castle,
  [UnitType.Grave]: Grave,
  [UnitType.Pine]: Pine,
  [UnitType.Palm]: Palm
};

export function getUnitData(unitType: UnitType) {
  return UNIT_DATA_MAP[unitType];
}

export function getSoldierOfLevel(level: number) {
  return getUnitData(level);
  // switch (level) {
  //   case 1:
  //     return Soldier1;
  //   case 2:
  //     return Soldier2;
  //   case 3:
  //     return Soldier3;
  //   case 4:
  //     return Soldier4;
  //   default:
  //     return null;
  // }
}
