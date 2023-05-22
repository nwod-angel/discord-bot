import { Command } from "./Command.js";
import { Hello } from "./commands/Hello.js";
import { Roll } from "./commands/Roll.js";
import { Goodbye } from "./commands/Goodbye.js";
import { SpellCommand } from "./commands/SpellCommand.js";
import { MeritCommand } from "./commands/MeritCommand.js";
import { RuleCommand } from "./commands/RuleCommand.js";

export const Commands: Command[] = [
    Hello,
    Roll,
    Goodbye,
    SpellCommand,
    MeritCommand,
    RuleCommand
];