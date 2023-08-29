import { Room, Client } from "@colyseus/core";
import { Board } from "./schema/Board";

export class WarRoom extends Room<Board> {
  maxClients = 4;

  onCreate(options: any) {
    this.setState(new Board());
    console.log("set state");

    this.onMessage("increment", (client, message) => {
      console.log("got message:", message);
    });
  }

  onJoin(client: Client, options: any) {
    console.log(client.sessionId, "joined!");
  }

  onLeave(client: Client, consented: boolean) {
    console.log(client.sessionId, "left!");
  }

  onDispose() {
    console.log("room", this.roomId, "disposing...");
  }
}
