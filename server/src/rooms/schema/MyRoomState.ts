import { Schema, Context, type } from "@colyseus/schema";

export class MyRoomState extends Schema {
  @type("string") mySynchronizedProperty: string = "Hello world";

  @type("number") counter: number = 1;
}
