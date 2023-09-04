import { Room, Client } from "@colyseus/core";
import { Board } from "./schema/Board";

export class WarRoom extends Room<Board> {
  maxClients = 4;

  onCreate(options: any) {
    this.setState(new Board());
    console.log("set state");

    this.onMessage("move", (client, [src, dest]) => {
      this.state.moveUnit(src, dest);
    });

    this.onMessage("readyToStart", (client) => {
      this.state.playerReadyToStart(client.sessionId);
    });
  }

  onJoin(client: Client, options: any) {
    this.state.addPlayer(client.sessionId);
    console.log(client.sessionId, "joined!");
  }

  onDispose() {
    console.log("room", this.roomId, "disposing...");
  }

  async onLeave(client: Client, consented: boolean) {
    console.log(client.sessionId, "left!");
    // flag client as inactive for other users
    this.state.players.get(client.sessionId).connected = false;

    try {
      // if (consented) {
      //   throw new Error("consented leave");
      // }

      // allow disconnected client to reconnect into this room for 5 minutes
      await this.allowReconnection(client, 300);

      // client returned! let's re-activate it.
      this.state.players.get(client.sessionId).connected = true;
      console.log("rejoin");
    } catch (e) {
      // 5 minutes expired. let's remove the client.
      this.state.removePlayer(client.sessionId);
    }
  }
}
