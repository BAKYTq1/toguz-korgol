/**
 * Board — the main Canvas component.
 * Handles render loop, animation, drag & drop, AI moves.
 */

import { useEffect, useRef, useCallback } from 'react';
import { GameState, ownerOf, legalMoves, MoveResult } from '../game/engine';
import { getAIMove, AIDifficulty } from '../game/ai';
import {
  computeLayout,
  pitAt,
  pitCenter,
  kazanCenter,
  toLogical,
  renderScene,
  createFlyingBead,
  FlyingBead,
} from '../game/renderer';
import { useSound } from '../hooks/useSound';

interface BoardProps {
  game: GameState;
  onMove: (idx: number) => MoveResult | null;
  onAnimDone: () => void;
  soundEnabled: boolean;
  aiEnabled: boolean;
  aiDifficulty: AIDifficulty;
  aiPlayer: 0 | 1;
  mpEnabled: boolean;
  mpMyPlayer: 0 | 1 | null;
  onMoveForMP?: (idx: number) => void;
}

export default function Board({
  game,
  onMove,
  onAnimDone,
  soundEnabled,
  aiEnabled,
  aiDifficulty,
  aiPlayer,
  mpEnabled,
  mpMyPlayer,
  onMoveForMP,
}: BoardProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const layoutRef = useRef(computeLayout(window.innerWidth, window.innerHeight, 132, 74));
  const rafRef = useRef<number>(0);

  // Visual state (interpolated during animation)
  const visualPitsRef = useRef<number[]>(game.pits.slice());
  const visualKazanRef = useRef<[number, number]>([...game.kazan] as [number, number]);
  const flyingRef = useRef<FlyingBead[]>([]);
  const animatingRef = useRef(false);
  const nowRef = useRef(0);

  // Drag state
  const draggingRef = useRef(false);
  const dragIdxRef = useRef(-1);
  const dragPtRef = useRef<{ x: number; y: number } | null>(null);
  const dragCountRef = useRef(0);

  // Invalid flash
  const invalidFlashesRef = useRef<Record<number, number>>({});

  const sound = useSound(soundEnabled);

  // Sync visual when game changes from outside (restart)
  useEffect(() => {
    if (!animatingRef.current) {
      visualPitsRef.current = game.pits.slice();
      visualKazanRef.current = [...game.kazan] as [number, number];
    }
  }, [game]);

  // ─── AI move ────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!aiEnabled || game.gameOver || animatingRef.current) return;
    if (game.current !== aiPlayer) return;
    if (legalMoves(game, game.current).length === 0) return;

    const timer = setTimeout(() => {
      if (animatingRef.current || game.current !== aiPlayer) return;
      const idx = getAIMove(game, aiDifficulty);
      if (idx === -1) return;
      executeMove(idx);
    }, 480);

    return () => clearTimeout(timer);
  });

  // ─── Move execution with animation ─────────────────────────────────────────
  const executeMove = useCallback((startIdx: number) => {
    if (animatingRef.current || game.gameOver) return;
    if (ownerOf(startIdx) !== game.current) return;
    if (game.pits[startIdx] <= 0) return;

    const result = onMove(startIdx);
    if (!result) return;

    if (onMoveForMP) onMoveForMP(startIdx);

    sound.playPick();

    const beforePits = game.pits.slice();
    beforePits[startIdx] = 1; // one stone stays in source pit
    visualPitsRef.current = beforePits;

    animatingRef.current = true;
    const steps = result.steps;
    let fromPos = pitCenter(startIdx);
    let i = 0;

    function scheduleNext() {
      if (i >= steps.length) {
        visualPitsRef.current = result!.ended
          ? game.pits.slice() // use final state from engine
          : game.pits.slice();
        visualKazanRef.current = [...game.kazan] as [number, number];
        animatingRef.current = false;
        onAnimDone();
        if (result!.captured) sound.playCapture();
        if (result!.tuzdukCreated) sound.playTuzduk();
        if (result!.ended) {
          setTimeout(() => sound.playWin(), 200);
        }
        return;
      }

      const step = steps[i];
      const toPos = step.toKazan !== -1
        ? kazanCenter(step.toKazan as 0 | 1)
        : pitCenter(step.pit);

      const bead = createFlyingBead(fromPos, toPos, 165, () => {
        if (step.toKazan !== -1) {
          visualKazanRef.current[step.toKazan as 0 | 1]++;
        } else {
          visualPitsRef.current[step.pit] = (visualPitsRef.current[step.pit] || 0) + 1;
        }
        sound.playDrop(visualPitsRef.current[step.pit] ?? 0);
        bead.done = true;
        flyingRef.current = flyingRef.current.filter(f => f !== bead);
        fromPos = toPos;
        i++;
        scheduleNext();
      });
      bead.t0 = nowRef.current;
      flyingRef.current.push(bead);
    }

    scheduleNext();
  }, [game, onMove, onMoveForMP, sound, onAnimDone]);

  // ─── Pointer events ─────────────────────────────────────────────────────────
  const handlePointerDown = useCallback((e: React.PointerEvent<HTMLCanvasElement>) => {
    if (animatingRef.current || game.gameOver) return;

    const lp = toLogical(e.clientX, e.clientY, layoutRef.current);
    const idx = pitAt(lp.x, lp.y);

    if (idx === -1) return;
    if (ownerOf(idx) !== game.current) { invalidFlash(idx); return; }
    if (game.pits[idx] <= 1) { invalidFlash(idx); return; } // need at least 2 stones

    if (mpEnabled && mpMyPlayer !== game.current) return;
    if (aiEnabled && game.current === aiPlayer) return;

    draggingRef.current = true;
    dragIdxRef.current = idx;
    dragCountRef.current = game.pits[idx];
    dragPtRef.current = lp;

    if (canvasRef.current) canvasRef.current.style.cursor = 'grabbing';
  }, [game, mpEnabled, mpMyPlayer, aiEnabled, aiPlayer]);

  const handlePointerMove = useCallback((e: React.PointerEvent<HTMLCanvasElement>) => {
    const lp = toLogical(e.clientX, e.clientY, layoutRef.current);
    if (draggingRef.current) {
      dragPtRef.current = lp;
    } else if (!animatingRef.current && !game.gameOver && canvasRef.current) {
      const idx = pitAt(lp.x, lp.y);
      const myTurn = !mpEnabled || mpMyPlayer === game.current;
      const notAI = !aiEnabled || game.current !== aiPlayer;
      canvasRef.current.style.cursor =
        idx !== -1 && ownerOf(idx) === game.current && game.pits[idx] > 1 && myTurn && notAI
          ? 'grab'
          : 'default';
    }
  }, [game, mpEnabled, mpMyPlayer, aiEnabled, aiPlayer]);

  const handlePointerUp = useCallback(() => {
    if (!draggingRef.current) return;
    draggingRef.current = false;
    if (canvasRef.current) canvasRef.current.style.cursor = 'default';
    const idx = dragIdxRef.current;
    dragIdxRef.current = -1;
    dragPtRef.current = null;
    if (idx >= 0) executeMove(idx);
  }, [executeMove]);

  function invalidFlash(idx: number) {
    invalidFlashesRef.current[idx] = nowRef.current;
    setTimeout(() => {
      delete invalidFlashesRef.current[idx];
    }, 300);
  }

  // ─── Resize ──────────────────────────────────────────────────────────────────
  useEffect(() => {
    const onResize = () => {
      layoutRef.current = computeLayout(window.innerWidth, window.innerHeight, 132, 74);
      const canvas = canvasRef.current;
      if (!canvas) return;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = window.innerWidth * dpr;
      canvas.height = window.innerHeight * dpr;
    };
    window.addEventListener('resize', onResize);
    onResize();
    return () => window.removeEventListener('resize', onResize);
  }, []);

  // ─── Render loop ─────────────────────────────────────────────────────────────
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d')!;

    let running = true;

    function frame(now: number) {
      if (!running) return;
      nowRef.current = now;

      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const w = canvas!.width / dpr;
      const h = canvas!.height / dpr;

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, w, h);

      const layout = layoutRef.current;
      ctx.save();
      ctx.translate(layout.offX, layout.offY);
      ctx.scale(layout.scale, layout.scale);

      // Update flying bead t0 (first frame)
      flyingRef.current.forEach(f => {
        if (f.t0 === 0) f.t0 = now;
      });

      // Trigger arrivals
      flyingRef.current.forEach(f => {
        if (!f.done && (now - f.t0) >= f.dur) {
          f.onArrive();
        }
      });
      flyingRef.current = flyingRef.current.filter(f => !f.done);

      renderScene(
        ctx,
        game,
        animatingRef.current ? visualPitsRef.current : game.pits,
        animatingRef.current ? visualKazanRef.current : [...game.kazan] as [number, number],
        flyingRef.current,
        now,
        {
          dragIdx: draggingRef.current ? dragIdxRef.current : -1,
          dragPt: dragPtRef.current,
          dragCount: dragCountRef.current,
          invalidFlashes: invalidFlashesRef.current,
        },
      );

      ctx.restore();
      rafRef.current = requestAnimationFrame(frame);
    }

    rafRef.current = requestAnimationFrame(frame);
    return () => {
      running = false;
      cancelAnimationFrame(rafRef.current);
    };
  }, [game]);

  return (
    <canvas
      ref={canvasRef}
      style={{ display: 'block', width: '100%', height: '100%', touchAction: 'none' }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
    />
  );
}
