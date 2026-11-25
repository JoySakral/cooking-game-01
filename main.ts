// main.ts — the entrypoint: hands the game in by copying game/ and
// screenshots/ into the output directory and writing dossier.json with
// buildDossier from vendor/makefun-game.ts.
//
// Run it locally with:
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
// The grader runs it twice with /output as the target; both runs must
// produce identical bytes, so nothing here depends on the clock or on
// random data — only on the files in this repository.

import { buildDossier } from './vendor/makefun-game.ts';
import {
  cpSync,
  existsSync,
  mkdirSync,
  readdirSync,
  rmSync,
  statSync,
  writeFileSync,
} from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const REPO_ROOT = dirname(fileURLToPath(import.meta.url));
const OUTPUT_DIR = resolve(process.env.MAKEFUN_OUTPUT_DIR ?? '/output');

const GAME_DIR = join(REPO_ROOT, 'game');
const SHOTS_DIR = join(REPO_ROOT, 'screenshots');

function fail(message: string): never {
  console.error(`main.ts: ${message}`);
  process.exit(1);
}

// Count every file and directory below a path, for the final log line.
function countEntries(dir: string): number {
  let total = 0;
  for (const name of readdirSync(dir)) {
    const child = join(dir, name);
    total += 1;
    if (statSync(child).isDirectory()) total += countEntries(child);
  }
  return total;
}

function checkInputs(): void {
  if (!existsSync(GAME_DIR) || !statSync(GAME_DIR).isDirectory()) {
    fail('game/ is missing — the playable game must be in game/');
  }
  const indexHtml = join(GAME_DIR, 'index.html');
  if (!existsSync(indexHtml) || !statSync(indexHtml).isFile()) {
    fail('game/index.html is missing — the game needs an entry page');
  }
  if (!existsSync(SHOTS_DIR) || !statSync(SHOTS_DIR).isDirectory()) {
    fail('screenshots/ is missing — the entry needs 3 or 4 screenshots');
  }
  const shots = readdirSync(SHOTS_DIR).filter((n) => !n.startsWith('.'));
  if (shots.length < 3 || shots.length > 4) {
    fail(`screenshots/ holds ${shots.length} images, need 3 or 4`);
  }
  for (const name of shots) {
    const file = join(SHOTS_DIR, name);
    if (!statSync(file).isFile()) fail(`screenshots/${name} is not a file`);
    if (statSync(file).size > 256 * 1024) {
      fail(`screenshots/${name} is over the 256 KiB cap`);
    }
  }
  console.log(`main.ts: found ${shots.length} screenshots, game/ has ${countEntries(GAME_DIR)} entries`);
}

function copyTree(from: string, to: string): void {
  mkdirSync(to, { recursive: true });
  cpSync(from, to, { recursive: true });
}

function main(): void {
  checkInputs();

  // Start from a clean output directory so a stale file can never leak in.
  rmSync(OUTPUT_DIR, { recursive: true, force: true });
  mkdirSync(OUTPUT_DIR, { recursive: true });

  copyTree(GAME_DIR, join(OUTPUT_DIR, 'game'));
  copyTree(SHOTS_DIR, join(OUTPUT_DIR, 'screenshots'));

  // buildDossier reads game/ and screenshots/ back from the output
  // directory and writes the dossier the gate compares byte for byte.
  const dossier = buildDossier(OUTPUT_DIR, {
    text_max_bytes: 163840,
    screenshots: { max: 4, max_bytes: 256 * 1024 },
    game_max_files: 993,
    game_max_bytes: 48 * 1024 * 1024,
    game_path_max_bytes: 1000,
  });
  writeFileSync(join(OUTPUT_DIR, 'dossier.json'), dossier);
  if (dossier.length === 0) fail('buildDossier wrote an empty dossier');

  const outGame = countEntries(join(OUTPUT_DIR, 'game'));
  const outShots = readdirSync(join(OUTPUT_DIR, 'screenshots')).length;
  console.log(
    `main.ts: wrote ${OUTPUT_DIR} — game/ (${outGame} entries), ` +
    `screenshots/ (${outShots} files), dossier.json (${dossier.length} bytes)`,
  );
}

main();
