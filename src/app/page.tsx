"use client";

import { useState, useEffect } from "react";
import usePartySocket from "partysocket/react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ShoppingCart, Users, Play, Trophy, ArrowRight, CheckCircle2, GripVertical, Info } from "lucide-react";
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragOverlay, defaultDropAnimationSideEffects } from "@dnd-kit/core";
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy, useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { motion, AnimatePresence } from "framer-motion";

type Product = { id: string; name: string; price: number; image: string };
type Player = { id: string; name: string; score: number; isHost: boolean; submission: string[] | null };
type GameState = { status: "lobby" | "playing" | "result"; products: Product[]; players: Record<string, Player>; round: number };

const dropAnimationConfig = {
  sideEffects: defaultDropAnimationSideEffects({
    styles: {
      active: {
        opacity: "0.5",
      },
    },
  }),
};

function SortableItem({ product, isOverlay = false }: { product: Product; isOverlay?: boolean }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: product.id });
  
  const style = {
    transform: CSS.Translate.toString(transform),
    transition,
    opacity: isDragging ? 0.3 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners} className={`touch-none mb-3 ${isOverlay ? 'z-50' : ''}`}>
      <Card className={`overflow-hidden border-2 transition-all duration-200 ${isOverlay ? 'border-indigo-500 shadow-2xl scale-105' : 'border-slate-100 hover:border-indigo-200 shadow-sm'}`}>
        <CardContent className="p-0 flex items-center">
          <div className="w-20 h-20 flex-shrink-0 bg-slate-100">
            <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
          </div>
          <div className="flex-1 p-3 min-w-0">
            <h3 className="font-bold text-slate-800 text-sm line-clamp-2 leading-tight">{product.name}</h3>
          </div>
          <div className="px-3 text-slate-300">
            <GripVertical className="w-5 h-5" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function Home() {
  const [name, setName] = useState("");
  const [room, setRoom] = useState("");

  // Generate random 4-letter room code on mount
  useEffect(() => {
    if (!room) {
      const randomCode = Math.random().toString(36).substring(2, 6).toUpperCase();
      setRoom(randomCode);
    }
  }, [room]);

  const [joined, setJoined] = useState(false);
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [items, setItems] = useState<Product[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);

  const socket = usePartySocket({
    host: process.env.NEXT_PUBLIC_PARTYKIT_HOST || "localhost:1999",
    room: (room.trim() || "default").toLowerCase(),
    onOpen() {
      if (joined && name) {
        socket.send(JSON.stringify({ type: "join", name }));
      }
    },
    onMessage(evt) {
      const data = JSON.parse(evt.data);
      if (data.type === "state") {
        setGameState(data.state);
        // Sync items when game starts or items change
        if (data.state.status === "playing") {
          // Only update if the products actually changed (new round)
          const currentIds = items.map(i => i.id).join(',');
          const newIds = data.state.products.map((i: any) => i.id).join(',');
          if (currentIds !== newIds) {
            setItems(data.state.products);
          }
        }
      }
    },
  });

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleJoin = () => {
    if (!name) return;
    socket.send(JSON.stringify({ type: "join", name }));
    setJoined(true);
  };

  const handleStart = () => {
    socket.send(JSON.stringify({ type: "start" }));
  };

  const handleSubmit = () => {
    socket.send(JSON.stringify({ type: "submit", submission: items.map(i => i.id) }));
  };

  const handleDragStart = (event: any) => {
    setActiveId(event.active.id);
  };

  const handleDragEnd = (event: any) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      setItems((items) => {
        const oldIndex = items.findIndex((i) => i.id === active.id);
        const newIndex = items.findIndex((i) => i.id === over.id);
        return arrayMove(items, oldIndex, newIndex);
      });
    }
    setActiveId(null);
  };

  const me = gameState?.players[socket.id];
  const sortedPlayers = Object.values(gameState?.players || {}).sort((a, b) => b.score - a.score);
  const activeProduct = items.find(i => i.id === activeId);

  return (
    <div className="min-h-[100dvh] bg-[#F8FAFC] text-slate-900 font-sans selection:bg-indigo-100">
      {/* Dynamic Background Blur */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-100 blur-[120px] rounded-full opacity-50" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-100 blur-[120px] rounded-full opacity-50" />
      </div>

      <main className="relative z-10 max-w-md mx-auto px-4 pt-8 pb-24 min-h-[100dvh] flex flex-col">
        {!joined ? (
          <motion.div 
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            className="flex-1 flex flex-col items-center justify-center space-y-10"
          >
            <div className="text-center space-y-4">
              <div className="inline-flex p-4 bg-white shadow-[0_10px_30px_-10px_rgba(0,0,0,0.04)] rounded-3xl mb-2">
                <ShoppingCart className="w-12 h-12 text-indigo-600" strokeWidth={2.5} />
              </div>
              <h1 className="text-5xl font-black tracking-tight bg-clip-text text-transparent bg-gradient-to-br from-slate-900 to-slate-600">
                Price Point
              </h1>
              <p className="text-slate-500 font-medium">The multiplayer price sorting game.</p>
            </div>

            <Card className="w-full border-none shadow-[0_20px_50px_-12px_rgba(0,0,0,0.08)] bg-white/80 backdrop-blur-xl p-6 space-y-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400 ml-1">Nickname</label>
                  <Input 
                    placeholder="Enter your name" 
                    value={name} 
                    onChange={(e) => setName(e.target.value)} 
                    className="h-14 bg-slate-50 border-none text-lg font-semibold rounded-2xl focus-visible:ring-2 focus-visible:ring-indigo-500/20"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400 ml-1">Room Code</label>
                  <Input 
                    placeholder="DEFAULT" 
                    value={room} 
                    onChange={(e) => setRoom(e.target.value)} 
                    className="h-14 bg-slate-50 border-none text-lg font-mono rounded-2xl focus-visible:ring-2 focus-visible:ring-indigo-500/20 uppercase"
                  />
                </div>
              </div>
              <Button 
                className="w-full h-14 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl text-lg font-bold shadow-indigo-200 shadow-lg transition-all active:scale-[0.98]" 
                onClick={handleJoin} 
                disabled={!name}
              >
                Join Lobby
              </Button>
            </Card>
            
            <div className="flex items-center space-x-2 text-slate-400 text-xs">
              <Info className="w-3 h-3" />
              <span>Invite friends to the same room code to play together</span>
            </div>
          </motion.div>
        ) : (
          <div className="flex-1 flex flex-col">
            <header className="flex justify-between items-center mb-8">
              <div className="flex flex-col">
                <h2 className="text-xl font-black tracking-tighter text-indigo-600 uppercase">Price Point</h2>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Room: {room}</span>
              </div>
              <div className="flex items-center bg-white px-3 py-1.5 rounded-full shadow-[0_10px_30px_-10px_rgba(0,0,0,0.04)] border border-slate-50">
                <Users className="w-3.5 h-3.5 text-slate-400 mr-2" />
                <span className="text-xs font-bold text-slate-600">{Object.keys(gameState?.players || {}).length}</span>
              </div>
            </header>

            <AnimatePresence mode="wait">
              {gameState?.status === "lobby" && (
                <motion.div 
                  key="lobby"
                  initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
                  className="space-y-6 flex-1 flex flex-col"
                >
                  <Card className="border-none shadow-[0_10px_30px_-10px_rgba(0,0,0,0.04)] bg-white/60 p-6 flex-1">
                    <h3 className="text-sm font-bold uppercase tracking-widest text-slate-400 mb-6">Players Waiting</h3>
                    <div className="space-y-3">
                      {sortedPlayers.map(p => (
                        <motion.div 
                          layout
                          key={p.id} 
                          className="p-4 rounded-2xl bg-white border border-slate-100 flex justify-between items-center shadow-sm"
                        >
                          <div className="flex items-center space-x-3">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs ${p.id === socket.id ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600'}`}>
                              {p.name.charAt(0).toUpperCase()}
                            </div>
                            <span className="font-bold text-slate-700">{p.name} {p.id === socket.id && <span className="text-indigo-400 font-medium text-xs ml-1">(You)</span>}</span>
                          </div>
                          {p.isHost && <Badge className="bg-indigo-50 text-indigo-600 border-none hover:bg-indigo-50 font-bold text-[10px]">HOST</Badge>}
                        </motion.div>
                      ))}
                    </div>
                  </Card>
                  
                  {me?.isHost ? (
                    <Button 
                      className="w-full bg-slate-900 hover:bg-black h-16 rounded-2xl text-lg font-bold shadow-xl transition-all active:scale-[0.98]" 
                      onClick={handleStart}
                      disabled={Object.keys(gameState.players).length < 1}
                    >
                      Start Round 1
                    </Button>
                  ) : (
                    <div className="p-6 bg-white/40 rounded-2xl border-2 border-dashed border-slate-200 text-center">
                      <p className="text-slate-400 font-medium">Waiting for host to start...</p>
                    </div>
                  )}
                </motion.div>
              )}

              {gameState?.status === "playing" && (
                <motion.div 
                  key="playing"
                  initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 1.05 }}
                  className="space-y-6 flex-1 flex flex-col"
                >
                  <div className="space-y-1">
                    <h2 className="text-2xl font-black text-slate-900">Sort the Items</h2>
                    <p className="text-slate-500 font-medium">Drag from <span className="text-green-600 font-bold">Cheapest</span> to <span className="text-red-500 font-bold">Most Expensive</span>.</p>
                  </div>

                  {me?.submission ? (
                    <div className="flex-1 flex flex-col items-center justify-center space-y-6 py-12">
                      <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center">
                        <CheckCircle2 className="w-10 h-10 text-green-600" />
                      </div>
                      <div className="text-center">
                        <h3 className="text-xl font-bold text-slate-900">Submission Locked</h3>
                        <p className="text-slate-500">Waiting for other players to finish...</p>
                      </div>
                    </div>
                  ) : (
                    <div className="flex-1">
                      <DndContext 
                        sensors={sensors} 
                        collisionDetection={closestCenter} 
                        onDragStart={handleDragStart}
                        onDragEnd={handleDragEnd}
                      >
                        <SortableContext items={items.map(i => i.id)} strategy={verticalListSortingStrategy}>
                          <div className="relative">
                            {/* Visual cues for the list */}
                            <div className="absolute left-[-10px] top-0 bottom-0 w-1 bg-gradient-to-b from-green-400 via-slate-200 to-red-400 rounded-full opacity-30" />
                            {items.map(item => <SortableItem key={item.id} product={item} />)}
                          </div>
                        </SortableContext>
                        <DragOverlay dropAnimation={dropAnimationConfig}>
                          {activeId ? <SortableItem product={activeProduct!} isOverlay /> : null}
                        </DragOverlay>
                      </DndContext>
                      
                      <Button className="w-full h-16 bg-indigo-600 text-white rounded-2xl text-xl font-black shadow-indigo-200 shadow-xl mt-6 transition-all active:scale-[0.98]" onClick={handleSubmit}>
                        LOCK ORDER <ArrowRight className="ml-2 w-6 h-6" />
                      </Button>
                    </div>
                  )}
                </motion.div>
              )}

              {gameState?.status === "result" && (
                <motion.div 
                  key="result"
                  initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }}
                  className="space-y-8"
                >
                  <Card className="bg-slate-900 text-white border-none shadow-[0_20px_50px_-12px_rgba(0,0,0,0.08)] rounded-[2rem] overflow-hidden">
                    <div className="p-8 text-center space-y-2 bg-gradient-to-b from-slate-800 to-slate-900">
                      <Trophy className="w-12 h-12 text-yellow-400 mx-auto mb-2" />
                      <h3 className="text-3xl font-black italic tracking-tighter uppercase">Leaderboard</h3>
                    </div>
                    <div className="p-6 space-y-3">
                      {sortedPlayers.map((p, idx) => (
                        <div key={p.id} className={`flex justify-between items-center p-4 rounded-2xl ${idx === 0 ? 'bg-indigo-600' : 'bg-white/5 border border-white/10'}`}>
                          <div className="flex items-center space-x-3">
                            <span className={`text-xs font-black w-5 ${idx === 0 ? 'text-indigo-200' : 'text-slate-500'}`}>{idx + 1}</span>
                            <span className="font-bold">{p.name}</span>
                          </div>
                          <span className={`font-black ${idx === 0 ? 'text-white' : 'text-indigo-400'}`}>{p.score}</span>
                        </div>
                      ))}
                    </div>
                  </Card>

                  <div className="space-y-4">
                    <h3 className="font-bold text-slate-500 uppercase text-[10px] tracking-widest ml-1">The Truth</h3>
                    <div className="space-y-3">
                      {[...gameState.products].sort((a,b) => a.price - b.price).map((p, idx) => (
                        <motion.div 
                          initial={{ opacity: 0, x: -10 }} 
                          animate={{ opacity: 1, x: 0 }} 
                          transition={{ delay: idx * 0.1 }}
                          key={p.id} 
                          className="flex items-center space-x-4 bg-white p-3 rounded-2xl border border-slate-100 shadow-sm"
                        >
                          <img src={p.image} className="w-14 h-14 rounded-xl object-cover" />
                          <div className="flex-1 min-w-0">
                            <div className="font-bold text-slate-800 text-sm truncate">{p.name}</div>
                            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">Rank #{idx + 1}</div>
                          </div>
                          <div className="font-black text-green-600 text-lg">${p.price}</div>
                        </motion.div>
                      ))}
                    </div>
                  </div>

                  {me?.isHost && (
                    <Button 
                      className="w-full h-16 bg-slate-900 text-white rounded-2xl text-lg font-bold shadow-xl transition-all active:scale-[0.98]" 
                      onClick={() => socket.send(JSON.stringify({ type: "reset" }))}
                    >
                      Next Round
                    </Button>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}
      </main>

      <style jsx global>{`
        /* Prevents pull-to-refresh on mobile while dragging */
        body {
          overscroll-behavior-y: contain;
        }
      `}</style>
    </div>
  );
}
