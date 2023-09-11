import { Schema, MapSchema, type } from "@colyseus/schema";
import { Province } from "./Province";

export class Player extends Schema {
  @type("string") playerId: string;
  @type("string") name: string;
  @type("boolean") connected: boolean = true;
  @type("boolean") readyToStart: boolean = false;
  @type({ map: Province }) provinces = new MapSchema<Province>();
  @type("number") playerNumber = -1;

  nextProvinceNumber: number = 0;

  constructor(playerId: string, playerNumber: number) {
    super();
    this.playerId = playerId;
    this.playerNumber = playerNumber;
    this.name = playerId;
  }

  createProvince(): Province {
    const provinceName = this.nextProvinceNumber.toString();
    const province = new Province(this, provinceName);
    this.provinces.set(provinceName, province);
    this.nextProvinceNumber++;
    return province;
  }
}
