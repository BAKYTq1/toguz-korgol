import { memo, useEffect, useMemo, useRef, useState, type ComponentProps, type ComponentRef } from 'react';
import { Pressable, StyleSheet, View, type GestureResponderEvent, type LayoutChangeEvent } from 'react-native';
import Svg, { Circle, Defs, G, LinearGradient, RadialGradient, Rect, Stop, Text as SvgText } from 'react-native-svg';
import { ownerOf, type GameState } from '../shared';
import { beadLayout, computeLayout, kazanLayout, pitAt, type BoardLayout, type Rect as Box } from '../game/geometry';
import type { Animation, MoveSelection } from '../game/useGameController';
import { colors, fonts } from '../theme';

interface BoardProps {
  game: GameState;
  animation: Animation | null;
  selection: MoveSelection | null;
  lastMove: { from: number; to: number } | null;
  invalidPit: { idx: number; key: number } | null;
  /** Pits the viewer may play now (highlighted). */
  playable: number[];
  flipped: boolean;
  onTapPit: (idx: number) => void;
}

const PITS = Array.from({ length: 18 }, (_, i) => i);

/** Rounded outline around a pit, `d` points outside it. */
function Ring({ pit, d, ...props }: { pit: Box; d: number } & Omit<ComponentProps<typeof Rect>, 'x' | 'y' | 'width' | 'height' | 'rx'>) {
  const h = pit.h + d * 2;
  return <Rect x={pit.x - d} y={pit.y - d} width={pit.w + d * 2} height={h} rx={h / 2} {...props} />;
}

function Board({ game, animation, selection, lastMove, invalidPit, playable, flipped, onTapPit }: BoardProps) {
  const [size, setSize] = useState({ width: 0, height: 0 });
  const rootRef = useRef<ComponentRef<typeof View>>(null);
  // Board position in the window, for platforms whose press events lack locationX/Y.
  const originRef = useRef({ x: 0, y: 0 });
  // The red flash on a wrong pit fades after a moment.
  const [expiredFlash, setExpiredFlash] = useState(0);
  const flashIdx = invalidPit && invalidPit.key !== expiredFlash ? invalidPit.idx : -1;

  useEffect(() => {
    if (!invalidPit) return;
    const timer = setTimeout(() => setExpiredFlash(invalidPit.key), 350);
    return () => clearTimeout(timer);
  }, [invalidPit]);

  const layout = useMemo<BoardLayout>(() => computeLayout(size.width, size.height, flipped), [size, flipped]);

  const onLayout = (e: LayoutChangeEvent) => {
    const { width, height } = e.nativeEvent.layout;
    if (width !== size.width || height !== size.height) setSize({ width, height });
    rootRef.current?.measureInWindow((x, y) => {
      originRef.current = { x, y };
    });
  };

  const handlePress = (e: GestureResponderEvent) => {
    const { locationX, locationY, pageX, pageY } = e.nativeEvent;
    const local = Number.isFinite(locationX) && Number.isFinite(locationY)
      ? { x: locationX, y: locationY }
      : { x: pageX - originRef.current.x, y: pageY - originRef.current.y };
    onTapPit(pitAt(local, layout));
  };

  const pits = animation ? animation.pits : game.pits;
  const kazan = animation ? animation.kazan : game.kazan;
  const { beadR, kazanBeadR, labelFont } = layout;

  return (
    <View ref={rootRef} style={styles.root} onLayout={onLayout}>
      {size.width > 0 && (
        <Svg width={size.width} height={size.height}>
          <Defs>
            <RadialGradient id="bead" cx="35%" cy="30%" r="75%">
              <Stop offset="0" stopColor="#8fdbd3" />
              <Stop offset="0.38" stopColor="#2f8f89" />
              <Stop offset="1" stopColor="#123c39" />
            </RadialGradient>
            <LinearGradient id="darkPanel" x1="0" y1="0" x2="1" y2="0">
              <Stop offset="0" stopColor="#2a251c" />
              <Stop offset="0.5" stopColor="#171310" />
              <Stop offset="1" stopColor="#0c0a08" />
            </LinearGradient>
            <LinearGradient id="lightPanel" x1="0" y1="0" x2="1" y2="0">
              <Stop offset="0" stopColor="#f2ecd8" />
              <Stop offset="0.55" stopColor="#e1dabf" />
              <Stop offset="1" stopColor="#cbc3a4" />
            </LinearGradient>
            <LinearGradient id="hinge" x1="0" y1="0" x2="1" y2="0">
              <Stop offset="0" stopColor="#5c5c5c" />
              <Stop offset="0.5" stopColor="#a8a8a8" />
              <Stop offset="1" stopColor="#5c5c5c" />
            </LinearGradient>
            <LinearGradient id="darkPit" x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0" stopColor="#020201" />
              <Stop offset="0.5" stopColor="#0c0906" />
              <Stop offset="1" stopColor="#1a1510" />
            </LinearGradient>
            <LinearGradient id="lightPit" x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0" stopColor="#968c6c" />
              <Stop offset="0.5" stopColor="#b3a884" />
              <Stop offset="1" stopColor="#c4ba98" />
            </LinearGradient>
          </Defs>

          {/* Panels, hinge and kazans */}
          {([0, 1] as const).map(player => {
            const dark = player === 0;
            const panel = layout.panels[player];
            const k = layout.kazans[player];
            return (
              <G key={`side${player}`}>
                <Rect x={panel.x} y={panel.y} width={panel.w} height={panel.h} rx={14} fill={dark ? 'url(#darkPanel)' : 'url(#lightPanel)'} stroke={dark ? 'rgba(255,255,255,0.07)' : undefined} strokeWidth={1} />
                <Rect x={k.x + 2} y={k.y} width={k.w - 4} height={k.h} rx={14} fill={dark ? 'url(#darkPanel)' : 'url(#lightPanel)'} stroke={dark ? 'rgba(255,255,255,0.07)' : undefined} strokeWidth={1} />
                <Rect x={k.x + 10} y={k.y + 5} width={k.w - 20} height={k.h - 10} rx={(k.h - 10) / 2} fill={dark ? '#050403' : '#c7bd9c'} />
                {kazanLayout(k, kazan[player], kazanBeadR).map((b, i) => (
                  <Circle key={i} cx={b.x} cy={b.y} r={kazanBeadR} fill="url(#bead)" />
                ))}
              </G>
            );
          })}
          <Rect x={layout.hinge.x} y={layout.hinge.y} width={layout.hinge.w} height={layout.hinge.h} rx={2} fill="url(#hinge)" />

          {/* Pits */}
          {PITS.map(idx => {
            const pit = layout.pits[idx];
            const cx = pit.x + pit.w / 2;
            const cy = pit.y + pit.h / 2;
            const dark = ownerOf(idx) === 0;
            const isTuzduk = game.tuzduk[0] === idx || game.tuzduk[1] === idx;
            const isSelected = selection?.idx === idx;
            const isPreview = selection !== null && selection.landing === idx && selection.idx !== idx;
            const isActive = animation?.activePit === idx;
            const lastRole = !selection && !animation && lastMove ? (lastMove.to === idx ? 'to' : lastMove.from === idx ? 'from' : null) : null;
            return (
              <G key={`pit${idx}`}>
                {isTuzduk && <Ring pit={pit} d={3} fill="none" stroke={colors.gold} strokeWidth={2} />}
                <Ring pit={pit} d={0} fill={dark ? 'url(#darkPit)' : 'url(#lightPit)'} stroke={dark ? 'rgba(255,255,255,0.16)' : 'rgba(0,0,0,0.22)'} strokeWidth={1} />
                {playable.includes(idx) && !selection && (
                  <Ring pit={pit} d={1.5} fill="none" stroke={colors.tealLight} strokeOpacity={0.75} strokeWidth={1.5} />
                )}
                {lastRole && (
                  <Ring pit={pit} d={1.5} fill="none" stroke={colors.gold} strokeOpacity={lastRole === 'to' ? 0.9 : 0.6} strokeWidth={1.5} strokeDasharray={lastRole === 'from' ? '4 4' : undefined} />
                )}
                {isPreview && (
                  <Ring pit={pit} d={3} fill="rgba(240,207,90,0.1)" stroke={colors.goldBright} strokeWidth={2} strokeDasharray="6 4" />
                )}
                {isSelected && (
                  <>
                    <Ring pit={pit} d={3.5} fill="none" stroke={colors.tealLight} strokeOpacity={0.3} strokeWidth={4} />
                    <Ring pit={pit} d={1} fill="none" stroke={colors.tealLight} strokeWidth={2} />
                  </>
                )}
                {isActive && <Ring pit={pit} d={0} fill="rgba(240,207,90,0.25)" />}
                {flashIdx === idx && <Ring pit={pit} d={0} fill="rgba(181,41,47,0.55)" />}
                {beadLayout(pits[idx], pit, beadR).map((b, i) => (
                  <Circle key={i} cx={cx + b.x} cy={cy + b.y} r={beadR} fill="url(#bead)" />
                ))}
              </G>
            );
          })}

          {/* Stone counters */}
          {PITS.map(idx => {
            const p = layout.labels[idx];
            const count = pits[idx];
            const text = String(count);
            const h = labelFont + 8;
            const w = Math.max(h, labelFont * 0.66 * text.length + 12);
            return (
              <G key={`label${idx}`}>
                <Rect x={p.x - w / 2} y={p.y - h / 2} width={w} height={h} rx={h / 2} fill={count > 0 ? 'rgba(10,8,6,0.85)' : 'rgba(10,8,6,0.4)'} stroke={count > 0 ? 'rgba(87,194,184,0.55)' : 'rgba(87,194,184,0.2)'} strokeWidth={1} />
                <SvgText x={p.x} y={p.y + labelFont * 0.36} fontSize={labelFont} fontFamily={fonts.extrabold} fontWeight="800" fill={count > 0 ? '#fff8e8' : 'rgba(255,248,232,0.45)'} textAnchor="middle">
                  {text}
                </SvgText>
              </G>
            );
          })}
        </Svg>
      )}
      {/* Touch layer: map the tap back to a pit instead of relying on SVG hit-testing. */}
      <Pressable
        style={StyleSheet.absoluteFill}
        onPress={handlePress}
        accessibilityLabel="Board"
      />
    </View>
  );
}

export default memo(Board);

const styles = StyleSheet.create({
  root: { flex: 1, alignSelf: 'stretch' },
});
