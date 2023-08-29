import { Schema, type } from "@colyseus/schema";

export class Unit extends Schema {
  @type("string") owner: string = "none"; // name of owner or none if not owned

  @type("string") unitName: string = "Farmer";
}
