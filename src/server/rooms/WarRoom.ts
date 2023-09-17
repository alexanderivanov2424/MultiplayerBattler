import { Room, Client } from "@colyseus/core";
import { Board } from "./schema/Board";
import { getUnitData } from "./schema/Unit";

export class WarRoom extends Room<Board> {
  maxClients = 4;

  onCreate(options: any) {
    this.setState(Board.create());
    console.log("set state");

    this.onMessage("move", (client, [srcCoord, destCoord]) => {
      if (!this.isClientTurn(client)) return;
      const player = this.state.players.get(client.sessionId);
      const src = this.state.tiles.get(srcCoord);
      const dest = this.state.tiles.get(destCoord);
      if (!src || !dest) {
        return;
      }
      this.state.moveUnit(player, src, dest);
    });

    this.onMessage("purchase", (client, [provinceName, coord, unitType]) => {
      if (!this.isClientTurn(client)) return;
      const player = this.state.players.get(client.sessionId);
      const province = player.provinces.get(provinceName);
      const tile = this.state.tiles.get(coord);
      const unit = getUnitData(unitType);
      if (!province || !tile || !unit) {
        return;
      }
      this.state.purchaseUnit(player, province, tile, unit);
    });

    this.onMessage("readyToStart", (client) => {
      this.state.playerReadyToStart(client.sessionId);
    });

    this.onMessage("endTurn", (client) => {
      if (!this.isClientTurn(client)) return;
      this.state.startNextTurn();
    });
  }

  isClientTurn(client: Client) {
    return (
      this.state.players.get(client.sessionId).playerNumber ===
      this.state.currentPlayerNumber
    );
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
