import { PartyKitServer, Connection, Party } from "partykit/server";

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
  submission: string[] | null;
};

export type GameState = {
  status: "lobby" | "playing" | "result";
  products: Product[];
  players: Record<string, Player>;
  round: number;
};

const PRODUCTS: Product[] = [
  { id: "1", name: "Mechanical Keyboard", price: 89.99, image: "https://images.unsplash.com/photo-1511467687858-23d96c32e4ae?w=500&q=80" },
  { id: "2", name: "Wireless Mouse", price: 24.50, image: "https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?w=500&q=80" },
  { id: "3", name: "Coffee Grinder", price: 45.00, image: "https://images.unsplash.com/photo-1585515320310-259814833e62?w=500&q=80" },
  { id: "4", name: "Hydro Flask", price: 34.95, image: "https://images.unsplash.com/photo-1602143302703-f75d7768335c?w=500&q=80" },
  { id: "5", name: "Desk Lamp", price: 29.99, image: "https://images.unsplash.com/photo-1534073828943-f801091bb18c?w=500&q=80" },
  { id: "6", name: "Yoga Mat", price: 55.00, image: "https://images.unsplash.com/photo-1592432676556-26d56d0abc57?w=500&q=80" }
];

export default class Server implements PartyKitServer {
  state: GameState = {
    status: "lobby",
    products: [],
    players: {},
    round: 1,
  };

  onConnect(conn: Connection, room: Party) {
    conn.send(JSON.stringify({ type: "state", state: this.state }));
  }

  onClose(conn: Connection, room: Party) {
    delete this.state.players[conn.id];
    room.broadcast(JSON.stringify({ type: "state", state: this.state }));
  }

  onMessage(message: string, conn: Connection, room: Party) {
    const data = JSON.parse(message);
    
    if (data.type === "join") {
      const isHost = Object.keys(this.state.players).length === 0;
      this.state.players[conn.id] = {
        id: conn.id,
        name: data.name || `Player ${conn.id.slice(0, 4)}`,
        score: 0,
        isHost,
        submission: null,
      };
      room.broadcast(JSON.stringify({ type: "state", state: this.state }));
    }

    if (data.type === "start" && this.state.players[conn.id]?.isHost) {
      this.state.status = "playing";
      // Pick 4 random products
      this.state.products = [...PRODUCTS].sort(() => Math.random() - 0.5).slice(0, 4);
      this.state.players = Object.fromEntries(
        Object.entries(this.state.players).map(([id, p]) => [id, { ...p, submission: null }])
      );
      room.broadcast(JSON.stringify({ type: "state", state: this.state }));
    }

    if (data.type === "submit") {
      if (this.state.players[conn.id]) {
        this.state.players[conn.id].submission = data.submission;
        
        // Check if everyone submitted
        const allSubmitted = Object.values(this.state.players).every(p => p.submission !== null);
        if (allSubmitted) {
          this.state.status = "result";
          // Calculate scores (simplified: +1 for each correct position)
          const actualOrder = [...this.state.products].sort((a, b) => a.price - b.price).map(p => p.id);
          Object.values(this.state.players).forEach(p => {
            if (p.submission) {
              let roundScore = 0;
              p.submission.forEach((id, idx) => {
                if (id === actualOrder[idx]) roundScore += 100;
              });
              p.score += roundScore;
            }
          });
        }
        room.broadcast(JSON.stringify({ type: "state", state: this.state }));
      }
    }

    if (data.type === "reset" && this.state.players[conn.id]?.isHost) {
      this.state.status = "lobby";
      room.broadcast(JSON.stringify({ type: "state", state: this.state }));
    }
  }
}
