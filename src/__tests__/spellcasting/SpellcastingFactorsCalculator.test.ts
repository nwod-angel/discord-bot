import { describe, it, expect } from 'vitest';
import {
  calculateSpellcastingFactors,
  SpellcastingFactorsConfig,
  SpellAction,
} from '../../spellcasting/SpellcastingFactorsCalculator.js';

// ── Helpers ────────────────────────────────────────────────────

function makeConfig(action: SpellAction, overrides: Partial<SpellcastingFactorsConfig> = {}): SpellcastingFactorsConfig {
  return { action, ...overrides };
}

// ── Tests ──────────────────────────────────────────────────────

describe('SpellcastingFactorsCalculator', () => {
  // ─── Output structure ──────────────────────────────────────────

  describe('output structure', () => {
    it('returns empty factors array and total of 0 for no modifiers', () => {
      const result = calculateSpellcastingFactors(makeConfig('instant'));

      expect(result).toEqual({ factors: [], total: 0 });
    });

    it('returns SpellcastingFactorsOutput with factors array and total', () => {
      const result = calculateSpellcastingFactors(makeConfig('instant', { potency: 3 }));

      expect(result).toHaveProperty('factors');
      expect(result).toHaveProperty('total');
      expect(Array.isArray(result.factors)).toBe(true);
      expect(typeof result.total).toBe('number');
    });

    it('each factor has type, value, and modifier', () => {
      const result = calculateSpellcastingFactors(makeConfig('instant', { potency: 3 }));

      expect(result.factors.length).toBe(1);
      expect(result.factors[0]).toEqual({
        type: 'Potency',
        value: '3',
        modifier: expect.any(Number),
      });
    });

    it('total equals sum of all factor modifiers', () => {
      const result = calculateSpellcastingFactors(
        makeConfig('instant', { potency: 3, targets: 4 }),
      );

      const expectedTotal = result.factors.reduce((sum, f) => sum + f.modifier, 0);
      expect(result.total).toBe(expectedTotal);
    });
  });

  // ─── Sign behavior ─────────────────────────────────────────────

  describe('sign behavior', () => {
    it('instant actions use sign = -2 (penalties)', () => {
      const result = calculateSpellcastingFactors(makeConfig('instant', { potency: 3 }));

      // potency 3: (3-1) * -2 = -4
      expect(result.factors[0].modifier).toBe(-4);
    });

    it('extended actions use sign = 1 (bonuses)', () => {
      const result = calculateSpellcastingFactors(makeConfig('extended', { potency: 3 }));

      // potency 3: (3-1) * 1 = 2
      expect(result.factors[0].modifier).toBe(2);
    });

    it('instant sign flips all factors to negative or zero', () => {
      const result = calculateSpellcastingFactors(
        makeConfig('instant', { potency: 2, targets: 2 }),
      );

      result.factors.forEach((f) => {
        expect(f.modifier).toBeLessThanOrEqual(0);
      });
    });

    it('extended sign produces positive or zero factors', () => {
      const result = calculateSpellcastingFactors(
        makeConfig('extended', { potency: 2, targets: 2 }),
      );

      result.factors.forEach((f) => {
        expect(f.modifier).toBeGreaterThanOrEqual(0);
      });
    });
  });

  // ─── Potency ───────────────────────────────────────────────────

  describe('Potency factor', () => {
    it('no factor when potency is undefined', () => {
      const result = calculateSpellcastingFactors(makeConfig('instant'));
      expect(result.factors).toHaveLength(0);
    });

    it('no factor when potency is 1 (baseline)', () => {
      const result = calculateSpellcastingFactors(makeConfig('instant', { potency: 1 }));
      expect(result.factors).toHaveLength(0);
    });

    it('potency 2 instant: modifier = -2', () => {
      const result = calculateSpellcastingFactors(makeConfig('instant', { potency: 2 }));
      expect(result.factors[0]).toEqual({ type: 'Potency', value: '2', modifier: -2 });
    });

    it('potency 3 instant: modifier = -4', () => {
      const result = calculateSpellcastingFactors(makeConfig('instant', { potency: 3 }));
      expect(result.factors[0]).toEqual({ type: 'Potency', value: '3', modifier: -4 });
    });

    it('potency 5 instant: modifier = -8', () => {
      const result = calculateSpellcastingFactors(makeConfig('instant', { potency: 5 }));
      expect(result.factors[0]).toEqual({ type: 'Potency', value: '5', modifier: -8 });
    });

    it('potency 2 extended: modifier = 1', () => {
      const result = calculateSpellcastingFactors(makeConfig('extended', { potency: 2 }));
      expect(result.factors[0]).toEqual({ type: 'Potency', value: '2', modifier: 1 });
    });

    it('potency 3 extended: modifier = 2', () => {
      const result = calculateSpellcastingFactors(makeConfig('extended', { potency: 3 }));
      expect(result.factors[0]).toEqual({ type: 'Potency', value: '3', modifier: 2 });
    });

    it('potency 5 extended: modifier = 4', () => {
      const result = calculateSpellcastingFactors(makeConfig('extended', { potency: 5 }));
      expect(result.factors[0]).toEqual({ type: 'Potency', value: '5', modifier: 4 });
    });
  });

  // ─── Targets ───────────────────────────────────────────────────

  describe('Targets factor', () => {
    it('no factor when targets is undefined', () => {
      const result = calculateSpellcastingFactors(makeConfig('instant'));
      expect(result.factors).toHaveLength(0);
    });

    it('no factor when targets is 1 (baseline)', () => {
      const result = calculateSpellcastingFactors(makeConfig('instant', { targets: 1 }));
      expect(result.factors).toHaveLength(0);
    });

    it('targets 2 instant: modifier = -2 (ceil(log2(2)) * -2)', () => {
      const result = calculateSpellcastingFactors(makeConfig('instant', { targets: 2 }));
      expect(result.factors[0]).toEqual({ type: 'Targets', value: '2', modifier: -2 });
    });

    it('targets 4 instant: modifier = -4 (ceil(log2(4)) * -2)', () => {
      const result = calculateSpellcastingFactors(makeConfig('instant', { targets: 4 }));
      expect(result.factors[0]).toEqual({ type: 'Targets', value: '4', modifier: -4 });
    });

    it('targets 8 instant: modifier = -6 (ceil(log2(8)) * -2)', () => {
      const result = calculateSpellcastingFactors(makeConfig('instant', { targets: 8 }));
      expect(result.factors[0]).toEqual({ type: 'Targets', value: '8', modifier: -6 });
    });

    it('targets 16 instant: modifier = -8 (ceil(log2(16)) * -2)', () => {
      const result = calculateSpellcastingFactors(makeConfig('instant', { targets: 16 }));
      expect(result.factors[0]).toEqual({ type: 'Targets', value: '16', modifier: -8 });
    });

    it('targets 3 instant: modifier = -4 (ceil(log2(3)) = 2)', () => {
      const result = calculateSpellcastingFactors(makeConfig('instant', { targets: 3 }));
      expect(result.factors[0]).toEqual({ type: 'Targets', value: '3', modifier: -4 });
    });

    it('targets 2 extended: modifier = 1', () => {
      const result = calculateSpellcastingFactors(makeConfig('extended', { targets: 2 }));
      expect(result.factors[0]).toEqual({ type: 'Targets', value: '2', modifier: 1 });
    });

    it('targets 4 extended: modifier = 2', () => {
      const result = calculateSpellcastingFactors(makeConfig('extended', { targets: 4 }));
      expect(result.factors[0]).toEqual({ type: 'Targets', value: '4', modifier: 2 });
    });

    it('targets 16 extended: modifier = 4', () => {
      const result = calculateSpellcastingFactors(makeConfig('extended', { targets: 16 }));
      expect(result.factors[0]).toEqual({ type: 'Targets', value: '16', modifier: 4 });
    });
  });

  // ─── Size ──────────────────────────────────────────────────────

  describe('Size factor', () => {
    it('no factor when size is undefined', () => {
      const result = calculateSpellcastingFactors(makeConfig('instant'));
      expect(result.factors).toHaveLength(0);
    });

    it('no factor when size is 1', () => {
      const result = calculateSpellcastingFactors(makeConfig('instant', { size: 1 }));
      expect(result.factors).toHaveLength(0);
    });

    it('no factor when size is 5 (baseline)', () => {
      const result = calculateSpellcastingFactors(makeConfig('instant', { size: 5 }));
      expect(result.factors).toHaveLength(0);
    });

    it('size 6 instant: modifier = -6 (ceil(log2(6)) * -2 = 3 * -2)', () => {
      const result = calculateSpellcastingFactors(makeConfig('instant', { size: 6 }));
      expect(result.factors[0]).toEqual({ type: 'Size', value: '6', modifier: -6 });
    });

    it('size 8 instant: modifier = -6 (ceil(log2(8)) * -2)', () => {
      const result = calculateSpellcastingFactors(makeConfig('instant', { size: 8 }));
      expect(result.factors[0]).toEqual({ type: 'Size', value: '8', modifier: -6 });
    });

    it('size 10 instant: modifier = -8 (ceil(log2(10)) = 4 * -2)', () => {
      const result = calculateSpellcastingFactors(makeConfig('instant', { size: 10 }));
      expect(result.factors[0]).toEqual({ type: 'Size', value: '10', modifier: -8 });
    });

    it('size 16 instant: modifier = -8 (ceil(log2(16)) * -2)', () => {
      const result = calculateSpellcastingFactors(makeConfig('instant', { size: 16 }));
      expect(result.factors[0]).toEqual({ type: 'Size', value: '16', modifier: -8 });
    });

    it('size 20 instant: modifier = -10 (ceil(log2(20)) = 5 * -2)', () => {
      const result = calculateSpellcastingFactors(makeConfig('instant', { size: 20 }));
      expect(result.factors[0]).toEqual({ type: 'Size', value: '20', modifier: -10 });
    });

    it('size 8 extended: modifier = 3 (ceil(log2(8)) * 1)', () => {
      const result = calculateSpellcastingFactors(makeConfig('extended', { size: 8 }));
      expect(result.factors[0]).toEqual({ type: 'Size', value: '8', modifier: 3 });
    });

    it('size 10 extended: modifier = 4', () => {
      const result = calculateSpellcastingFactors(makeConfig('extended', { size: 10 }));
      expect(result.factors[0]).toEqual({ type: 'Size', value: '10', modifier: 4 });
    });
  });

  // ─── Radius ────────────────────────────────────────────────────

  describe('Radius (yards) factor', () => {
    it('no factor when radius is undefined', () => {
      const result = calculateSpellcastingFactors(makeConfig('instant'));
      expect(result.factors).toHaveLength(0);
    });

    it('no factor when radius is 0', () => {
      const result = calculateSpellcastingFactors(makeConfig('instant', { radius: 0 }));
      expect(result.factors).toHaveLength(0);
    });

    it('no factor when radius is 1 (baseline)', () => {
      const result = calculateSpellcastingFactors(makeConfig('instant', { radius: 1 }));
      expect(result.factors).toHaveLength(0);
    });

    it('radius 2 instant: modifier = -2 (ceil(log2(2)) * -2)', () => {
      const result = calculateSpellcastingFactors(makeConfig('instant', { radius: 2 }));
      expect(result.factors[0]).toEqual({ type: 'Radius (yards)', value: '2', modifier: -2 });
    });

    it('radius 4 instant: modifier = -4 (ceil(log2(4)) * -2)', () => {
      const result = calculateSpellcastingFactors(makeConfig('instant', { radius: 4 }));
      expect(result.factors[0]).toEqual({ type: 'Radius (yards)', value: '4', modifier: -4 });
    });

    it('radius 8 instant: modifier = -6 (ceil(log2(8)) * -2)', () => {
      const result = calculateSpellcastingFactors(makeConfig('instant', { radius: 8 }));
      expect(result.factors[0]).toEqual({ type: 'Radius (yards)', value: '8', modifier: -6 });
    });

    it('radius 16 instant: modifier = -8 (ceil(log2(16)) * -2)', () => {
      const result = calculateSpellcastingFactors(makeConfig('instant', { radius: 16 }));
      expect(result.factors[0]).toEqual({ type: 'Radius (yards)', value: '16', modifier: -8 });
    });

    it('radius 3 instant: modifier = -4 (ceil(log2(3)) = 2)', () => {
      const result = calculateSpellcastingFactors(makeConfig('instant', { radius: 3 }));
      expect(result.factors[0]).toEqual({ type: 'Radius (yards)', value: '3', modifier: -4 });
    });

    it('radius 5 extended: modifier = 3 (ceil(log2(5)) = 3)', () => {
      const result = calculateSpellcastingFactors(makeConfig('extended', { radius: 5 }));
      expect(result.factors[0]).toEqual({ type: 'Radius (yards)', value: '5', modifier: 3 });
    });

    it('radius 8 extended: modifier = 3', () => {
      const result = calculateSpellcastingFactors(makeConfig('extended', { radius: 8 }));
      expect(result.factors[0]).toEqual({ type: 'Radius (yards)', value: '8', modifier: 3 });
    });
  });

  // ─── Advanced Radius ───────────────────────────────────────────

  describe('Advanced Radius (yards) factor', () => {
    it('no factor when radius_advanced is undefined', () => {
      const result = calculateSpellcastingFactors(makeConfig('instant'));
      expect(result.factors).toHaveLength(0);
    });

    it('no factor when radius_advanced is 0', () => {
      const result = calculateSpellcastingFactors(makeConfig('instant', { radius_advanced: 0 }));
      expect(result.factors).toHaveLength(0);
    });

    it('no factor when radius_advanced is 1 (baseline)', () => {
      const result = calculateSpellcastingFactors(makeConfig('instant', { radius_advanced: 1 }));
      expect(result.factors).toHaveLength(0);
    });

    it('radius_advanced 2 instant: modifier = -2 (ceil(log4(2)) * -2 = 1 * -2)', () => {
      const result = calculateSpellcastingFactors(makeConfig('instant', { radius_advanced: 2 }));
      expect(result.factors[0]).toEqual({ type: 'Advanced Radius (yards)', value: '2', modifier: -2 });
    });

    it('radius_advanced 4 instant: modifier = -2 (ceil(log4(4)) * -2 = 1 * -2)', () => {
      const result = calculateSpellcastingFactors(makeConfig('instant', { radius_advanced: 4 }));
      expect(result.factors[0]).toEqual({ type: 'Advanced Radius (yards)', value: '4', modifier: -2 });
    });

    it('radius_advanced 5 instant: modifier = -4 (ceil(log4(5)) = 2 * -2)', () => {
      const result = calculateSpellcastingFactors(makeConfig('instant', { radius_advanced: 5 }));
      expect(result.factors[0]).toEqual({ type: 'Advanced Radius (yards)', value: '5', modifier: -4 });
    });

    it('radius_advanced 16 instant: modifier = -4 (ceil(log4(16)) = 2 * -2)', () => {
      const result = calculateSpellcastingFactors(makeConfig('instant', { radius_advanced: 16 }));
      expect(result.factors[0]).toEqual({ type: 'Advanced Radius (yards)', value: '16', modifier: -4 });
    });

    it('radius_advanced 17 instant: modifier = -6 (ceil(log4(17)) = 3 * -2)', () => {
      const result = calculateSpellcastingFactors(makeConfig('instant', { radius_advanced: 17 }));
      expect(result.factors[0]).toEqual({ type: 'Advanced Radius (yards)', value: '17', modifier: -6 });
    });

    it('radius_advanced 4 extended: modifier = 1', () => {
      const result = calculateSpellcastingFactors(makeConfig('extended', { radius_advanced: 4 }));
      expect(result.factors[0]).toEqual({ type: 'Advanced Radius (yards)', value: '4', modifier: 1 });
    });

    it('radius_advanced 16 extended: modifier = 2', () => {
      const result = calculateSpellcastingFactors(makeConfig('extended', { radius_advanced: 16 }));
      expect(result.factors[0]).toEqual({ type: 'Advanced Radius (yards)', value: '16', modifier: 2 });
    });
  });

  // ─── Volume ────────────────────────────────────────────────────

  describe('Volume (cubic yards) factor', () => {
    it('no factor when volume is undefined', () => {
      const result = calculateSpellcastingFactors(makeConfig('instant'));
      expect(result.factors).toHaveLength(0);
    });

    it('no factor when volume is 0', () => {
      const result = calculateSpellcastingFactors(makeConfig('instant', { volume: 0 }));
      expect(result.factors).toHaveLength(0);
    });

    it('no factor when volume is 1', () => {
      const result = calculateSpellcastingFactors(makeConfig('instant', { volume: 1 }));
      expect(result.factors).toHaveLength(0);
    });

    it('volume 5 instant: included with modifier 0 (baseline)', () => {
      // ceil(log2(5/5)) = ceil(0) = 0 → 0 * -2 = -0, but > 1 guard passes
      // The factor IS included with modifier -0 (treated as 0)
      const result = calculateSpellcastingFactors(makeConfig('instant', { volume: 5 }));
      // volume > 1 is true, so factor is included; modifier is -0 (0 * -2)
      expect(result.factors).toHaveLength(1);
      expect(result.factors[0].modifier + 0).toBe(0);
    });

    it('volume 6 instant: modifier = -2 (ceil(log2(6/5)) = 1 * -2)', () => {
      const result = calculateSpellcastingFactors(makeConfig('instant', { volume: 6 }));
      expect(result.factors[0]).toEqual({ type: 'Volume (cubic yards)', value: '6', modifier: -2 });
    });

    it('volume 10 instant: modifier = -2 (ceil(log2(10/5)) = 1 * -2)', () => {
      const result = calculateSpellcastingFactors(makeConfig('instant', { volume: 10 }));
      expect(result.factors[0]).toEqual({ type: 'Volume (cubic yards)', value: '10', modifier: -2 });
    });

    it('volume 20 instant: modifier = -4 (ceil(log2(20/5)) = 2 * -2)', () => {
      const result = calculateSpellcastingFactors(makeConfig('instant', { volume: 20 }));
      expect(result.factors[0]).toEqual({ type: 'Volume (cubic yards)', value: '20', modifier: -4 });
    });

    it('volume 40 instant: modifier = -6 (ceil(log2(40/5)) = 3 * -2)', () => {
      const result = calculateSpellcastingFactors(makeConfig('instant', { volume: 40 }));
      expect(result.factors[0]).toEqual({ type: 'Volume (cubic yards)', value: '40', modifier: -6 });
    });

    it('volume 80 instant: modifier = -8 (ceil(log2(80/5)) = 4 * -2)', () => {
      const result = calculateSpellcastingFactors(makeConfig('instant', { volume: 80 }));
      expect(result.factors[0]).toEqual({ type: 'Volume (cubic yards)', value: '80', modifier: -8 });
    });

    it('volume 10 extended: modifier = 1', () => {
      const result = calculateSpellcastingFactors(makeConfig('extended', { volume: 10 }));
      expect(result.factors[0]).toEqual({ type: 'Volume (cubic yards)', value: '10', modifier: 1 });
    });

    it('volume 40 extended: modifier = 3', () => {
      const result = calculateSpellcastingFactors(makeConfig('extended', { volume: 40 }));
      expect(result.factors[0]).toEqual({ type: 'Volume (cubic yards)', value: '40', modifier: 3 });
    });

    it('volume 80 extended: modifier = 4', () => {
      const result = calculateSpellcastingFactors(makeConfig('extended', { volume: 80 }));
      expect(result.factors[0]).toEqual({ type: 'Volume (cubic yards)', value: '80', modifier: 4 });
    });
  });

  // ─── Advanced Volume ───────────────────────────────────────────

  describe('Advanced Volume (cubic yards) factor', () => {
    it('no factor when volume_advanced is undefined', () => {
      const result = calculateSpellcastingFactors(makeConfig('instant'));
      expect(result.factors).toHaveLength(0);
    });

    it('no factor when volume_advanced is 0', () => {
      const result = calculateSpellcastingFactors(makeConfig('instant', { volume_advanced: 0 }));
      expect(result.factors).toHaveLength(0);
    });

    it('no factor when volume_advanced is 1', () => {
      const result = calculateSpellcastingFactors(makeConfig('instant', { volume_advanced: 1 }));
      expect(result.factors).toHaveLength(0);
    });

    it('volume_advanced 5 instant: included with modifier 0 (baseline)', () => {
      // ceil(log4(5/5)) = ceil(0) = 0 → 0 * -2 = -0, but > 1 guard passes
      const result = calculateSpellcastingFactors(makeConfig('instant', { volume_advanced: 5 }));
      expect(result.factors).toHaveLength(1);
      expect(result.factors[0].modifier + 0).toBe(0);
    });

    it('volume_advanced 6 instant: modifier = -2 (ceil(log4(6/5)) = 1 * -2)', () => {
      const result = calculateSpellcastingFactors(makeConfig('instant', { volume_advanced: 6 }));
      expect(result.factors[0]).toEqual({ type: 'Advanced Volume (cubic yards)', value: '6', modifier: -2 });
    });

    it('volume_advanced 20 instant: modifier = -2 (ceil(log4(20/5)) = 1 * -2)', () => {
      const result = calculateSpellcastingFactors(makeConfig('instant', { volume_advanced: 20 }));
      expect(result.factors[0]).toEqual({ type: 'Advanced Volume (cubic yards)', value: '20', modifier: -2 });
    });

    it('volume_advanced 21 instant: modifier = -4 (ceil(log4(21/5)) = 2 * -2)', () => {
      const result = calculateSpellcastingFactors(makeConfig('instant', { volume_advanced: 21 }));
      expect(result.factors[0]).toEqual({ type: 'Advanced Volume (cubic yards)', value: '21', modifier: -4 });
    });

    it('volume_advanced 80 instant: modifier = -4 (ceil(log4(80/5)) = 2 * -2)', () => {
      const result = calculateSpellcastingFactors(makeConfig('instant', { volume_advanced: 80 }));
      expect(result.factors[0]).toEqual({ type: 'Advanced Volume (cubic yards)', value: '80', modifier: -4 });
    });

    it('volume_advanced 81 instant: modifier = -6 (ceil(log4(81/5)) = 3 * -2)', () => {
      const result = calculateSpellcastingFactors(makeConfig('instant', { volume_advanced: 81 }));
      expect(result.factors[0]).toEqual({ type: 'Advanced Volume (cubic yards)', value: '81', modifier: -6 });
    });

    it('volume_advanced 20 extended: modifier = 1', () => {
      const result = calculateSpellcastingFactors(makeConfig('extended', { volume_advanced: 20 }));
      expect(result.factors[0]).toEqual({ type: 'Advanced Volume (cubic yards)', value: '20', modifier: 1 });
    });

    it('volume_advanced 80 extended: modifier = 2', () => {
      const result = calculateSpellcastingFactors(makeConfig('extended', { volume_advanced: 80 }));
      expect(result.factors[0]).toEqual({ type: 'Advanced Volume (cubic yards)', value: '80', modifier: 2 });
    });
  });

  // ─── Duration: Turns (transitory) ─────────────────────────────

  describe('Turns (transitory) factor', () => {
    it('no factor when duration_turns is undefined', () => {
      const result = calculateSpellcastingFactors(makeConfig('instant'));
      expect(result.factors).toHaveLength(0);
    });

    it('no factor when duration_turns is 1 (baseline)', () => {
      const result = calculateSpellcastingFactors(makeConfig('instant', { duration_turns: 1 }));
      expect(result.factors).toHaveLength(0);
    });

    it('turns 2 instant: modifier = -2 (base 1 * -2)', () => {
      const result = calculateSpellcastingFactors(makeConfig('instant', { duration_turns: 2 }));
      expect(result.factors[0]).toEqual({ type: 'Turns (transitory)', value: '2', modifier: -2 });
    });

    it('turns 3 instant: modifier = -4 (base 2 * -2)', () => {
      const result = calculateSpellcastingFactors(makeConfig('instant', { duration_turns: 3 }));
      expect(result.factors[0]).toEqual({ type: 'Turns (transitory)', value: '3', modifier: -4 });
    });

    it('turns 4 instant: modifier = -6 (base 3 * -2)', () => {
      const result = calculateSpellcastingFactors(makeConfig('instant', { duration_turns: 4 }));
      expect(result.factors[0]).toEqual({ type: 'Turns (transitory)', value: '4', modifier: -6 });
    });

    it('turns 5 instant: modifier = -6 (base 3 * -2)', () => {
      const result = calculateSpellcastingFactors(makeConfig('instant', { duration_turns: 5 }));
      expect(result.factors[0]).toEqual({ type: 'Turns (transitory)', value: '5', modifier: -6 });
    });

    it('turns 6 instant: modifier = -8 (base 4 * -2)', () => {
      const result = calculateSpellcastingFactors(makeConfig('instant', { duration_turns: 6 }));
      expect(result.factors[0]).toEqual({ type: 'Turns (transitory)', value: '6', modifier: -8 });
    });

    it('turns 10 instant: modifier = -8 (base 4 * -2)', () => {
      const result = calculateSpellcastingFactors(makeConfig('instant', { duration_turns: 10 }));
      expect(result.factors[0]).toEqual({ type: 'Turns (transitory)', value: '10', modifier: -8 });
    });

    it('turns 11 instant: modifier = -10 (base 3 + ceil(11/10) = 5)', () => {
      const result = calculateSpellcastingFactors(makeConfig('instant', { duration_turns: 11 }));
      expect(result.factors[0]).toEqual({ type: 'Turns (transitory)', value: '11', modifier: -10 });
    });

    it('turns 20 instant: modifier = -10 (base 3 + ceil(20/10) = 5)', () => {
      const result = calculateSpellcastingFactors(makeConfig('instant', { duration_turns: 20 }));
      expect(result.factors[0]).toEqual({ type: 'Turns (transitory)', value: '20', modifier: -10 });
    });

    it('turns 50 instant: modifier = -16 (base 3 + ceil(50/10) = 8)', () => {
      const result = calculateSpellcastingFactors(makeConfig('instant', { duration_turns: 50 }));
      expect(result.factors[0]).toEqual({ type: 'Turns (transitory)', value: '50', modifier: -16 });
    });

    it('turns 5 extended: modifier = 3 (base 3 * 1)', () => {
      const result = calculateSpellcastingFactors(makeConfig('extended', { duration_turns: 5 }));
      expect(result.factors[0]).toEqual({ type: 'Turns (transitory)', value: '5', modifier: 3 });
    });

    it('turns 10 extended: modifier = 4 (base 4 * 1)', () => {
      const result = calculateSpellcastingFactors(makeConfig('extended', { duration_turns: 10 }));
      expect(result.factors[0]).toEqual({ type: 'Turns (transitory)', value: '10', modifier: 4 });
    });

    it('turns 50 extended: modifier = 8 (base 8 * 1)', () => {
      const result = calculateSpellcastingFactors(makeConfig('extended', { duration_turns: 50 }));
      expect(result.factors[0]).toEqual({ type: 'Turns (transitory)', value: '50', modifier: 8 });
    });
  });

  // ─── Duration: Hours (prolonged) ──────────────────────────────

  describe('Hours (prolonged) factor', () => {
    it('no factor when duration_hours is undefined', () => {
      const result = calculateSpellcastingFactors(makeConfig('instant'));
      expect(result.factors).toHaveLength(0);
    });

    it('no factor when duration_hours is 1 (baseline)', () => {
      const result = calculateSpellcastingFactors(makeConfig('instant', { duration_hours: 1 }));
      expect(result.factors).toHaveLength(0);
    });

    it('hours 2 instant: modifier = -2 (base 1 * -2)', () => {
      const result = calculateSpellcastingFactors(makeConfig('instant', { duration_hours: 2 }));
      expect(result.factors[0]).toEqual({ type: 'Hours (prolonged)', value: '2', modifier: -2 });
    });

    it('hours 3 instant: modifier = -4 (base 2 * -2)', () => {
      const result = calculateSpellcastingFactors(makeConfig('instant', { duration_hours: 3 }));
      expect(result.factors[0]).toEqual({ type: 'Hours (prolonged)', value: '3', modifier: -4 });
    });

    it('hours 12 instant: modifier = -4 (base 2 * -2)', () => {
      const result = calculateSpellcastingFactors(makeConfig('instant', { duration_hours: 12 }));
      expect(result.factors[0]).toEqual({ type: 'Hours (prolonged)', value: '12', modifier: -4 });
    });

    it('hours 13 instant: modifier = -6 (base 3 * -2)', () => {
      const result = calculateSpellcastingFactors(makeConfig('instant', { duration_hours: 13 }));
      expect(result.factors[0]).toEqual({ type: 'Hours (prolonged)', value: '13', modifier: -6 });
    });

    it('hours 24 instant: modifier = -6 (base 3 * -2)', () => {
      const result = calculateSpellcastingFactors(makeConfig('instant', { duration_hours: 24 }));
      expect(result.factors[0]).toEqual({ type: 'Hours (prolonged)', value: '24', modifier: -6 });
    });

    it('hours 25 instant: modifier = -8 (base 4 * -2)', () => {
      const result = calculateSpellcastingFactors(makeConfig('instant', { duration_hours: 25 }));
      expect(result.factors[0]).toEqual({ type: 'Hours (prolonged)', value: '25', modifier: -8 });
    });

    it('hours 48 instant: modifier = -8 (base 4 * -2)', () => {
      const result = calculateSpellcastingFactors(makeConfig('instant', { duration_hours: 48 }));
      expect(result.factors[0]).toEqual({ type: 'Hours (prolonged)', value: '48', modifier: -8 });
    });

    it('hours 49 instant: modifier = -10 (base 3 + ceil(49/48) = 5)', () => {
      const result = calculateSpellcastingFactors(makeConfig('instant', { duration_hours: 49 }));
      expect(result.factors[0]).toEqual({ type: 'Hours (prolonged)', value: '49', modifier: -10 });
    });

    it('hours 96 instant: modifier = -10 (base 3 + ceil(96/48) = 5)', () => {
      const result = calculateSpellcastingFactors(makeConfig('instant', { duration_hours: 96 }));
      expect(result.factors[0]).toEqual({ type: 'Hours (prolonged)', value: '96', modifier: -10 });
    });

    it('hours 200 instant: modifier = -16 (base 3 + ceil(200/48) = 8)', () => {
      const result = calculateSpellcastingFactors(makeConfig('instant', { duration_hours: 200 }));
      expect(result.factors[0]).toEqual({ type: 'Hours (prolonged)', value: '200', modifier: -16 });
    });

    it('hours 12 extended: modifier = 2 (base 2 * 1)', () => {
      const result = calculateSpellcastingFactors(makeConfig('extended', { duration_hours: 12 }));
      expect(result.factors[0]).toEqual({ type: 'Hours (prolonged)', value: '12', modifier: 2 });
    });

    it('hours 48 extended: modifier = 4 (base 4 * 1)', () => {
      const result = calculateSpellcastingFactors(makeConfig('extended', { duration_hours: 48 }));
      expect(result.factors[0]).toEqual({ type: 'Hours (prolonged)', value: '48', modifier: 4 });
    });

    it('hours 200 extended: modifier = 8 (base 8 * 1)', () => {
      const result = calculateSpellcastingFactors(makeConfig('extended', { duration_hours: 200 }));
      expect(result.factors[0]).toEqual({ type: 'Hours (prolonged)', value: '200', modifier: 8 });
    });
  });

  // ─── Duration: Days (prolonged) ───────────────────────────────

  describe('Days (prolonged) factor', () => {
    it('no factor when duration_days is undefined', () => {
      const result = calculateSpellcastingFactors(makeConfig('instant'));
      expect(result.factors).toHaveLength(0);
    });

    it('days 1 instant: modifier = -6 (base 3 * -2) — note: no > 1 guard', () => {
      const result = calculateSpellcastingFactors(makeConfig('instant', { duration_days: 1 }));
      expect(result.factors[0]).toEqual({ type: 'Days (prolonged)', value: '1', modifier: -6 });
    });

    it('days 2 instant: modifier = -8 (base 4 * -2)', () => {
      const result = calculateSpellcastingFactors(makeConfig('instant', { duration_days: 2 }));
      expect(result.factors[0]).toEqual({ type: 'Days (prolonged)', value: '2', modifier: -8 });
    });

    it('days 3 instant: modifier = -10 (base 3 + ceil(3/2) = 5)', () => {
      const result = calculateSpellcastingFactors(makeConfig('instant', { duration_days: 3 }));
      expect(result.factors[0]).toEqual({ type: 'Days (prolonged)', value: '3', modifier: -10 });
    });

    it('days 4 instant: modifier = -10 (base 3 + ceil(4/2) = 5)', () => {
      const result = calculateSpellcastingFactors(makeConfig('instant', { duration_days: 4 }));
      expect(result.factors[0]).toEqual({ type: 'Days (prolonged)', value: '4', modifier: -10 });
    });

    it('days 8 instant: modifier = -14 (base 3 + ceil(8/2) = 7)', () => {
      const result = calculateSpellcastingFactors(makeConfig('instant', { duration_days: 8 }));
      expect(result.factors[0]).toEqual({ type: 'Days (prolonged)', value: '8', modifier: -14 });
    });

    it('days 16 instant: modifier = -22 (base 3 + ceil(16/2) = 11)', () => {
      const result = calculateSpellcastingFactors(makeConfig('instant', { duration_days: 16 }));
      expect(result.factors[0]).toEqual({ type: 'Days (prolonged)', value: '16', modifier: -22 });
    });

    it('days 1 extended: modifier = 3 (base 3 * 1)', () => {
      const result = calculateSpellcastingFactors(makeConfig('extended', { duration_days: 1 }));
      expect(result.factors[0]).toEqual({ type: 'Days (prolonged)', value: '1', modifier: 3 });
    });

    it('days 4 extended: modifier = 5 (base 5 * 1)', () => {
      const result = calculateSpellcastingFactors(makeConfig('extended', { duration_days: 4 }));
      expect(result.factors[0]).toEqual({ type: 'Days (prolonged)', value: '4', modifier: 5 });
    });

    it('days 16 extended: modifier = 11 (base 11 * 1)', () => {
      const result = calculateSpellcastingFactors(makeConfig('extended', { duration_days: 16 }));
      expect(result.factors[0]).toEqual({ type: 'Days (prolonged)', value: '16', modifier: 11 });
    });
  });

  // ─── Duration: Advanced Prolonged ─────────────────────────────

  describe('Advanced prolonged factor', () => {
    it('no factor when duration_advanced_prolonged is undefined', () => {
      const result = calculateSpellcastingFactors(makeConfig('instant'));
      expect(result.factors).toHaveLength(0);
    });

    it('scene instant: modifier is 0 (base 0 * -2 = -0)', () => {
      const result = calculateSpellcastingFactors(makeConfig('instant', { duration_advanced_prolonged: 'scene' }));
      expect(result.factors[0].type).toBe('Advanced prolonged');
      expect(result.factors[0].value).toBe('One scene/hour');
      // 0 * -2 = -0 in JS; treat as 0
      expect(result.factors[0].modifier + 0).toBe(0);
    });

    it('day instant: modifier = -2 (base 1 * -2)', () => {
      const result = calculateSpellcastingFactors(makeConfig('instant', { duration_advanced_prolonged: 'day' }));
      expect(result.factors[0]).toEqual({ type: 'Advanced prolonged', value: '24 hours', modifier: -2 });
    });

    it('2days instant: modifier = -4 (base 2 * -2)', () => {
      const result = calculateSpellcastingFactors(makeConfig('instant', { duration_advanced_prolonged: '2days' }));
      expect(result.factors[0]).toEqual({ type: 'Advanced prolonged', value: '2 days', modifier: -4 });
    });

    it('week instant: modifier = -6 (base 3 * -2)', () => {
      const result = calculateSpellcastingFactors(makeConfig('instant', { duration_advanced_prolonged: 'week' }));
      expect(result.factors[0]).toEqual({ type: 'Advanced prolonged', value: 'One week', modifier: -6 });
    });

    it('month instant: modifier = -8 (base 4 * -2)', () => {
      const result = calculateSpellcastingFactors(makeConfig('instant', { duration_advanced_prolonged: 'month' }));
      expect(result.factors[0]).toEqual({ type: 'Advanced prolonged', value: 'One month', modifier: -8 });
    });

    it('indefinite instant: modifier = -10 (base 5 * -2)', () => {
      const result = calculateSpellcastingFactors(makeConfig('instant', { duration_advanced_prolonged: 'indefinite' }));
      expect(result.factors[0]).toEqual({ type: 'Advanced prolonged', value: 'Indefinite', modifier: -10 });
    });

    it('unknown value falls back to base 0', () => {
      const result = calculateSpellcastingFactors(makeConfig('instant', { duration_advanced_prolonged: 'unknown_value' }));
      expect(result.factors[0].type).toBe('Advanced prolonged');
      expect(result.factors[0].value).toBe('unknown_value');
      // default case: base 0 * -2 = -0; treat as 0
      expect(result.factors[0].modifier + 0).toBe(0);
    });

    it('scene extended: modifier = 0 (base 0 * 1)', () => {
      const result = calculateSpellcastingFactors(makeConfig('extended', { duration_advanced_prolonged: 'scene' }));
      expect(result.factors[0].type).toBe('Advanced prolonged');
      expect(result.factors[0].value).toBe('One scene/hour');
      expect(result.factors[0].modifier).toBe(0);
    });

    it('day extended: modifier = 1', () => {
      const result = calculateSpellcastingFactors(makeConfig('extended', { duration_advanced_prolonged: 'day' }));
      expect(result.factors[0]).toEqual({ type: 'Advanced prolonged', value: '24 hours', modifier: 1 });
    });

    it('week extended: modifier = 3', () => {
      const result = calculateSpellcastingFactors(makeConfig('extended', { duration_advanced_prolonged: 'week' }));
      expect(result.factors[0]).toEqual({ type: 'Advanced prolonged', value: 'One week', modifier: 3 });
    });

    it('month extended: modifier = 4', () => {
      const result = calculateSpellcastingFactors(makeConfig('extended', { duration_advanced_prolonged: 'month' }));
      expect(result.factors[0]).toEqual({ type: 'Advanced prolonged', value: 'One month', modifier: 4 });
    });

    it('indefinite extended: modifier = 5', () => {
      const result = calculateSpellcastingFactors(makeConfig('extended', { duration_advanced_prolonged: 'indefinite' }));
      expect(result.factors[0]).toEqual({ type: 'Advanced prolonged', value: 'Indefinite', modifier: 5 });
    });
  });

  // ─── Multiple factors combined ─────────────────────────────────

  describe('multiple factors combined', () => {
    it('instant: potency + targets sum correctly', () => {
      const result = calculateSpellcastingFactors(
        makeConfig('instant', { potency: 3, targets: 4 }),
      );

      expect(result.factors).toHaveLength(2);
      expect(result.factors[0]).toEqual({ type: 'Potency', value: '3', modifier: -4 });
      expect(result.factors[1]).toEqual({ type: 'Targets', value: '4', modifier: -4 });
      expect(result.total).toBe(-8);
    });

    it('instant: potency + targets + size + radius + turns', () => {
      const result = calculateSpellcastingFactors(
        makeConfig('instant', {
          potency: 2,
          targets: 2,
          size: 8,
          radius: 4,
          duration_turns: 5,
        }),
      );

      expect(result.factors).toHaveLength(5);
      // potency 2 = -2, targets 2 = -2, size 8 = -6, radius 4 = -4, turns 5 = -6
      expect(result.total).toBe(-20);
    });

    it('instant: all volume factors combined', () => {
      const result = calculateSpellcastingFactors(
        makeConfig('instant', {
          volume: 40,
          volume_advanced: 80,
        }),
      );

      expect(result.factors).toHaveLength(2);
      expect(result.factors[0].type).toBe('Volume (cubic yards)');
      expect(result.factors[1].type).toBe('Advanced Volume (cubic yards)');
    });

    it('instant: all radius factors combined', () => {
      const result = calculateSpellcastingFactors(
        makeConfig('instant', {
          radius: 8,
          radius_advanced: 16,
        }),
      );

      expect(result.factors).toHaveLength(2);
      expect(result.factors[0].type).toBe('Radius (yards)');
      expect(result.factors[1].type).toBe('Advanced Radius (yards)');
    });

    it('instant: all duration factors combined', () => {
      const result = calculateSpellcastingFactors(
        makeConfig('instant', {
          duration_turns: 10,
          duration_hours: 48,
          duration_days: 4,
          duration_advanced_prolonged: 'indefinite',
        }),
      );

      expect(result.factors).toHaveLength(4);
      // turns 10 = -8, hours 48 = -8, days 4 = -10, indefinite = -10
      expect(result.total).toBe(-36);
    });

    it('extended: potency + size + duration combined', () => {
      const result = calculateSpellcastingFactors(
        makeConfig('extended', {
          potency: 5,
          size: 10,
          duration_days: 2,
        }),
      );

      expect(result.factors).toHaveLength(3);
      // potency 5 = 4, size 10 = 4, days 2 = 4
      expect(result.total).toBe(12);
    });

    it('extended: all factors at maximum', () => {
      const result = calculateSpellcastingFactors(
        makeConfig('extended', {
          potency: 5,
          targets: 16,
          size: 16,
          radius: 16,
          radius_advanced: 16,
          volume: 80,
          volume_advanced: 80,
          duration_turns: 50,
          duration_hours: 200,
          duration_days: 16,
          duration_advanced_prolonged: 'indefinite',
        }),
      );

      expect(result.factors).toHaveLength(11);
      expect(result.total).toBeGreaterThan(0);
      result.factors.forEach((f) => {
        expect(f.modifier).toBeGreaterThanOrEqual(0);
      });
    });

    it('instant: all factors at maximum produce large negative total', () => {
      const result = calculateSpellcastingFactors(
        makeConfig('instant', {
          potency: 5,
          targets: 16,
          size: 16,
          radius: 16,
          radius_advanced: 16,
          volume: 80,
          volume_advanced: 80,
          duration_turns: 50,
          duration_hours: 200,
          duration_days: 16,
          duration_advanced_prolonged: 'indefinite',
        }),
      );

      expect(result.factors).toHaveLength(11);
      expect(result.total).toBeLessThan(0);
      result.factors.forEach((f) => {
        expect(f.modifier).toBeLessThanOrEqual(0);
      });
    });
  });

  // ─── Edge cases ────────────────────────────────────────────────

  describe('edge cases', () => {
    it('all optional fields undefined returns empty', () => {
      const result = calculateSpellcastingFactors(makeConfig('instant'));
      expect(result).toEqual({ factors: [], total: 0 });
    });

    it('all factors at baseline values (1 or 0) produce no modifiers', () => {
      const result = calculateSpellcastingFactors(makeConfig('instant', {
        potency: 1,
        targets: 1,
        size: 1,
        radius: 0,
        radius_advanced: 0,
        volume: 0,
        volume_advanced: 0,
        duration_turns: 1,
        duration_hours: 1,
      }));

      expect(result).toEqual({ factors: [], total: 0 });
    });

    it('extended action with no factors returns empty', () => {
      const result = calculateSpellcastingFactors(makeConfig('extended'));
      expect(result).toEqual({ factors: [], total: 0 });
    });

    it('factors maintain insertion order', () => {
      const result = calculateSpellcastingFactors(
        makeConfig('instant', {
          potency: 2,
          targets: 2,
          size: 8,
          radius: 4,
          duration_turns: 5,
        }),
      );

      const types = result.factors.map((f) => f.type);
      expect(types).toEqual([
        'Potency',
        'Targets',
        'Size',
        'Radius (yards)',
        'Turns (transitory)',
      ]);
    });
  });
});
