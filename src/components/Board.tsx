/**
 * Board — the main Canvas component.
 * Handles render loop, animation, drag & drop / tap, AI moves and queued remote moves.
 */

import { forwardRef, useCallback, useEffect, useImperativeHandle, useLayoutEffect, useRef, useState } from 'react';
import { GameState, ownerOf, legalMoves, MoveResult } from '../game/engine';
import { getAIMove, AIDifficulty } from '../game/ai';
import {
  applyBoardTransform,
  computeLayout,
  isInsideBoard,
  isPortraitViewport,
  pitAt,
  pitCenter,
  kazanCenter,
  toLogical,
  uprightAngle,
  labelScaleFor,
  renderScene,
  createFlyingBead,
  FlyingBead,
  ScorePopup,
  POPUP_DURATION,
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
  /** Online mode without an opponent yet: the board is visible but cannot be played. */
  inputLocked?: boolean;
  /** The player whose row is drawn closest to the viewer. */
  perspective: 0 | 1;
  onMoveForMP?: (idx: number) => void;
}

export interface BoardHandle {
  /** Animate a move received from the online opponent (queued while another move animates). */
  playRemoteMove: (idx: number) => void;
  /** Drop queued remote moves, e.g. before a restart. */
  clearQueue: () => void;
}

const HUD_GAP = 8;

/** Space taken by HUD elements above/below the board in portrait mode. */
function measureHud(height: number) {
  let top = 0;
  let bottom = 0;
  document.querySelectorAll<HTMLElement>('[data-hud="top"]').forEach(el => {
    const rect = el.getBoundingClientRect();
    if (rect.height > 0) top = Math.max(top, rect.bottom);
  });
  document.querySelectorAll<HTMLElement>('[data-hud="bottom"]').forEach(el => {
    const rect = el.getBoundingClientRect();
    if (rect.height > 0) bottom = Math.max(bottom, height - rect.top);
  });
  return { top: top + HUD_GAP, bottom: bottom + HUD_GAP };
}

function getBoardLayout(width: number, height: number, flipped: boolean) {
  if (isPortraitViewport(width, height)) {
    const hud = measureHud(height);
    return computeLayout(width, height, hud.top, hud.bottom, flipped);
  }
  const compactLandscape = height < 520;
  return computeLayout(width, height, compactLandscape ? 104 : 132, compactLandscape ? 38 : 74, flipped);
}

function vibrate(pattern: number | number[]) {
  try {
    navigator.vibrate?.(pattern);
  } catch {
    // Vibration is optional.
  }
}

const Board = forwardRef<BoardHandle, BoardProps>(function Board({
  game,
  onMove,
  onAnimDone,
  soundEnabled,
  aiEnabled,
  aiDifficulty,
  aiPlayer,
  mpEnabled,
  mpMyPlayer,
  inputLocked = false,
  perspective,
  onMoveForMP,
}, ref) {
  const flipped = perspective === 0;
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const layoutRef = useRef(getBoardLayout(window.innerWidth, window.innerHeight, flipped));
  const flippedRef = useRef(flipped);
  flippedRef.current = flipped;
  const rafRef = useRef<number>(0);

  // Visual state (interpolated during animation)
  const visualPitsRef = useRef<number[]>(game.pits.slice());
  const visualKazanRef = useRef<[number, number]>([...game.kazan] as [number, number]);
  const flyingRef = useRef<FlyingBead[]>([]);
  const popupsRef = useRef<ScorePopup[]>([]);
  const lastMoveRef = useRef<{ from: number; to: number } | null>(null);
  const animatingRef = useRef(false);
  const animGenRef = useRef(0);
  const nowRef = useRef(0);

  // Remote moves waiting for the current animation to finish
  const remoteQueueRef = useRef<number[]>([]);
  const [queueTick, setQueueTick] = useState(0);

  // Drag state
  const draggingRef = useRef(false);
  const dragIdxRef = useRef(-1);
  const dragPtRef = useRef<{ x: number; y: number } | null>(null);
  const dragCountRef = useRef(0);

  // Invalid flash
  const invalidFlashesRef = useRef<Record<number, number>>({});

  const sound = useSound(soundEnabled);

  useImperativeHandle(ref, () => ({
    playRemoteMove: (idx: number) => {
      remoteQueueRef.current.push(idx);
      setQueueTick(n => n + 1);
    },
    clearQueue: () => {
      remoteQueueRef.current = [];
    },
  }), []);

  // Sync visual when game changes from outside; a fresh game cancels any running animation.
  useEffect(() => {
    if (game.moveCount === 0) {
      animGenRef.current++;
      animatingRef.current = false;
      flyingRef.current = [];
      popupsRef.current = [];
      lastMoveRef.current = null;
      draggingRef.current = false;
      dragIdxRef.current = -1;
      dragPtRef.current = null;
    }
    if (!animatingRef.current) {
      visualPitsRef.current = game.pits.slice();
      visualKazanRef.current = [...game.kazan] as [number, number];
    }
  }, [game]);

  const humanTurn = !game.gameOver
    && !inputLocked
    && (!aiEnabled || game.current !== aiPlayer)
    && (!mpEnabled || mpMyPlayer === game.current);
  const humanTurnRef = useRef(humanTurn);
  humanTurnRef.current = humanTurn;

  // ─── Move execution with animation ─────────────────────────────────────────
  const executeMove = useCallback((startIdx: number, remote = false) => {
    if (animatingRef.current || game.gameOver) return false;
    if (ownerOf(startIdx) !== game.current) return false;
    if (game.pits[startIdx] <= 0) return false;

    const result = onMove(startIdx);
    if (!result) return false;

    if (!remote && onMoveForMP) onMoveForMP(startIdx);

    sound.playPick();

    const stones = game.pits[startIdx];
    const beforePits = game.pits.slice();
    beforePits[startIdx] = stones === 1 ? 0 : 1; // first stone returns to the pit unless it is alone
    visualPitsRef.current = beforePits;
    visualKazanRef.current = [...game.kazan] as [number, number];

    const lastStep = result.steps[result.steps.length - 1];
    lastMoveRef.current = { from: startIdx, to: lastStep ? lastStep.pit : startIdx };

    animatingRef.current = true;
    const gen = ++animGenRef.current;
    const steps = result.steps;
    const mover = game.current;
    let fromPos = pitCenter(startIdx);
    let i = 0;

    function finish() {
      animatingRef.current = false;
      onAnimDone();
      ([0, 1] as const).forEach(player => {
        const gain = result!.gained[player];
        if (gain <= 0) return;
        const k = kazanCenter(player);
        popupsRef.current.push({ text: `+${gain}`, x: k.x, y: k.y, t0: nowRef.current });
      });
      if (result!.captured || result!.tuzdukCreated) vibrate(mover === mpMyPlayer || !mpEnabled ? [18, 40, 18] : 12);
      if (result!.captured) sound.playCapture();
      if (result!.tuzdukCreated) sound.playTuzduk();
      if (result!.ended) setTimeout(() => sound.playWin(), 200);
    }

    function scheduleNext() {
      if (gen !== animGenRef.current) return; // a restart cancelled this animation
      if (i >= steps.length) {
        finish();
        return;
      }

      const step = steps[i];
      const toPos = step.toKazan !== -1
        ? kazanCenter(step.toKazan as 0 | 1)
        : pitCenter(step.pit);

      const bead = createFlyingBead(fromPos, toPos, steps.length > 14 ? 120 : 165, () => {
        if (gen !== animGenRef.current) return;
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
    return true;
  }, [game, onMove, onMoveForMP, sound, onAnimDone, mpEnabled, mpMyPlayer]);

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

  // ─── Remote (online) moves ──────────────────────────────────────────────────
  useEffect(() => {
    if (animatingRef.current || remoteQueueRef.current.length === 0) return;
    const idx = remoteQueueRef.current.shift()!;
    if (!executeMove(idx, true)) console.warn('Ignored an online move that does not fit the local board', idx);
  }, [game, queueTick, executeMove]);

  // ─── Pointer events ─────────────────────────────────────────────────────────
  function invalidFlash(idx: number) {
    invalidFlashesRef.current[idx] = nowRef.current;
    vibrate(30);
    setTimeout(() => {
      delete invalidFlashesRef.current[idx];
    }, 300);
  }

  const cancelDrag = useCallback(() => {
    draggingRef.current = false;
    dragIdxRef.current = -1;
    dragPtRef.current = null;
    if (canvasRef.current) canvasRef.current.style.cursor = 'default';
  }, []);

  const handlePointerDown = useCallback((e: React.PointerEvent<HTMLCanvasElement>) => {
    if (animatingRef.current || game.gameOver || inputLocked) return;

    const lp = toLogical(e.clientX, e.clientY, layoutRef.current);
    const idx = pitAt(lp.x, lp.y);

    if (idx === -1) return;
    if (!humanTurn) return;
    if (ownerOf(idx) !== game.current || game.pits[idx] <= 0) { invalidFlash(idx); return; }

    draggingRef.current = true;
    dragIdxRef.current = idx;
    dragCountRef.current = game.pits[idx];
    dragPtRef.current = lp;
    vibrate(8);
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {
      // Pointer capture is a nicety; dragging still works without it.
    }

    if (canvasRef.current) canvasRef.current.style.cursor = 'grabbing';
  }, [game, inputLocked, humanTurn]);

  const handlePointerMove = useCallback((e: React.PointerEvent<HTMLCanvasElement>) => {
    const lp = toLogical(e.clientX, e.clientY, layoutRef.current);
    if (draggingRef.current) {
      dragPtRef.current = lp;
    } else if (e.pointerType === 'mouse' && !animatingRef.current && canvasRef.current) {
      const idx = pitAt(lp.x, lp.y);
      canvasRef.current.style.cursor =
        humanTurn && idx !== -1 && ownerOf(idx) === game.current && game.pits[idx] > 0 ? 'grab' : 'default';
    }
  }, [game, humanTurn]);

  const handlePointerUp = useCallback((e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!draggingRef.current) return;
    const idx = dragIdxRef.current;
    const lp = toLogical(e.clientX, e.clientY, layoutRef.current);
    cancelDrag();
    // Releasing outside the board cancels the move.
    if (idx >= 0 && isInsideBoard(lp)) executeMove(idx);
  }, [executeMove, cancelDrag]);

  // ─── Resize ──────────────────────────────────────────────────────────────────
  const relayout = useCallback(() => {
    layoutRef.current = getBoardLayout(window.innerWidth, window.innerHeight, flippedRef.current);
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const w = Math.round(window.innerWidth * dpr);
    const h = Math.round(window.innerHeight * dpr);
    if (canvas.width !== w) canvas.width = w;
    if (canvas.height !== h) canvas.height = h;
  }, []);

  useEffect(() => {
    window.addEventListener('resize', relayout);
    window.visualViewport?.addEventListener('resize', relayout);
    const observer = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(() => relayout()) : null;
    document.querySelectorAll('[data-hud]').forEach(el => observer?.observe(el));
    void document.fonts?.ready.then(relayout);
    relayout();
    return () => {
      window.removeEventListener('resize', relayout);
      window.visualViewport?.removeEventListener('resize', relayout);
      observer?.disconnect();
    };
  }, [relayout]);

  // HUD texts change between renders (turn banner, names), so re-measure after each one.
  useLayoutEffect(() => {
    relayout();
  });

  // ─── Render loop ─────────────────────────────────────────────────────────────
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d')!;

    let running = true;
    const playable = legalMoves(game, game.current);

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
      applyBoardTransform(ctx, layout);

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
      popupsRef.current = popupsRef.current.filter(p => now - p.t0 < POPUP_DURATION);

      const animating = animatingRef.current;
      const showPlayable = humanTurnRef.current && !animating && !draggingRef.current;

      renderScene(
        ctx,
        game,
        animating ? visualPitsRef.current : game.pits,
        animating ? visualKazanRef.current : [...game.kazan] as [number, number],
        flyingRef.current,
        now,
        {
          dragIdx: draggingRef.current ? dragIdxRef.current : -1,
          dragPt: dragPtRef.current,
          dragCount: dragCountRef.current,
          invalidFlashes: invalidFlashesRef.current,
          labelAngle: uprightAngle(layout),
          labelScale: labelScaleFor(layout),
          playable: showPlayable ? playable : [],
          lastMove: animating ? null : lastMoveRef.current,
          popups: popupsRef.current,
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
      onPointerCancel={cancelDrag}
      onLostPointerCapture={() => { if (draggingRef.current) cancelDrag(); }}
    />
  );
});

export default Board;
