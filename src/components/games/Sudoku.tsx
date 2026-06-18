"use client";

import { useState, useEffect, useCallback } from "react";

type Board = (number | null)[][];
type Fixed = boolean[][];

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function isValid(board: Board, row: number, col: number, num: number): boolean {
  for (let c = 0; c < 9; c++) if (board[row][c] === num) return false;
  for (let r = 0; r < 9; r++) if (board[r][col] === num) return false;
  const br = Math.floor(row / 3) * 3;
  const bc = Math.floor(col / 3) * 3;
  for (let r = br; r < br + 3; r++)
    for (let c = bc; c < bc + 3; c++)
      if (board[r][c] === num) return false;
  return true;
}

function solve(board: Board): boolean {
  for (let r = 0; r < 9; r++) {
    for (let c = 0; c < 9; c++) {
      if (board[r][c] === null) {
        for (const num of shuffle([1,2,3,4,5,6,7,8,9])) {
          if (isValid(board, r, c, num)) {
            board[r][c] = num;
            if (solve(board)) return true;
            board[r][c] = null;
          }
        }
        return false;
      }
    }
  }
  return true;
}

function generatePuzzle(clues = 32): { puzzle: Board; solution: Board } {
  const solution: Board = Array.from({ length: 9 }, () => Array(9).fill(null));
  solve(solution);
  const puzzle: Board = solution.map(row => [...row]);
  const cells = shuffle(Array.from({ length: 81 }, (_, i) => [Math.floor(i / 9), i % 9]));
  let removed = 0;
  for (const [r, c] of cells) {
    if (removed >= 81 - clues) break;
    puzzle[r][c] = null;
    removed++;
  }
  return { puzzle, solution };
}

function deepCopy(board: Board): Board {
  return board.map(row => [...row]);
}

function formatTime(s: number): string {
  return `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
}

export default function Sudoku() {
  const [puzzle, setPuzzle] = useState<Board>([]);
  const [solution, setSolution] = useState<Board>([]);
  const [fixed, setFixed] = useState<Fixed>([]);
  const [board, setBoard] = useState<Board>([]);
  const [selected, setSelected] = useState<[number, number] | null>(null);
  const [errors, setErrors] = useState<Set<string>>(new Set());
  const [time, setTime] = useState(0);
  const [running, setRunning] = useState(false);
  const [won, setWon] = useState(false);
  const [noteMode, setNoteMode] = useState(false);
  const [notes, setNotes] = useState<number[][][]>([]);

  const startNew = useCallback(() => {
    const { puzzle: p, solution: s } = generatePuzzle(32);
    const fix: Fixed = p.map(row => row.map(cell => cell !== null));
    const initNotes: number[][][] = Array.from({ length: 9 }, () =>
      Array.from({ length: 9 }, () => [])
    );
    setPuzzle(p);
    setSolution(s);
    setFixed(fix);
    setBoard(deepCopy(p));
    setErrors(new Set());
    setSelected(null);
    setTime(0);
    setRunning(true);
    setWon(false);
    setNoteMode(false);
    setNotes(initNotes);
  }, []);

  useEffect(() => { startNew(); }, [startNew]);

  useEffect(() => {
    if (!running) return;
    const id = setInterval(() => setTime(t => t + 1), 1000);
    return () => clearInterval(id);
  }, [running]);

  const checkBoard = useCallback((b: Board, sol: Board) => {
    const errs = new Set<string>();
    for (let r = 0; r < 9; r++)
      for (let c = 0; c < 9; c++)
        if (b[r][c] !== null && b[r][c] !== sol[r][c]) errs.add(`${r}-${c}`);
    setErrors(errs);
    if (b.every(row => row.every(cell => cell !== null)) && errs.size === 0) {
      setWon(true);
      setRunning(false);
    }
  }, []);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (!selected) return;
      const [r, c] = selected;
      if (fixed[r]?.[c]) return;
      const digit = parseInt(e.key);
      if (digit >= 1 && digit <= 9) {
        if (noteMode) {
          setNotes(prev => {
            const next = prev.map(row => row.map(col => [...col]));
            const arr = next[r][c];
            const idx = arr.indexOf(digit);
            if (idx >= 0) arr.splice(idx, 1); else arr.push(digit);
            return next;
          });
        } else {
          setBoard(prev => {
            const next = deepCopy(prev);
            next[r][c] = digit;
            checkBoard(next, solution);
            return next;
          });
          setNotes(prev => {
            const next = prev.map(row => row.map(col => [...col]));
            next[r][c] = [];
            return next;
          });
        }
      } else if (["Backspace","Delete","0"].includes(e.key)) {
        setBoard(prev => {
          const next = deepCopy(prev);
          next[r][c] = null;
          checkBoard(next, solution);
          return next;
        });
        setNotes(prev => {
          const next = prev.map(row => row.map(col => [...col]));
          next[r][c] = [];
          return next;
        });
      } else if (e.key === "ArrowUp" && r > 0) setSelected([r-1, c]);
      else if (e.key === "ArrowDown" && r < 8) setSelected([r+1, c]);
      else if (e.key === "ArrowLeft" && c > 0) setSelected([r, c-1]);
      else if (e.key === "ArrowRight" && c < 8) setSelected([r, c+1]);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [selected, fixed, noteMode, solution, checkBoard]);

  const inputNum = (n: number) => {
    if (!selected) return;
    const [r, c] = selected;
    if (fixed[r]?.[c]) return;
    if (n === 0) {
      setBoard(prev => { const next = deepCopy(prev); next[r][c] = null; checkBoard(next, solution); return next; });
      setNotes(prev => { const next = prev.map(row => row.map(col => [...col])); next[r][c] = []; return next; });
    } else if (noteMode) {
      setNotes(prev => {
        const next = prev.map(row => row.map(col => [...col]));
        const arr = next[r][c];
        const idx = arr.indexOf(n);
        if (idx >= 0) arr.splice(idx, 1); else arr.push(n);
        return next;
      });
    } else {
      setBoard(prev => { const next = deepCopy(prev); next[r][c] = n; checkBoard(next, solution); return next; });
      setNotes(prev => { const next = prev.map(row => row.map(col => [...col])); next[r][c] = []; return next; });
    }
  };

  if (puzzle.length === 0) return null;

  const sel = selected;

  return (
    <div style={{ minHeight: "100vh", background: "radial-gradient(ellipse at center, #0d1117 0%, #020409 100%)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "16px", fontFamily: "monospace" }}>
      
      {/* Title */}
      <h1 style={{ fontSize: "clamp(28px,6vw,40px)", fontWeight: 900, letterSpacing: "0.2em", color: "#00f5ff", textShadow: "0 0 20px #00f5ff, 0 0 40px #00f5ff66", marginBottom: "8px" }}>
        SUDOKU
      </h1>
      
      {/* Stats */}
      <div style={{ display: "flex", gap: "24px", marginBottom: "12px", color: "#888", fontSize: "14px" }}>
        <span>? <span style={{ color: "#00f5ff" }}>{formatTime(time)}</span></span>
        <span style={{ color: errors.size > 0 ? "#ff4466" : "#00ff88" }}>
          {errors.size > 0 ? `? ${errors.size} error${errors.size !== 1 ? "s" : ""}` : won ? "? Solved!" : "? No errors"}
        </span>
      </div>

      {/* Win Banner */}
      {won && (
        <div style={{ marginBottom: "12px", padding: "12px 32px", borderRadius: "12px", background: "linear-gradient(135deg,#00f5ff18,#00ff8818)", border: "2px solid #00f5ff", boxShadow: "0 0 30px #00f5ff66", textAlign: "center" }}>
          <div style={{ fontSize: "22px", fontWeight: 700, color: "#00f5ff" }}>?? Puzzle Solved!</div>
          <div style={{ fontSize: "13px", color: "#888" }}>Time: {formatTime(time)}</div>
        </div>
      )}

      {/* Board */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(9, 1fr)", width: "min(92vw, 468px)", height: "min(92vw, 468px)", border: "2px solid #00f5ff", boxShadow: "0 0 40px #00f5ff44", borderRadius: "4px", overflow: "hidden" }}>
        {board.map((row, r) =>
          row.map((cell, c) => {
            const isSelected = sel?.[0] === r && sel?.[1] === c;
            const isError = errors.has(`${r}-${c}`);
            const isFixed = fixed[r]?.[c];
            const highlighted = sel && (sel[0] === r || sel[1] === c || (Math.floor(sel[0]/3)===Math.floor(r/3) && Math.floor(sel[1]/3)===Math.floor(c/3)));
            const sameNum = sel && board[r][c] !== null && board[sel[0]][sel[1]] !== null && board[r][c] === board[sel[0]][sel[1]] && !(r===sel[0]&&c===sel[1]);

            let bg = "#0a0e17";
            if (highlighted) bg = "#111827";
            if (sameNum) bg = "#1e1b4b";
            if (isSelected) bg = "#1e3a5f";
            if (isError) bg = "#2d0a14";

            const rightBorder = (c+1)%3===0 && c!==8 ? "2px solid #00f5ff" : "1px solid #1f2937";
            const bottomBorder = (r+1)%3===0 && r!==8 ? "2px solid #00f5ff" : "1px solid #1f2937";

            const cellNotes = notes[r]?.[c] ?? [];

            return (
              <div
                key={`${r}-${c}`}
                onClick={() => setSelected([r, c])}
                style={{
                  background: bg,
                  borderRight: rightBorder,
                  borderBottom: bottomBorder,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "pointer",
                  userSelect: "none",
                  transition: "background 0.1s",
                  position: "relative",
                }}
              >
                {cell !== null ? (
                  <span style={{
                    fontSize: "clamp(13px,3vw,21px)",
                    fontWeight: 700,
                    color: isError ? "#ff4466" : isFixed ? "#ffffff" : "#00f5ff",
                    textShadow: isError ? "0 0 8px #ff446688" : isFixed ? "0 0 6px #ffffff44" : "0 0 8px #00f5ff88",
                  }}>{cell}</span>
                ) : cellNotes.length > 0 ? (
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", width: "100%", height: "100%", padding: "1px" }}>
                    {[1,2,3,4,5,6,7,8,9].map(n => (
                      <div key={n} style={{ display: "flex", alignItems: "center", justifyContent: "center", fontSize: "clamp(5px,0.9vw,8px)", color: cellNotes.includes(n) ? "#a78bfa" : "transparent" }}>
                        {n}
                      </div>
                    ))}
                  </div>
                ) : null}
              </div>
            );
          })
        )}
      </div>

      {/* Number Pad */}
      <div style={{ display: "flex", gap: "6px", marginTop: "16px", flexWrap: "wrap", justifyContent: "center" }}>
        {[1,2,3,4,5,6,7,8,9].map(n => (
          <button
            key={n}
            onClick={() => inputNum(n)}
            style={{ width: "42px", height: "42px", borderRadius: "6px", fontWeight: 700, fontSize: "18px", background: "#0d1117", border: "1px solid #00f5ff44", color: "#00f5ff", cursor: "pointer", transition: "all 0.15s", boxShadow: "0 0 8px #00f5ff22" }}
            onMouseEnter={e => { e.currentTarget.style.boxShadow = "0 0 16px #00f5ff99"; e.currentTarget.style.borderColor = "#00f5ff"; }}
            onMouseLeave={e => { e.currentTarget.style.boxShadow = "0 0 8px #00f5ff22"; e.currentTarget.style.borderColor = "#00f5ff44"; }}
          >{n}</button>
        ))}
        <button
          onClick={() => inputNum(0)}
          style={{ width: "42px", height: "42px", borderRadius: "6px", fontWeight: 700, fontSize: "16px", background: "#0d1117", border: "1px solid #ff446644", color: "#ff6688", cursor: "pointer", boxShadow: "0 0 8px #ff446622" }}
        >?</button>
      </div>

      {/* Controls */}
      <div style={{ display: "flex", gap: "10px", marginTop: "12px", flexWrap: "wrap", justifyContent: "center" }}>
        <button
          onClick={() => setNoteMode(m => !m)}
          style={{ padding: "8px 18px", borderRadius: "8px", fontWeight: 700, fontSize: "13px", cursor: "pointer", transition: "all 0.15s", background: noteMode ? "#2e1065" : "#0d1117", border: `1px solid ${noteMode ? "#a855f7" : "#a855f744"}`, color: noteMode ? "#e879f9" : "#a855f7", boxShadow: noteMode ? "0 0 15px #a855f766" : "0 0 6px #a855f722" }}
        >? Notes {noteMode ? "ON" : "OFF"}</button>
        <button
          onClick={startNew}
          style={{ padding: "8px 18px", borderRadius: "8px", fontWeight: 700, fontSize: "13px", cursor: "pointer", background: "#0d1117", border: "1px solid #00ff8844", color: "#00ff88", boxShadow: "0 0 6px #00ff8822" }}
          onMouseEnter={e => { e.currentTarget.style.boxShadow = "0 0 16px #00ff8899"; }}
          onMouseLeave={e => { e.currentTarget.style.boxShadow = "0 0 6px #00ff8822"; }}
        >? New Game</button>
      </div>

      <p style={{ marginTop: "14px", fontSize: "11px", color: "#333", textAlign: "center" }}>
        Click a cell · Type 1–9 to fill · Backspace to clear · Arrow keys to move
      </p>
    </div>
  );
}
