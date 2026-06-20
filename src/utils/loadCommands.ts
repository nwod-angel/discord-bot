import { readdir } from "node:fs/promises";
import { join } from "node:path";
import { logger } from "../logger.js";

/** Patterns to skip during module discovery. */
const IGNORED_PATTERNS = [".test.ts", ".test.js", ".d.ts", ".d.js", ".map"];

/**
 * Scan a directory for TypeScript/JavaScript modules and return their
 * exports, filtered by a validation predicate.
 *
 * Adapted from EvoBot's filesystem discovery and LavaMusic's build-time
 * registry — runs at startup (no build step).
 *
 * @param dir - Absolute path to the directory to scan
 * @param validate - Predicate that determines whether an export matches the expected shape
 * @param label - Human-readable label for logging (e.g., "command", "autocomplete command")
 * @returns Array of validated exports, sorted alphabetically by `name` if present
 */
export async function discoverModules<T>(
  dir: string,
  validate: (mod: unknown) => mod is T,
  label: string,
): Promise<T[]> {
  const results: T[] = [];
  let entries: string[];

  try {
    entries = await readdir(dir);
  } catch (err) {
    logger.warn({ err, dir }, `[discoverModules] Could not read ${label} directory`);
    return results;
  }

  for (const file of entries) {
    // Skip non-source files
    if (IGNORED_PATTERNS.some((p) => file.endsWith(p))) continue;
    if (!file.endsWith(".ts") && !file.endsWith(".js")) continue;

    const fullPath = join(dir, file);
    try {
      const mod = await import(fullPath);

      // Support both default exports and named exports
      // Find the first export that isn't the ESM module wrapper
      const exportKeys = Object.keys(mod).filter((k) => k !== "__esModule");
      const exported = mod.default ?? (exportKeys.length > 0 ? mod[exportKeys[0]] : undefined);

      if (validate(exported)) {
        results.push(exported);
        logger.debug({ file, name: (exported as Record<string, unknown>).name }, `[discoverModules] Loaded ${label}`);
      } else {
        logger.debug({ file }, `[discoverModules] Skipping ${file} — does not match ${label} shape`);
      }
    } catch (err) {
      logger.error({ err, file }, `[discoverModules] Failed to import ${file}`);
    }
  }

  // Sort alphabetically by `name` for deterministic order
  results.sort((a, b) => {
    const nameA = (a as Record<string, unknown>).name as string;
    const nameB = (b as Record<string, unknown>).name as string;
    return nameA.localeCompare(nameB);
  });

  return results;
}
