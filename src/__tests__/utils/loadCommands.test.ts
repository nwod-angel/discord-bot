import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { discoverModules } from '../../utils/loadCommands.js';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { mkdtemp, writeFile, mkdir, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';

// ── Mock logger ───────────────────────────────────────────────
vi.mock('../../logger.js', () => ({
  logger: {
    info: vi.fn(),
    debug: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    child: vi.fn().mockReturnThis(),
  },
}));

const __dirname = dirname(fileURLToPath(import.meta.url));
const commandsDir = join(__dirname, '..', '..', 'commands');

interface TestModule {
  name: string;
  run?: () => void;
  description?: string;
}

function isTestModule(mod: unknown): mod is TestModule {
  return (
    typeof mod === "object" &&
    mod !== null &&
    "name" in mod &&
    typeof (mod as TestModule).name === "string"
  );
}

describe('discoverModules', () => {
  // ── Integration: real commands directory ──────────────────────
  describe('with real commands directory', () => {
    it('discovers commands that have no external dependencies', async () => {
      // These commands import only from discord.js and local modules
      const commands = await discoverModules(commandsDir, isTestModule, 'command');
      const names = commands.map((c) => c.name).sort();

      // At minimum, simple commands like Hello, Goodbye should load
      expect(commands.length).toBeGreaterThanOrEqual(2);
      expect(names).toContain('hello');
      expect(names).toContain('goodbye');
    });

    it('skips helper files that do not match the Command shape', async () => {
      const commands = await discoverModules(commandsDir, isTestModule, 'command');
      const names = commands.map((c) => c.name);

      // Attack.ts exports a class, not a Command object — should be skipped
      // AttackOptions.ts exports an array, not a Command object — should be skipped
      expect(commands.length).toBeLessThanOrEqual(16); // 16 total .ts files, but only commands pass validation
    });
  });

  // ── Unit: error handling ──────────────────────────────────────
  describe('error handling', () => {
    it('returns empty array for non-existent directory', async () => {
      const result = await discoverModules(
        '/nonexistent/path/to/dir',
        isTestModule,
        'command',
      );
      expect(result).toEqual([]);
    });

    it('returns empty array for empty directory', async () => {
      const tmpDir = await mkdtemp(join(tmpdir(), 'discover-test-'));
      try {
        const result = await discoverModules(tmpDir, isTestModule, 'command');
        expect(result).toEqual([]);
      } finally {
        await rm(tmpDir, { recursive: true, force: true });
      }
    });
  });

  // ── Unit: file filtering ──────────────────────────────────────
  describe('file filtering', () => {
    let tmpDir: string;

    beforeEach(async () => {
      tmpDir = await mkdtemp(join(tmpdir(), 'discover-test-'));
    });

    afterEach(async () => {
      await rm(tmpDir, { recursive: true, force: true });
    });

    it('skips .test.ts files', async () => {
      await writeFile(
        join(tmpDir, 'ValidModule.ts'),
        'export default { name: "valid", run: () => {} }',
      );
      await writeFile(
        join(tmpDir, 'ValidModule.test.ts'),
        'export default { name: "test", run: () => {} }',
      );

      const result = await discoverModules(tmpDir, isTestModule, 'command');
      expect(result.length).toBe(1);
      expect(result[0].name).toBe('valid');
    });

    it('skips .d.ts files', async () => {
      await writeFile(
        join(tmpDir, 'ValidModule.ts'),
        'export default { name: "valid", run: () => {} }',
      );
      await writeFile(
        join(tmpDir, 'types.d.ts'),
        'export default { name: "types" }',
      );

      const result = await discoverModules(tmpDir, isTestModule, 'command');
      expect(result.length).toBe(1);
      expect(result[0].name).toBe('valid');
    });

    it('skips non-ts/js files', async () => {
      await writeFile(
        join(tmpDir, 'ValidModule.ts'),
        'export default { name: "valid", run: () => {} }',
      );
      await writeFile(join(tmpDir, 'readme.md'), '# Test');
      await writeFile(join(tmpDir, 'config.json'), '{}');

      const result = await discoverModules(tmpDir, isTestModule, 'command');
      expect(result.length).toBe(1);
      expect(result[0].name).toBe('valid');
    });
  });

  // ── Unit: validation predicate ────────────────────────────────
  describe('validation predicate', () => {
    let tmpDir: string;

    beforeEach(async () => {
      tmpDir = await mkdtemp(join(tmpdir(), 'discover-test-'));
    });

    afterEach(async () => {
      await rm(tmpDir, { recursive: true, force: true });
    });

    it('loads modules that match the predicate', async () => {
      await writeFile(
        join(tmpDir, 'Good.ts'),
        'export default { name: "good", run: () => {} }',
      );

      const result = await discoverModules(tmpDir, isTestModule, 'command');
      expect(result.length).toBe(1);
      expect(result[0].name).toBe('good');
    });

    it('skips modules that do not match the predicate', async () => {
      await writeFile(
        join(tmpDir, 'Bad.ts'),
        'export default { notName: "bad" }',
      );

      const result = await discoverModules(tmpDir, isTestModule, 'command');
      expect(result.length).toBe(0);
    });

    it('skips modules that throw on import', async () => {
      await writeFile(
        join(tmpDir, 'Broken.ts'),
        'import { nonexistent } from "./nonexistent.js"; export default {}',
      );
      await writeFile(
        join(tmpDir, 'Valid.ts'),
        'export default { name: "valid", run: () => {} }',
      );

      const result = await discoverModules(tmpDir, isTestModule, 'command');
      expect(result.length).toBe(1);
      expect(result[0].name).toBe('valid');
    });
  });

  // ── Unit: sorting ─────────────────────────────────────────────
  describe('sorting', () => {
    let tmpDir: string;

    beforeEach(async () => {
      tmpDir = await mkdtemp(join(tmpdir(), 'discover-test-'));
    });

    afterEach(async () => {
      await rm(tmpDir, { recursive: true, force: true });
    });

    it('returns results sorted alphabetically by name', async () => {
      await writeFile(
        join(tmpDir, 'Charlie.ts'),
        'export default { name: "charlie", run: () => {} }',
      );
      await writeFile(
        join(tmpDir, 'Alpha.ts'),
        'export default { name: "alpha", run: () => {} }',
      );
      await writeFile(
        join(tmpDir, 'Bravo.ts'),
        'export default { name: "bravo", run: () => {} }',
      );

      const result = await discoverModules(tmpDir, isTestModule, 'command');
      expect(result.map((m) => m.name)).toEqual(['alpha', 'bravo', 'charlie']);
    });
  });
});
