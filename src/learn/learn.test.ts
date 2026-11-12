import { describe, expect, it } from 'vitest';
import { applyMove, legalMoves } from '../game/engine';
import { LESSONS, lessonState } from './lessons';
import { moveFacts, puzzleState, solve } from './puzzleCheck';
import { TOGUZ_PUZZLES } from './toguzPuzzles';

describe('lessons', () => {
  for (const lesson of LESSONS) {
    for (const [i, step] of lesson.steps.entries()) {
      const state = lessonState(step.position);
      it(`${lesson.id} step ${i + 1}: position is a legal board`, () => {
        expect(state.pits).toHaveLength(18);
        expect(state.pits.reduce((a, b) => a + b, 0) + state.kazan[0] + state.kazan[1]).toBe(162);
      });
      const task = step.task;
      if (!task) continue;
      it(`${lesson.id} step ${i + 1}: accepted moves do what the lesson says, and only they do`, () => {
        for (const move of legalMoves(state, 1)) {
          const { nextState, result } = applyMove(state, move);
          const does = {
            sow: !result.captured && !result.tuzdukCreated,
            capture: result.captured,
            tuzduk: result.tuzdukCreated,
            win: nextState.gameOver && nextState.winner === 1,
          }[task.expect];
          if (task.accept.includes(move)) expect(does, `move ${move}`).toBe(true);
          else if (task.expect !== 'sow') expect(does, `move ${move}`).toBe(false);
        }
      });
    }
  }
});

describe('puzzles', () => {
  it('has unique ids', () => {
    expect(new Set(TOGUZ_PUZZLES.map(p => p.id)).size).toBe(TOGUZ_PUZZLES.length);
  });
  for (const puzzle of TOGUZ_PUZZLES) {
    it(`${puzzle.id} has exactly the recorded answer`, () => {
      const state = puzzleState(puzzle);
      expect(state.pits.reduce((a, b) => a + b, 0) + state.kazan[0] + state.kazan[1]).toBe(162);
      expect(solve(state, puzzle.kind)).toBe(puzzle.solution);
      const facts = moveFacts(state, puzzle.solution);
      if (puzzle.kind === 'tuzduk') expect(facts.tuzduk).toBe(true);
      if (puzzle.kind === 'capture') expect(facts.gain).toBeGreaterThanOrEqual(10);
    });
  }
});
