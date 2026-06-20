/**
 * Pure TypeScript module for computing spellcasting dice pool modifiers.
 *
 * Extracted from CastCommand.ts to enable unit testing without Discord mocks.
 * The instant/extended duplication collapses into a single parameterized function:
 * instant applies penalties (sign = -2), extended applies bonuses (sign = 1).
 */

/** Supported spell action types. */
export type SpellAction = 'instant' | 'extended';

/** Input configuration for spellcasting factor calculations. */
export interface SpellcastingFactorsConfig {
    action: SpellAction;
    potency?: number;
    targets?: number;
    size?: number;
    radius?: number;
    radius_advanced?: number;
    volume?: number;
    volume_advanced?: number;
    duration_turns?: number;
    duration_hours?: number;
    duration_days?: number;
    duration_advanced_prolonged?: string;
}

/** A single computed spellcasting factor modifier. */
export interface SpellcastingFactorResult {
    type: string;
    value: string;
    modifier: number;
}

/** Complete result of spellcasting factor calculations. */
export interface SpellcastingFactorsOutput {
    factors: SpellcastingFactorResult[];
    total: number;
}

/** Advanced prolonged duration option labels. */
const ADVANCED_PROLONGED_LABELS: Record<string, string> = {
    scene: 'One scene/hour',
    day: '24 hours',
    '2days': '2 days',
    week: 'One week',
    month: 'One month',
    indefinite: 'Indefinite',
};

/**
 * Computes spellcasting dice pool modifiers based on the spell configuration.
 *
 * Instant actions apply penalties (negative modifiers, sign = -2).
 * Extended actions apply bonuses (positive modifiers, sign = 1).
 *
 * @param config - The spell configuration to compute factors for
 * @returns The computed factors, their total, and sign information
 */
export function calculateSpellcastingFactors(config: SpellcastingFactorsConfig): SpellcastingFactorsOutput {
    const factors: SpellcastingFactorResult[] = [];
    const sign = config.action === 'instant' ? -2 : 1;

    // Potency
    if (config.potency !== undefined && config.potency > 1) {
        factors.push({
            type: 'Potency',
            value: config.potency.toString(),
            modifier: (config.potency - 1) * sign,
        });
    }

    // Targets
    if (config.targets !== undefined && config.targets > 1) {
        factors.push({
            type: 'Targets',
            value: config.targets.toString(),
            modifier: Math.ceil(Math.log2(config.targets)) * sign,
        });
    }

    // Size
    if (config.size !== undefined && config.size > 5) {
        factors.push({
            type: 'Size',
            value: config.size.toString(),
            modifier: Math.ceil(Math.log2(config.size)) * sign,
        });
    }

    // Radius (yards)
    if (config.radius !== undefined && config.radius > 1) {
        factors.push({
            type: 'Radius (yards)',
            value: config.radius.toString(),
            modifier: Math.ceil(Math.log2(config.radius)) * sign,
        });
    }

    // Advanced Radius (yards)
    if (config.radius_advanced !== undefined && config.radius_advanced > 1) {
        factors.push({
            type: 'Advanced Radius (yards)',
            value: config.radius_advanced.toString(),
            modifier: Math.ceil(Math.log(config.radius_advanced) / Math.log(4)) * sign,
        });
    }

    // Volume (cubic yards)
    if (config.volume !== undefined && config.volume > 1) {
        factors.push({
            type: 'Volume (cubic yards)',
            value: config.volume.toString(),
            modifier: Math.ceil(Math.log2(config.volume / 5)) * sign,
        });
    }

    // Advanced Volume (cubic yards)
    if (config.volume_advanced !== undefined && config.volume_advanced > 1) {
        factors.push({
            type: 'Advanced Volume (cubic yards)',
            value: config.volume_advanced.toString(),
            modifier: Math.ceil(Math.log(config.volume_advanced / 5) / Math.log(4)) * sign,
        });
    }

    // Duration: Turns (transitory)
    if (config.duration_turns !== undefined && config.duration_turns > 1) {
        const turns = config.duration_turns;
        let baseModifier: number;

        if (turns === 2) {
            baseModifier = 1;
        } else if (turns === 3) {
            baseModifier = 2;
        } else if (turns > 3 && turns <= 5) {
            baseModifier = 3;
        } else if (turns > 5 && turns <= 10) {
            baseModifier = 4;
        } else {
            baseModifier = 3 + Math.ceil(turns / 10);
        }

        factors.push({
            type: 'Turns (transitory)',
            value: turns.toString(),
            modifier: baseModifier * sign,
        });
    }

    // Duration: Hours (prolonged)
    if (config.duration_hours !== undefined && config.duration_hours > 1) {
        const hours = config.duration_hours;
        let baseModifier: number;

        if (hours === 2) {
            baseModifier = 1;
        } else if (hours > 2 && hours <= 12) {
            baseModifier = 2;
        } else if (hours > 12 && hours <= 24) {
            baseModifier = 3;
        } else if (hours > 24 && hours <= 48) {
            baseModifier = 4;
        } else {
            baseModifier = 3 + Math.ceil(hours / 48);
        }

        factors.push({
            type: 'Hours (prolonged)',
            value: hours.toString(),
            modifier: baseModifier * sign,
        });
    }

    // Duration: Days (prolonged)
    // NOTE: Original code checks `if (spell.duration_days)` — no > 1 guard.
    // This preserves that behavior (duration_days=1 is valid).
    if (config.duration_days !== undefined) {
        const days = config.duration_days;
        let baseModifier: number;

        if (days === 1) {
            baseModifier = 3;
        } else if (days === 2) {
            baseModifier = 4;
        } else {
            baseModifier = 3 + Math.ceil(days / 2);
        }

        factors.push({
            type: 'Days (prolonged)',
            value: days.toString(),
            modifier: baseModifier * sign,
        });
    }

    // Duration: Advanced prolonged
    if (config.duration_advanced_prolonged !== undefined) {
        const label = ADVANCED_PROLONGED_LABELS[config.duration_advanced_prolonged] ?? config.duration_advanced_prolonged;
        let baseModifier: number;

        switch (config.duration_advanced_prolonged) {
            case 'scene':
                baseModifier = 0;
                break;
            case 'day':
                baseModifier = 1;
                break;
            case '2days':
                baseModifier = 2;
                break;
            case 'week':
                baseModifier = 3;
                break;
            case 'month':
                baseModifier = 4;
                break;
            case 'indefinite':
                baseModifier = 5;
                break;
            default:
                baseModifier = 0;
        }

        factors.push({
            type: 'Advanced prolonged',
            value: label,
            modifier: baseModifier * sign,
        });
    }

    const total = factors.reduce((sum, f) => sum + f.modifier, 0);

    return { factors, total };
}
