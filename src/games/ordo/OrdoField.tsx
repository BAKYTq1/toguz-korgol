import { useCallback, useEffect, useRef, type KeyboardEvent, type PointerEvent } from 'react';
import { clampDirection, sakaStart, SAKA_ID, type Body, type Throw } from './engine';
import styles from './OrdoField.module.css';

interface OrdoFieldProps {
  bodies: Body[];
  /** The throw being prepared (shown as the saka on the line with an aim arrow), or null. */
  aim: Throw | null;
  /** The human may place and aim the saka. */
  interactive: boolean;
  onAim: (aim: Throw) => void;
  onThrow: (aim: Throw) => void;
  label: string;
}

/** World units (circle radius 1) to canvas pixels: the circle fills 82% of the half-size. */
const FIELD = 0.82;
const PULL_FOR_FULL_POWER = 0.55;

export default function OrdoField({ bodies, aim, interactive, onAim, onThrow, label }: OrdoFieldProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drag = useRef<'aim' | 'place' | null>(null);
  const aimRef = useRef(aim);
  aimRef.current = aim;

  const toWorld = (event: PointerEvent<HTMLCanvasElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const half = rect.width / 2;
    return {
      x: (event.clientX - rect.left - half) / (half * FIELD),
      y: (event.clientY - rect.top - rect.height / 2) / (half * FIELD),
    };
  };

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const size = canvas.clientWidth;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    if (canvas.width !== Math.round(size * dpr)) {
      canvas.width = Math.round(size * dpr);
      canvas.height = Math.round(size * dpr);
    }
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const half = size / 2;
    const scale = half * FIELD;
    const px = (v: number) => half + v * scale;

    // Steppe ground and the circle line.
    const ground = ctx.createRadialGradient(half, half * 0.8, half * 0.1, half, half, half * 1.2);
    ground.addColorStop(0, '#6a5434');
    ground.addColorStop(1, '#2e2416');
    ctx.fillStyle = ground;
    ctx.fillRect(0, 0, size, size);
    ctx.beginPath();
    ctx.arc(half, half, scale, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(242, 230, 204, 0.75)';
    ctx.lineWidth = Math.max(2, size / 220);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(half, half, scale * 1.07, 0, Math.PI * 2);
    ctx.setLineDash([4, 6]);
    ctx.strokeStyle = 'rgba(242, 230, 204, 0.22)';
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.setLineDash([]);

    const drawBone = (b: Body, fill: [string, string]) => {
      ctx.save();
      ctx.translate(px(b.x), px(b.y));
      ctx.rotate(b.angle);
      ctx.globalAlpha = b.out ? 0.4 : 1;
      const rx = b.r * scale * 1.3;
      const ry = b.r * scale * 0.82;
      const gradient = ctx.createLinearGradient(-rx, -ry, rx, ry);
      gradient.addColorStop(0, fill[0]);
      gradient.addColorStop(1, fill[1]);
      ctx.shadowColor = 'rgba(0, 0, 0, 0.45)';
      ctx.shadowBlur = 4;
      ctx.shadowOffsetY = 2;
      ctx.beginPath();
      // A knucklebone: an oval pinched in the middle.
      ctx.moveTo(-rx, 0);
      ctx.bezierCurveTo(-rx, -ry * 1.3, -rx * 0.2, -ry * 0.7, 0, -ry * 0.75);
      ctx.bezierCurveTo(rx * 0.2, -ry * 0.7, rx, -ry * 1.3, rx, 0);
      ctx.bezierCurveTo(rx, ry * 1.3, rx * 0.2, ry * 0.7, 0, ry * 0.75);
      ctx.bezierCurveTo(-rx * 0.2, ry * 0.7, -rx, ry * 1.3, -rx, 0);
      ctx.fillStyle = gradient;
      ctx.fill();
      ctx.shadowColor = 'transparent';
      ctx.strokeStyle = 'rgba(60, 40, 20, 0.45)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(-rx * 0.35, 0);
      ctx.lineTo(rx * 0.35, 0);
      ctx.stroke();
      ctx.restore();
    };

    for (const b of bodies) {
      if (b.kind === 'khan') {
        ctx.save();
        ctx.globalAlpha = b.out ? 0.4 : 1;
        const r = b.r * scale;
        const metal = ctx.createRadialGradient(px(b.x) - r * 0.3, px(b.y) - r * 0.3, r * 0.1, px(b.x), px(b.y), r);
        metal.addColorStop(0, '#f1f3f4');
        metal.addColorStop(0.6, '#a9aeb3');
        metal.addColorStop(1, '#5c6166');
        ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
        ctx.shadowBlur = 5;
        ctx.shadowOffsetY = 2;
        ctx.beginPath();
        ctx.arc(px(b.x), px(b.y), r, 0, Math.PI * 2);
        ctx.fillStyle = metal;
        ctx.fill();
        ctx.shadowColor = 'transparent';
        ctx.beginPath();
        ctx.arc(px(b.x), px(b.y), r * 0.6, 0, Math.PI * 2);
        ctx.strokeStyle = 'rgba(212, 175, 55, 0.9)';
        ctx.lineWidth = 1.5;
        ctx.stroke();
        ctx.restore();
      } else if (b.kind === 'chuko') {
        drawBone(b, ['#fbf3e1', '#c4ad80']);
      } else if (b.id === SAKA_ID) {
        drawBone(b, ['#f0cf72', '#9a6f1e']);
      }
    }

    if (aim) {
      const start = sakaStart(aim.position);
      const direction = clampDirection(aim.position, aim.direction);
      const length = 0.18 + aim.power * 0.55;
      ctx.save();
      ctx.strokeStyle = 'rgba(87, 194, 184, 0.9)';
      ctx.lineWidth = 2.5;
      ctx.setLineDash([6, 6]);
      ctx.beginPath();
      ctx.moveTo(px(start.x), px(start.y));
      ctx.lineTo(px(start.x + Math.cos(direction) * length), px(start.y + Math.sin(direction) * length));
      ctx.stroke();
      ctx.setLineDash([]);
      // Power gauge around the saka.
      ctx.beginPath();
      ctx.arc(px(start.x), px(start.y), 0.1 * scale, -Math.PI / 2, -Math.PI / 2 + aim.power * Math.PI * 2);
      ctx.strokeStyle = aim.power > 0.85 ? '#e2777b' : '#d4af37';
      ctx.lineWidth = 3;
      ctx.stroke();
      ctx.restore();
      drawBone({ id: SAKA_ID, kind: 'saka', x: start.x, y: start.y, vx: 0, vy: 0, r: 0.05, m: 0, f: 0, angle: direction, out: false }, ['#f0cf72', '#9a6f1e']);
    }
  }, [bodies, aim]);

  useEffect(() => {
    draw();
    const onResize = () => draw();
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, [draw]);

  const onPointerDown = (event: PointerEvent<HTMLCanvasElement>) => {
    const current = aimRef.current;
    if (!interactive || !current) return;
    const p = toWorld(event);
    const start = sakaStart(current.position);
    event.currentTarget.setPointerCapture(event.pointerId);
    if (Math.hypot(p.x - start.x, p.y - start.y) < 0.22) {
      drag.current = 'aim';
    } else if (Math.hypot(p.x, p.y) > 0.75) {
      drag.current = 'place';
      onAim({ ...current, position: Math.atan2(p.y, p.x), direction: Math.atan2(p.y, p.x) + Math.PI });
    }
  };

  const onPointerMove = (event: PointerEvent<HTMLCanvasElement>) => {
    const current = aimRef.current;
    if (!drag.current || !current) return;
    const p = toWorld(event);
    if (drag.current === 'place') {
      const position = Math.atan2(p.y, p.x);
      onAim({ ...current, position, direction: position + Math.PI });
      return;
    }
    // Slingshot: pull back from the saka, it flies the opposite way.
    const start = sakaStart(current.position);
    const dx = start.x - p.x;
    const dy = start.y - p.y;
    const pull = Math.hypot(dx, dy);
    if (pull < 0.02) return;
    onAim({ ...current, direction: clampDirection(current.position, Math.atan2(dy, dx)), power: Math.min(1, pull / PULL_FOR_FULL_POWER) });
  };

  const onPointerUp = () => {
    const current = aimRef.current;
    const mode = drag.current;
    drag.current = null;
    if (mode === 'aim' && current && current.power >= 0.08) onThrow(current);
  };

  const onKeyDown = (event: KeyboardEvent<HTMLCanvasElement>) => {
    const current = aimRef.current;
    if (!interactive || !current) return;
    const step = event.shiftKey ? 0.01 : 0.04;
    const handled = (next: Throw) => {
      event.preventDefault();
      onAim(next);
    };
    switch (event.key) {
      case 'ArrowLeft': return handled({ ...current, position: current.position - step, direction: current.direction - step });
      case 'ArrowRight': return handled({ ...current, position: current.position + step, direction: current.direction + step });
      case 'ArrowUp': return handled({ ...current, direction: clampDirection(current.position, current.direction - step / 2) });
      case 'ArrowDown': return handled({ ...current, direction: clampDirection(current.position, current.direction + step / 2) });
      case '+': case '=': return handled({ ...current, power: Math.min(1, current.power + 0.05) });
      case '-': case '_': return handled({ ...current, power: Math.max(0.1, current.power - 0.05) });
      case ' ': case 'Enter':
        event.preventDefault();
        onThrow(current);
    }
  };

  return (
    <canvas
      ref={canvasRef}
      className={`${styles.field} ${interactive ? styles.interactive : ''}`}
      role="img"
      aria-label={label}
      tabIndex={interactive ? 0 : -1}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={() => { drag.current = null; }}
      onKeyDown={onKeyDown}
    />
  );
}
