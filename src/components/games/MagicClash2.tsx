'use client';

import React, { useState } from 'react';

export default function MagicClash2() {
  const [gameState, setGameState] = useState<'START' | 'PLAYING' | 'GAMEOVER' | 'VICTORY'>('START');
  const [playerHp, setPlayerHp] = useState(100);
  const [enemyHp, setEnemyHp] = useState(100);
  const [mana, setMana] = useState(30);
  const [score, setScore] = useState(0);
  const [log, setLog] = useState<string[]>([]);

  const initGame = () => {
    setPlayerHp(100);
    setEnemyHp(100);
    setMana(40);
    setScore(0);
    setLog(['The Magical Clash has begun! Choose your spell wisely.']);
    setGameState('PLAYING');
  };

  const endGame = (isWin: boolean, currentScore: number) => {
    const finalScore = isWin ? currentScore + playerHp * 10 : currentScore;
    setScore(finalScore);
    setGameState(isWin ? 'VICTORY' : 'GAMEOVER');
    window.dispatchEvent(
      new CustomEvent('xakteir-game-score', { detail: { score: finalScore } })
    );
  };

  const castSpell = (spellType: 'fireball' | 'shield' | 'lightning') => {
    if (gameState !== 'PLAYING') return;

    let pDmg = 0;
    let pHeal = 0;
    let cost = 0;
    let spellName = '';

    if (spellType === 'fireball') {
      if (mana < 15) {
        setLog((prev) => ['Not enough mana for Fireball!', ...prev.slice(0, 4)]);
        return;
      }
      pDmg = Math.floor(20 + Math.random() * 15);
      cost = 15;
      spellName = 'Fireball';
    } else if (spellType === 'shield') {
      if (mana < 10) {
        setLog((prev) => ['Not enough mana for Barrier Shield!', ...prev.slice(0, 4)]);
        return;
      }
      pHeal = Math.floor(15 + Math.random() * 15);
      cost = 10;
      spellName = 'Barrier Shield';
    } else if (spellType === 'lightning') {
      pDmg = Math.floor(10 + Math.random() * 8);
      cost = -15; // gains mana!
      spellName = 'Mana Bolt';
    }

    const newMana = Math.min(100, Math.max(0, mana - cost));
    setMana(newMana);

    const newEnemyHp = Math.max(0, enemyHp - pDmg);
    setEnemyHp(newEnemyHp);

    let newPlayerHp = Math.min(100, playerHp + pHeal);
    const earnedScore = score + (pDmg * 5) + (pHeal * 2);
    setScore(earnedScore);

    const logs = [`Cast ${spellName}! Deal ${pDmg} dmg, restore ${pHeal} HP.`];

    if (newEnemyHp <= 0) {
      setLog([`You defeated the Archmage!`, ...logs]);
      endGame(true, earnedScore);
      return;
    }

    // Enemy turn
    const enemySpells = ['Dark Fire', 'Shadow Beam', 'Soul Drain'];
    const eChoice = enemySpells[Math.floor(Math.random() * enemySpells.length)];
    let eDmg = Math.floor(12 + Math.random() * 15);

    if (spellType === 'shield') {
      eDmg = Math.max(0, eDmg - 10);
    }

    newPlayerHp = Math.max(0, newPlayerHp - eDmg);
    setPlayerHp(newPlayerHp);

    logs.unshift(`Enemy cast ${eChoice} dealing ${eDmg} dmg!`);
    setLog((prev) => [...logs, ...prev.slice(0, 4)]);

    if (newPlayerHp <= 0) {
      endGame(false, earnedScore);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[450px] bg-zinc-950 text-white p-4 rounded-xl shadow-2xl border border-zinc-800 w-full max-w-md mx-auto">
      <h2 className="text-2xl font-bold tracking-wider text-purple-400 mb-2">MAGIC CLASH 2</h2>

      <div className="relative w-full bg-zinc-900 border border-purple-500/30 rounded-lg p-4 min-h-[360px] flex flex-col justify-between">
        {gameState === 'START' && (
          <div className="absolute inset-0 bg-black/85 flex flex-col items-center justify-center p-6 text-center rounded-lg z-10">
            <h3 className="text-xl font-bold text-purple-400 mb-2">Archmage Duel</h3>
            <p className="text-zinc-400 text-sm mb-6">Master elemental spells and mana strategy to conquer the enemy mage.</p>
            <button
              onClick={initGame}
              className="px-6 py-3 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-lg transition-all shadow-lg"
            >
              Begin Duel
            </button>
          </div>
        )}

        {(gameState === 'GAMEOVER' || gameState === 'VICTORY') && (
          <div className="absolute inset-0 bg-black/90 flex flex-col items-center justify-center p-6 text-center rounded-lg z-10">
            <h3 className={`text-2xl font-bold mb-2 ${gameState === 'VICTORY' ? 'text-emerald-400' : 'text-rose-500'}`}>
              {gameState === 'VICTORY' ? 'VICTORY ATTAINED!' : 'DEFEATED IN DUEL'}
            </h3>
            <p className="text-zinc-300 text-lg mb-1">Final Score:</p>
            <p className="text-3xl font-extrabold text-purple-400 mb-6">{score}</p>
            <button
              onClick={initGame}
              className="px-6 py-3 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-lg transition-all shadow-lg"
            >
              Duel Again
            </button>
          </div>
        )}

        {/* Combatants Header */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-zinc-950 p-3 rounded-lg border border-purple-500/20">
            <div className="flex justify-between items-center text-xs mb-1 font-bold text-purple-300">
              <span>PLAYER WIZARD</span>
              <span>{playerHp}/100 HP</span>
            </div>
            <div className="w-full bg-zinc-800 h-2.5 rounded-full overflow-hidden mb-2">
              <div className="bg-emerald-500 h-full transition-all" style={{ width: `${playerHp}%` }} />
            </div>

            <div className="flex justify-between items-center text-xs font-bold text-cyan-300">
              <span>MANA</span>
              <span>{mana}/100</span>
            </div>
            <div className="w-full bg-zinc-800 h-1.5 rounded-full overflow-hidden">
              <div className="bg-cyan-500 h-full transition-all" style={{ width: `${mana}%` }} />
            </div>
          </div>

          <div className="bg-zinc-950 p-3 rounded-lg border border-red-500/20">
            <div className="flex justify-between items-center text-xs mb-1 font-bold text-red-300">
              <span>DARK ARCHMAGE</span>
              <span>{enemyHp}/100 HP</span>
            </div>
            <div className="w-full bg-zinc-800 h-2.5 rounded-full overflow-hidden">
              <div className="bg-red-500 h-full transition-all" style={{ width: `${enemyHp}%` }} />
            </div>
          </div>
        </div>

        {/* Combat Log */}
        <div className="my-3 bg-zinc-950/70 p-3 rounded-lg border border-zinc-800 text-xs flex flex-col gap-1 min-h-[110px]">
          {log.map((entry, idx) => (
            <div key={idx} className={idx === 0 ? 'text-purple-300 font-medium' : 'text-zinc-500'}>
              • {entry}
            </div>
          ))}
        </div>

        {/* Spells Controls */}
        <div className="grid grid-cols-3 gap-2">
          <button
            onClick={() => castSpell('fireball')}
            disabled={gameState !== 'PLAYING'}
            className="flex flex-col items-center justify-center p-2 bg-orange-950/60 border border-orange-500/40 hover:bg-orange-900/60 text-orange-200 rounded-lg transition-all disabled:opacity-50"
          >
            <span className="font-bold text-xs">Fireball</span>
            <span className="text-[10px] text-orange-400">15 Mana</span>
          </button>
          <button
            onClick={() => castSpell('shield')}
            disabled={gameState !== 'PLAYING'}
            className="flex flex-col items-center justify-center p-2 bg-blue-950/60 border border-blue-500/40 hover:bg-blue-900/60 text-blue-200 rounded-lg transition-all disabled:opacity-50"
          >
            <span className="font-bold text-xs">Barrier</span>
            <span className="text-[10px] text-blue-400">10 Mana</span>
          </button>
          <button
            onClick={() => castSpell('lightning')}
            disabled={gameState !== 'PLAYING'}
            className="flex flex-col items-center justify-center p-2 bg-purple-950/60 border border-purple-500/40 hover:bg-purple-900/60 text-purple-200 rounded-lg transition-all disabled:opacity-50"
          >
            <span className="font-bold text-xs">Mana Bolt</span>
            <span className="text-[10px] text-cyan-400">+15 Mana</span>
          </button>
        </div>
      </div>

      <div className="flex justify-between w-full mt-3 text-sm font-semibold text-zinc-400">
        <span>Score: <span className="text-purple-400">{score}</span></span>
        <span>Strategy Turn-Based Duel</span>
      </div>
    </div>
  );
}
