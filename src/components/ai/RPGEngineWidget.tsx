"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Gamepad2, Shield, Heart, Zap, Dices, RefreshCw } from "lucide-react";

export function RPGEngineWidget() {
  const [hp, setHp] = useState(100);
  const [xp, setXp] = useState(0);
  const [level, setLevel] = useState(1);
  const [inventory, setInventory] = useState<string[]>(["Wooden Sword", "Health Potion"]);
  const [log, setLog] = useState<string[]>(["You enter the Dark Dungeon of Xakteir..."]);

  const rollDice = () => {
    const roll = Math.floor(Math.random() * 20) + 1;
    let event = "";
    if (roll >= 15) {
      const gainedXp = roll * 5;
      setXp((prev) => prev + gainedXp);
      event = `🎯 Critical Hit! You defeated a Shadow Goblin (+${gainedXp} XP)`;
      if (xp + gainedXp >= level * 100) {
        setLevel((prev) => prev + 1);
        event += " 🎉 LEVEL UP!";
      }
    } else if (roll >= 8) {
      setHp((prev) => Math.max(prev - 10, 0));
      event = `⚔️ Battle! You took 10 damage from an Orc.`;
    } else {
      setInventory((prev) => [...prev, "Magic Scroll"]);
      event = `📜 Found item: Magic Scroll!`;
    }

    setLog((prev) => [event, ...prev.slice(0, 5)]);
  };

  const heal = () => {
    if (!inventory.includes("Health Potion")) return;
    setHp((prev) => Math.min(prev + 30, 100));
    setInventory((prev) => {
      const idx = prev.indexOf("Health Potion");
      return prev.filter((_, i) => i !== idx);
    });
    setLog((prev) => ["🧪 Used Health Potion (+30 HP)", ...prev.slice(0, 5)]);
  };

  return (
    <div className="my-4 rounded-xl border border-emerald-500/30 bg-[#06120e]/90 backdrop-blur-md overflow-hidden p-4 shadow-xl text-xs">
      <div className="flex items-center justify-between border-b border-emerald-500/20 pb-3 mb-3">
        <div className="flex items-center space-x-2">
          <Gamepad2 className="h-4 w-4 text-emerald-400" />
          <span className="font-semibold text-emerald-200">RPG Dungeon Console (Level {level})</span>
        </div>
        <div className="flex items-center space-x-3 text-emerald-300 font-mono">
          <span className="flex items-center"><Heart className="h-3.5 w-3.5 mr-1 text-red-400 fill-red-400" /> {hp}/100</span>
          <span className="flex items-center"><Zap className="h-3.5 w-3.5 mr-1 text-amber-400 fill-amber-400" /> {xp} XP</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
        <div className="bg-black/40 rounded-lg p-3 border border-emerald-500/10 font-mono text-[11px] space-y-1 text-emerald-200 min-h-[100px]">
          {log.map((entry, idx) => (
            <div key={idx} className={idx === 0 ? "text-emerald-400 font-bold" : "text-gray-400"}>
              {entry}
            </div>
          ))}
        </div>

        <div className="bg-black/30 rounded-lg p-3 border border-emerald-500/10 space-y-2">
          <span className="font-semibold text-gray-300 block">Inventory ({inventory.length}):</span>
          <div className="flex flex-wrap gap-1">
            {inventory.map((item, idx) => (
              <span key={idx} className="bg-emerald-950/60 border border-emerald-500/30 px-2 py-0.5 rounded text-[10px] text-emerald-300">
                {item}
              </span>
            ))}
          </div>
        </div>
      </div>

      <div className="flex items-center space-x-2">
        <Button size="xs" onClick={rollDice} disabled={hp <= 0} className="bg-emerald-600 hover:bg-emerald-500 text-white">
          <Dices className="h-3.5 w-3.5 mr-1" /> Roll d20 Adventure
        </Button>
        {inventory.includes("Health Potion") && (
          <Button size="xs" variant="outline" onClick={heal} className="border-emerald-500/30 text-emerald-300">
            Use Potion (+30 HP)
          </Button>
        )}
      </div>
    </div>
  );
}
