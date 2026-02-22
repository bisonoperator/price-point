"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ShoppingCart, Users, Play } from "lucide-react";

export default function Home() {
  const [name, setName] = useState("");
  const [room, setRoom] = useState("");
  const [joined, setJoined] = useState(false);

  return (
    <main className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
      <div className="max-w-md w-full space-y-8 text-center">
        <div className="flex flex-col items-center space-y-2">
          <div className="p-3 bg-indigo-600 rounded-2xl shadow-lg">
            <ShoppingCart className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-4xl font-extrabold tracking-tight text-slate-900">
            Price Point
          </h1>
          <p className="text-slate-500">Order the items. Win the game.</p>
        </div>

        {!joined ? (
          <Card className="border-2 shadow-xl">
            <CardHeader>
              <CardTitle>Join a Game</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2 text-left">
                <label className="text-sm font-medium">Your Name</label>
                <Input 
                  placeholder="Enter your name" 
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="h-12 text-lg"
                />
              </div>
              <div className="space-y-2 text-left">
                <label className="text-sm font-medium">Room Code (Optional)</label>
                <Input 
                  placeholder="Leave empty for new room" 
                  value={room}
                  onChange={(e) => setRoom(e.target.value)}
                  className="h-12 text-lg uppercase font-mono"
                  maxLength={4}
                />
              </div>
              <Button 
                className="w-full h-12 text-lg font-bold bg-indigo-600 hover:bg-indigo-700 transition-all active:scale-95"
                onClick={() => setJoined(true)}
                disabled={!name}
              >
                Let's Go!
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6 animate-in fade-in zoom-in duration-300">
            <Card className="border-2 shadow-md">
              <CardHeader className="pb-2">
                <div className="flex justify-between items-center">
                  <Badge variant="outline" className="text-indigo-600 border-indigo-200">
                    Lobby: {room || "AUTO"}
                  </Badge>
                  <div className="flex items-center text-slate-500 text-sm">
                    <Users className="w-4 h-4 mr-1" />
                    <span>1/8 Players</span>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="py-8 space-y-4 text-center">
                  <div className="animate-pulse flex justify-center">
                    <div className="w-12 h-12 rounded-full bg-indigo-100 flex items-center justify-center">
                       <Play className="w-6 h-6 text-indigo-400 ml-1" />
                    </div>
                  </div>
                  <p className="text-slate-600 font-medium">Waiting for the host to start...</p>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center space-x-2">
                    <div className="w-2 h-2 rounded-full bg-green-500" />
                    <span className="font-semibold text-indigo-900">{name} (You)</span>
                    <Badge className="bg-indigo-200 text-indigo-700 hover:bg-indigo-200 text-[10px] h-4">Host</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Button className="w-full bg-green-600 hover:bg-green-700 h-12 text-lg font-bold shadow-lg">
              Start Game
            </Button>
          </div>
        )}
      </div>
      
      <div className="fixed bottom-4 text-xs text-slate-400">
        Deployed on Vercel • Powered by PartyKit
      </div>
    </main>
  );
}
