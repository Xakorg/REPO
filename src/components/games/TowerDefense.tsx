"use client";
import { useEffect, useRef, useState } from "react";

type Tower = { x: number; y: number; range: number; cost: number; dmg: number; color: string; cooldown: number; timer: number; label: string };
type Enemy = { x: number; y: number; hp: number; maxHp: number; speed: number; id: number };
type Projectile = { x: number; y: number; tx: number; ty: number; color: string };

export default function TowerDefense() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [gold, setGold] = useState(100);
  const [lives, setLives] = useState(20);
  const [wave, setWave] = useState(1);
  const [selectedTower, setSelectedTower] = useState(0);

  const TOWER_TYPES = [
    { label: "🏹 Archer", cost: 30, range: 120, dmg: 10, cooldown: 40, color: "#22c55e" },
    { label: "💥 Cannon", cost: 80, range: 100, dmg: 30, cooldown: 80, color: "#f97316" },
    { label: "❄️ Frost", cost: 60, range: 140, dmg: 5, cooldown: 30, color: "#06b6d4" },
  ];

  const stateRef = useRef({
    towers: [] as Tower[],
    enemies: [] as Enemy[],
    projectiles: [] as Projectile[],
    gold: 100, lives: 20, wave: 1, enemyId: 0,
    spawnTimer: 0, waveEnemies: 10, spawned: 0
  });

  useEffect(() => {
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext("2d")!;
    const W = canvas.width, H = canvas.height;
    const s = stateRef.current;

    // Path waypoints
    const PATH = [[0,240],[160,240],[160,120],[320,120],[320,360],[480,360],[480,200],[640,200]];

    const handleClick = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      const mx = (e.clientX - rect.left) * (W / rect.width);
      const my = (e.clientY - rect.top) * (H / rect.height);
      const type = TOWER_TYPES[selectedTower];
      if (s.gold >= type.cost) {
        s.towers.push({ x: mx, y: my, range: type.range, cost: type.cost, dmg: type.dmg, color: type.color, cooldown: type.cooldown, timer: 0, label: type.label });
        s.gold -= type.cost;
        setGold(s.gold);
      }
    };
    canvas.addEventListener("click", handleClick);

    let frame: number;
    const tick = () => {
      // Spawn enemies
      s.spawnTimer++;
      if (s.spawnTimer > 60 && s.spawned < s.waveEnemies) {
        s.enemies.push({ x: 0, y: 240, hp: 30 + s.wave * 20, maxHp: 30 + s.wave * 20, speed: 1.5 + s.wave * 0.2, id: s.enemyId++ });
        s.spawnTimer = 0; s.spawned++;
      }
      if (s.spawned >= s.waveEnemies && s.enemies.length === 0) {
        s.wave++; s.spawned = 0; s.waveEnemies = 10 + s.wave * 3; s.gold += 50;
        setWave(s.wave); setGold(s.gold);
      }

      // Move enemies
      for (const enemy of s.enemies) {
        let nextX = enemy.x, nextY = enemy.y;
        for (let i = 1; i < PATH.length; i++) {
          const [tx, ty] = PATH[i]; const [px, py] = PATH[i-1];
          const dx = tx - px, dy = ty - py;
          const len = Math.sqrt(dx*dx+dy*dy);
          if (enemy.x >= Math.min(px,tx)-5 && enemy.x <= Math.max(px,tx)+5) {
            nextX += (dx/len) * enemy.speed;
            nextY += (dy/len) * enemy.speed;
            break;
          }
        }
        enemy.x = nextX; enemy.y = nextY;
        if (enemy.x > W) { s.lives--; enemy.hp = 0; setLives(s.lives); }
      }
      s.enemies = s.enemies.filter(e => e.hp > 0);

      // Tower attacks
      for (const tower of s.towers) {
        tower.timer++;
        if (tower.timer < tower.cooldown) continue;
        const target = s.enemies.find(e => Math.sqrt((e.x-tower.x)**2+(e.y-tower.y)**2) < tower.range);
        if (target) {
          target.hp -= tower.dmg;
          s.projectiles.push({ x: tower.x, y: tower.y, tx: target.x, ty: target.y, color: tower.color });
          if (target.hp <= 0) { s.gold += 10; setGold(s.gold); }
          tower.timer = 0;
        }
      }
      s.projectiles = s.projectiles.filter(p => Math.sqrt((p.x-p.tx)**2+(p.y-p.ty)**2) > 5);
      s.projectiles.forEach(p => { p.x += (p.tx-p.x)*0.3; p.y += (p.ty-p.y)*0.3; });

      // Draw
      ctx.fillStyle = "#14532d";
      ctx.fillRect(0, 0, W, H);

      // Path
      ctx.strokeStyle = "#92400e";
      ctx.lineWidth = 40;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.beginPath();
      ctx.moveTo(PATH[0][0], PATH[0][1]);
      PATH.forEach(([x,y]) => ctx.lineTo(x, y));
      ctx.stroke();

      // Towers
      for (const t of s.towers) {
        ctx.fillStyle = t.color;
        ctx.shadowColor = t.color; ctx.shadowBlur = 10;
        ctx.beginPath(); ctx.arc(t.x, t.y, 14, 0, Math.PI*2); ctx.fill();
        ctx.strokeStyle = "white"; ctx.lineWidth = 2;
        ctx.stroke();
        ctx.shadowBlur = 0;
        ctx.font = "16px serif"; ctx.textAlign = "center";
        ctx.fillText(t.label.split(" ")[0], t.x, t.y + 5);
      }

      // Enemies
      for (const e of s.enemies) {
        ctx.fillStyle = "#ef4444";
        ctx.shadowColor = "#ef4444"; ctx.shadowBlur = 8;
        ctx.beginPath(); ctx.arc(e.x, e.y, 12, 0, Math.PI*2); ctx.fill();
        ctx.shadowBlur = 0;
        // HP bar
        ctx.fillStyle = "#1f2937"; ctx.fillRect(e.x - 15, e.y - 22, 30, 5);
        ctx.fillStyle = "#22c55e"; ctx.fillRect(e.x - 15, e.y - 22, 30 * (e.hp / e.maxHp), 5);
      }

      // Projectiles
      for (const p of s.projectiles) {
        ctx.fillStyle = p.color;
        ctx.shadowColor = p.color; ctx.shadowBlur = 10;
        ctx.beginPath(); ctx.arc(p.x, p.y, 4, 0, Math.PI*2); ctx.fill();
        ctx.shadowBlur = 0;
      }

      // HUD
      ctx.fillStyle = "rgba(0,0,0,0.5)";
      ctx.fillRect(0, 0, W, 35);
      ctx.fillStyle = "white";
      ctx.font = "bold 14px monospace";
      ctx.textAlign = "left";
      ctx.fillText(`💰 ${s.gold}  ❤️ ${s.lives}  Wave: ${s.wave}`, 10, 23);

      if (s.lives <= 0) {
        ctx.fillStyle = "rgba(0,0,0,0.8)"; ctx.fillRect(0,0,W,H);
        ctx.fillStyle = "white"; ctx.font = "bold 42px monospace"; ctx.textAlign = "center";
        ctx.fillText("GAME OVER", W/2, H/2);
        ctx.font = "22px monospace";
        ctx.fillText(`Wave ${s.wave}`, W/2, H/2+50);
      }

      frame = requestAnimationFrame(tick);
    };
    tick();
    return () => { canvas.removeEventListener("click", handleClick); cancelAnimationFrame(frame); };
  }, [selectedTower]);

  return (
    <div className="w-full h-full flex flex-col bg-[#14532d]">
      <canvas ref={canvasRef} width={640} height={400} className="w-full object-contain border-b border-white/10" />
      <div className="p-3 bg-zinc-900 flex gap-3 items-center">
        <span className="text-white text-sm font-bold">Place Tower:</span>
        {TOWER_TYPES.map((t, i) => (
          <button key={i} onClick={() => setSelectedTower(i)}
            className={`px-4 py-2 rounded-xl text-sm font-bold border-2 transition-all ${selectedTower === i ? "border-white bg-white/20 text-white" : "border-zinc-600 bg-zinc-800 text-zinc-300"}`}>
            {t.label} <span className="text-amber-400">({t.cost}g)</span>
          </button>
        ))}
        <span className="text-zinc-400 text-xs ml-2">Click the map to place</span>
      </div>
    </div>
  );
}
