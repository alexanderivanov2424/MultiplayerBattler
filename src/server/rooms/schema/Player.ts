import { Schema, MapSchema, type } from "@colyseus/schema";
import { Province } from "./Province";
import { PLAYER_NAMES_FIRST, PLAYER_NAMES_LAST } from "./NameConstants";

export class Player extends Schema {
  @type("string") playerId: string;
  @type("string") name: string;
  @type("boolean") connected: boolean = true;
  @type("boolean") readyToStart: boolean = false;
  @type({ map: Province }) provinces = new MapSchema<Province>();
  @type("number") playerNumber = -1;

  nextProvinceNumber: number = 0;

  static create(playerId: string, playerNumber: number) {
    const first =
      PLAYER_NAMES_FIRST[Math.floor(Math.random() * PLAYER_NAMES_FIRST.length)];
    const last =
      PLAYER_NAMES_LAST[Math.floor(Math.random() * PLAYER_NAMES_LAST.length)];
    return new Player().assign({
      playerId,
      playerNumber,
      name: first + " " + last,
    });
  }

  createProvince(): Province {
    const provinceName = this.nextProvinceNumber.toString();
    const province = Province.create(this, provinceName);
    this.provinces.set(provinceName, province);
    this.nextProvinceNumber++;
    return province;
  }
}
