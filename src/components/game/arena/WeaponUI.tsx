"use client";

import { Crosshair, Swords, Wand2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useEffect } from "react";

interface WeaponUIProps {
  activeWeapon: "gun" | "melee" | "wand";
  setActiveWeapon: (w: "gun" | "melee" | "wand") => void;
}

export function WeaponUI({ activeWeapon, setActiveWeapon }: WeaponUIProps) {
  
  // Quick switch using numbers 1, 2, 3
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "1") setActiveWeapon("gun");
      if (e.key === "2") setActiveWeapon("melee");
      if (e.key === "3") setActiveWeapon("wand");
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [setActiveWeapon]);

  return (
    <div className="absolute bottom-8 right-8 flex gap-4 pointer-events-auto">
      <WeaponSlot 
        icon={<Crosshair className="w-8 h-8" />} 
        label="Gun (1)" 
        active={activeWeapon === "gun"} 
        onClick={() => setActiveWeapon("gun")}
        color="from-sky-500 to-blue-600"
      />
      <WeaponSlot 
        icon={<Swords className="w-8 h-8" />} 
        label="Melee (2)" 
        active={activeWeapon === "melee"} 
        onClick={() => setActiveWeapon("melee")}
        color="from-rose-500 to-red-600"
      />
      <WeaponSlot 
        icon={<Wand2 className="w-8 h-8" />} 
        label="Wand (3)" 
        active={activeWeapon === "wand"} 
        onClick={() => setActiveWeapon("wand")}
        color="from-purple-500 to-fuchsia-600"
      />
      
      <div className="absolute bottom-full right-0 mb-4 text-center w-full font-black uppercase text-white/50 text-xs tracking-widest">
        Active Arsenal
      </div>
    </div>
  );
}

function WeaponSlot({ icon, label, active, onClick, color }: any) {
  return (
    <button 
      onClick={onClick}
      className={cn(
        "relative w-20 h-20 rounded-2xl flex flex-col items-center justify-center gap-1 transition-all",
        "border-2 backdrop-blur-md overflow-hidden group",
        active 
          ? `border-white bg-white/20 scale-110 shadow-[0_0_30px_rgba(255,255,255,0.2)]` 
          : "border-white/10 bg-black/40 hover:bg-white/10 text-white/50 hover:text-white"
      )}
    >
      {active && (
        <div className={cn("absolute inset-0 bg-gradient-to-br opacity-50 -z-10", color)} />
      )}
      <div className={cn("transition-transform", active ? "text-white scale-110" : "")}>
        {icon}
      </div>
      <span className={cn("text-[10px] font-bold uppercase tracking-wider", active ? "text-white" : "text-white/50")}>
        {label}
      </span>
    </button>
  );
}
