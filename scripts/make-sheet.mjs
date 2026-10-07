// Builds a labeled contact sheet of verified Unsplash photos for visual review.
import { readFileSync, writeFileSync } from "node:fs";

const ids = readFileSync(new URL("./results.txt", import.meta.url), "utf8")
  .split("\n")
  .filter((l) => l.startsWith("OK "))
  .map((l) => l.slice(3).trim());

const cells = ids
  .map(
    (id, i) => `<figure>
  <img loading="eager" src="https://images.unsplash.com/photo-${id}?w=300&h=220&fit=crop&q=60" />
  <figcaption>${i}</figcaption>
</figure>`
  )
  .join("\n");

writeFileSync(
  new URL("./sheet.html", import.meta.url),
  `<!doctype html><meta charset="utf-8"><title>sheet</title>
<style>
  body { margin:0; background:#111; font:600 13px ui-sans-serif,system-ui; }
  .grid { display:grid; grid-template-columns:repeat(6,1fr); gap:2px; }
  figure { margin:0; position:relative; aspect-ratio:300/220; background:#222; }
  img { width:100%; height:100%; object-fit:cover; display:block; }
  figcaption { position:absolute; top:0; left:0; background:#0f0; color:#000; padding:1px 5px; }
</style>
<div class="grid">${cells}</div>`
);

writeFileSync(new URL("./ids.json", import.meta.url), JSON.stringify(ids, null, 2));
console.log(`sheet.html written with ${ids.length} photos`);
