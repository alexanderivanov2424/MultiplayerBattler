import { Schema, type } from "@colyseus/schema";

export class Unit extends Schema {
  level: number = 0;
  income: number = 0;
  moveRange: number = 0;
}

export class Grave extends Unit {
  @type("uint8") x = 0;
}

export class Castle extends Unit {
  @type("uint8") x = 0;
  level = 1;
}

export class Farm extends Unit {
  @type("uint8") x = 0;
  income = 2;
}

export class Pine extends Unit {
  @type("uint8") x = 0;
  income = -1;
}

class Soldier extends Unit {
  moveRange = 4;
}

export class Soldier1 extends Soldier {
  @type("uint8") x = 0;
  level = 1;
  income = -1;
}

export class Soldier2 extends Soldier {
  @type("uint8") x = 0;
  level = 2;
  income = -6;
}

export class Soldier3 extends Soldier {
  @type("uint8") x = 0;
  level = 3;
  income = -18;
}

export class Soldier4 extends Soldier {
  @type("uint8") x = 0;
  level = 4;
  income = -36;
}

export class Tower2 extends Unit {
  @type("uint8") x = 0;
  level = 2;
  income = -1;
}

export class Tower3 extends Unit {
  @type("uint8") x = 0;
  level = 3;
  income = -6;
}
