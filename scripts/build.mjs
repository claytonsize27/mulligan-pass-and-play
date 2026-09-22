import { mkdir, copyFile, cp, readdir, stat } from "node:fs/promises";
await mkdir("dist", { recursive: true });
for (const f of [
  "index.html",
  "style.css",
  "icon.svg",
  "manifest.webmanifest",
  "sw.js",
])
  await copyFile(f, `dist/${f}`);
for (const f of ["src", "docs"]) await cp(f, `dist/${f}`, { recursive: true });
await copyFile(".nojekyll", "dist/.nojekyll");
async function size(dir) {
  let total = 0;
  for (const f of await readdir(dir, { withFileTypes: true }))
    total += f.isDirectory()
      ? await size(`${dir}/${f.name}`)
      : (await stat(`${dir}/${f.name}`)).size;
  return total;
}
console.log(
  `Static build ready in dist (${await size("dist")} bytes). No runtime dependencies.`,
);
