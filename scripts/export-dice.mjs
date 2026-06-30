import { readFileSync, writeFileSync, existsSync, mkdirSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { renderAsync } from "@resvg/resvg-js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ASSETS = join(__dirname, "..", "assets");

// Maps default template colours → scheme colours.
// Keys are the hex values used in d10_template.svg (the "red" defaults).
const SCHEMES = {
  red: {
    "#bb2222": "#bb2222",
    "#991111": "#991111",
    "#660000": "#660000",
    "#f9f9f9": "#f9f9f9",
    "#000000": "#000000",
  },
  blue: {
    "#bb2222": "#2244bb",
    "#991111": "#113399",
    "#660000": "#002266",
    "#f9f9f9": "#f9f9f9",
    "#000000": "#000000",
  },
  green: {
    "#bb2222": "#228822",
    "#991111": "#116611",
    "#660000": "#004400",
    "#f9f9f9": "#f9f9f9",
    "#000000": "#000000",
  },
};

const NUMBERS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 0];

const template = readFileSync(join(ASSETS, "d10_template.svg"), "utf-8");

async function main() {
  const arg = process.argv[2];
  const schemes = arg === "all" ? Object.keys(SCHEMES) : [arg ?? "red"];

  for (const scheme of schemes) {
    const colors = SCHEMES[scheme];
    if (!colors) {
      console.error(`Unknown scheme: "${scheme}". Available: ${Object.keys(SCHEMES).join(", ")}, all`);
      process.exit(1);
    }
    for (const n of NUMBERS) {
      let svg = template.replace("N", String(n));
      for (const [defaultColour, schemeColour] of Object.entries(colors)) {
        svg = svg.replaceAll(defaultColour, schemeColour);
      }
      const img = await renderAsync(Buffer.from(svg), {
        fitTo: { mode: "width", value: 128 },
      });
      const out = join(ASSETS, `d10_${scheme}_${n}.png`);
      if (!existsSync(dirname(out))) mkdirSync(dirname(out), { recursive: true });
      writeFileSync(out, img.asPng());
      console.log(`✓ ${out}`);
    }
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
