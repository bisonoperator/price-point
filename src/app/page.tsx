"use client";

import { useState, useEffect } from "react";
import usePartySocket from "partysocket/react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ShoppingCart, Users, Play, Trophy, ArrowRight, CheckCircle2 } from "lucide-react";
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from "@dnd-kit/core";
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy, useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

type Product = { id: string; name: string; price: number; image: string };
type Player = { id: string; name: string; score: number; isHost: boolean; submission: string[] | null };
type GameState = { status: "lobby" | "playing" | "result"; products: Product[]; players: Record<string, Player>; round: number };

function SortableItem({ product }: { product: Product }) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: product.id });
  const style = { transform: CSS.Transform.toString(transform), transition };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners} className="touch-none">
      <Card className="mb-3 cursor-grab active:cursor-grabbing hover:border-indigo-400 transition-colors">
        <CardContent className="p-3 flex items-center space-x-4">
          <img src={product.image} alt={product.name} className="w-16 h-16 rounded-md object-cover" />
          <div className="flex-1">
            <h3 className="font-bold text-slate-800">{product.name}</h3>
            <p className="text-xs text-slate-500 italic">Drag to sort</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function Home() {
  const [name, setName] = useState("");
  const [room, setRoom] = useState("default-room");
  const [joined, setJoined] = useState(false);
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [items, setItems] = useState<Product[]>([]);

  const socket = usePartySocket({
    host: process.env.NEXT_PUBLIC_PARTYKIT_HOST || "localhost:1999",
    room: room,
    onMessage(evt) {
      const data = JSON.parse(evt.data);
      if (data.type === "state") {
        setGameState(data.state);
        if (data.state.status === "playing" && items.length === 0) {
          setItems(data.state.products);
        }
      }
    },
  });

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleJoin = () => {
    socket.send(JSON.stringify({ type: "join", name }));
    setJoined(true);
  };

  const handleStart = () => {
    socket.send(JSON.stringify({ type: "start" }));
  };

  const handleSubmit = () => {
    socket.send(JSON.stringify({ type: "submit", submission: items.map(i => i.id) }));
  };

  const handleDragEnd = (event: any) => {
    const { active, over } = event;
    if (active.id !== over.id) {
      setItems((items) => {
        const oldIndex = items.findIndex((i) => i.id === active.id);
        const newIndex = items.findIndex((i) => i.id === over.id);
        return arrayMove(items, oldIndex, newIndex);
      });
    }
  };

  const me = gameState?.players[socket.id];
  const sortedPlayers = Object.values(gameState?.players || {}).sort((a, b) => b.score - a.score);

  if (!joined) {
    return (
      <main className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
        <div className="max-w-md w-full space-y-8 text-center">
          <div className="flex flex-col items-center space-y-2">
            <div className="p-3 bg-indigo-600 rounded-2xl shadow-lg">
              <ShoppingCart className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-4xl font-extrabold tracking-tight text-slate-900">Price Point</h1>
          </div>
          <Card className="border-2 shadow-xl">
            <CardHeader><CardTitle>Join a Game</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <Input placeholder="Your Name" value={name} onChange={(e) => setName(e.target.value)} className="h-12" />
              <Input placeholder="Room Code" value={room} onChange={(e) => setRoom(e.target.value)} className="h-12 uppercase" />
              <Button className="w-full h-12 bg-indigo-600 font-bold" onClick={handleJoin} disabled={!name}>Let's Go!</Button>
            </CardContent>
          </Card>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50 p-4 max-w-lg mx-auto pb-24">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-black text-indigo-600 uppercase tracking-tighter">Price Point</h1>
        <Badge variant="outline" className="bg-white">{room}</Badge>
      </div>

      {gameState?.status === "lobby" && (
        <div className="space-y-6">
          <Card>
            <CardHeader><CardTitle className="text-center">Players</CardTitle></CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 gap-2">
                {sortedPlayers.map(p => (
                  <div key={p.id} className="p-3 rounded-lg bg-white border flex justify-between items-center">
                    <span className="font-bold">{p.name} {p.id === socket.id && "(You)"}</span>
                    {p.isHost && <Badge className="bg-indigo-100 text-indigo-700">Host</Badge>}
                  </div>
                ))}
              </div>
              {me?.isHost && (
                <Button className="w-full mt-6 bg-green-600 hover:bg-green-700 h-12 font-bold" onClick={handleStart}>
                  Start Game
                </Button>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {gameState?.status === "playing" && (
        <div className="space-y-4">
          <div className="bg-indigo-600 text-white p-4 rounded-xl shadow-lg mb-6">
            <p className="text-xs uppercase font-bold opacity-80">Round {gameState.round}</p>
            <h2 className="text-xl font-bold">Sort from Cheap to Expensive</h2>
          </div>

          {me?.submission ? (
            <Card className="border-dashed border-2 py-12 text-center">
              <CheckCircle2 className="w-12 h-12 text-green-500 mx-auto mb-4" />
              <p className="font-bold text-slate-600">Locked in! Waiting for others...</p>
            </Card>
          ) : (
            <>
              <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                <SortableContext items={items.map(i => i.id)} strategy={verticalListSortingStrategy}>
                  {items.map(item => <SortableItem key={item.id} product={item} />)}
                </SortableContext>
              </DndContext>
              <Button className="w-full h-14 bg-indigo-600 text-lg font-black shadow-xl mt-4" onClick={handleSubmit}>
                LOCK IT IN <ArrowRight className="ml-2" />
              </Button>
            </>
          )}
        </div>
      )}

      {gameState?.status === "result" && (
        <div className="space-y-6 animate-in slide-in-from-bottom duration-500">
           <Card className="bg-indigo-900 text-white overflow-hidden border-none shadow-2xl">
             <CardHeader className="text-center">
               <Trophy className="w-12 h-12 text-yellow-400 mx-auto mb-2" />
               <CardTitle className="text-3xl font-black italic">RESULTS</CardTitle>
             </CardHeader>
             <CardContent>
               <div className="space-y-3">
                 {sortedPlayers.map((p, idx) => (
                   <div key={p.id} className="flex justify-between items-center p-3 bg-white/10 rounded-lg">
                     <span className="font-bold">{idx + 1}. {p.name}</span>
                     <span className="font-black text-yellow-400">{p.score} pts</span>
                   </div>
                 ))}
               </div>
               {me?.isHost && (
                 <Button className="w-full mt-6 bg-white text-indigo-900 font-bold hover:bg-slate-100" onClick={() => socket.send(JSON.stringify({ type: "reset" }))}>
                   Next Round
                 </Button>
               )}
             </CardContent>
           </Card>

           <div className="space-y-3">
             <h3 className="font-bold text-slate-500 uppercase text-xs">The Real Prices</h3>
             {gameState.products.sort((a,b) => a.price - b.price).map(p => (
                <div key={p.id} className="flex items-center space-x-4 bg-white p-2 rounded-lg border">
                  <img src={p.image} className="w-12 h-12 rounded object-cover" />
                  <div className="flex-1 font-bold text-sm">{p.name}</div>
                  <div className="font-black text-green-600">${p.price}</div>
                </div>
             ))}
           </div>
        </div>
      )}

      {gameState && (
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-white/80 backdrop-blur border-t flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Users className="w-4 h-4 text-slate-400" />
            <span className="text-xs font-bold text-slate-600">{Object.keys(gameState.players).length} Players</span>
          </div>
          <div className="text-xs font-black text-indigo-600 tracking-widest uppercase">
            {gameState.status}
          </div>
        </div>
      )}
    </main>
  );
}
