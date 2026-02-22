import { PartyKitServer } from "partykit/server";

export type Product = {
  id: string;
  name: string;
  price: number;
  image: string;
};

export type Player = {
  id: string;
  name: string;
  score: number;
  isHost: boolean;
  isReady: boolean;
  submission: string[] | null; // list of product IDs in guessed order
};

export type GameState = {
  status: "lobby" | "playing" | "result";
  products: Product[];
  players: Record<string, Player>;
  round: number;
};

export default class Server implements PartyKitServer {
  state: GameState = {
    status: "lobby",
    products: [],
    players: {},
    round: 1,
  };

  onConnect(conn: any, room: any) {
    // Basic join logic
    console.log("Connected", conn.id);
  }

  onMessage(message: string, conn: any, room: any) {
    const data = JSON.parse(message);
    
    if (data.type === "join") {
      const isHost = Object.keys(this.state.players).length === 0;
      this.state.players[conn.id] = {
        id: conn.id,
        name: data.name || `Player ${conn.id.slice(0, 4)}`,
        score: 0,
        isHost,
        isReady: false,
        submission: null,
      };
      room.broadcast(JSON.stringify({ type: "state", state: this.state }));
    }

    if (data.type === "start" && this.state.players[conn.id]?.isHost) {
      this.state.status = "playing";
      // Logic to pick 4 random products would go here
      room.broadcast(JSON.stringify({ type: "state", state: this.state }));
    }
  }
}
