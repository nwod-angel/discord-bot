# export-dice.mjs

Renders d10 PNGs from the SVG template for use as Discord custom emojis. Uses
`@resvg/resvg-js` to convert SVG → PNG server-side.

## Usage

```bash
# single colour scheme
node scripts/export-dice.mjs red

# all schemes
node scripts/export-dice.mjs all
```

Output goes to `assets/d10_<scheme>_<N>.png` (e.g. `assets/d10_red_1.png`).
Each face gets a separate file; "10" is rendered as `0` (Discord convention).

## Colour schemes

| Scheme | Top | Side | Bottom |
|--------|-----|------|--------|
| red    | #bb2222 | #991111 | #660000 |
| blue   | #2244bb | #113399 | #002266 |
| green  | #228822 | #116611 | #004400 |

All schemes use white text (`#f9f9f9`) and black strokes (`#000000`).

## Adding a scheme

Add an entry to `SCHEMES` in `export-dice.mjs`. Keys are the default hex
colours in `d10_template.svg`; values are the replacement colours:

```
red: {
  "#bb2222": "#bb2222",   // top face
  "#991111": "#991111",   // side face
  "#660000": "#660000",   // bottom face
  "#f9f9f9": "#f9f9f9",   // numeral
  "#000000": "#000000",   // stroke
},
```

Only need to override the slots that differ from the red default.

## Template

`assets/d10_template.svg` uses real hex colours so it renders when viewed
directly. The die geometry is in a `<defs>` block instanced via `<use>`,
with a `<text>` element for the numeral (`N` placeholder). Classes
(`die-top`, `die-side`, etc.) define fill/stroke for each face.
