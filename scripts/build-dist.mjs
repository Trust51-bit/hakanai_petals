import { copyFileSync, existsSync, mkdirSync, readdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { dirname, extname, join, relative } from "node:path";

const root = process.cwd();
const outDir = join(root, "dist");
const assetDirs = ["immagini ", "autore", "AUDIO & VIDEO", "Podcasts"];
const textFiles = ["robots.txt", "sitemap.xml"];

function ensureDir(path) {
  mkdirSync(path, { recursive: true });
}

function write(path, content) {
  ensureDir(dirname(path));
  writeFileSync(path, content);
}

function copyDir(from, to) {
  if (!existsSync(from)) return;
  ensureDir(to);

  for (const entry of readdirSync(from)) {
    if (entry === ".DS_Store") continue;

    const source = join(from, entry);
    const target = join(to, entry);
    const stat = statSync(source);

    if (stat.isDirectory()) {
      copyDir(source, target);
    } else {
      ensureDir(dirname(target));
      copyFileSync(source, target);
    }
  }
}

function minifyCss(css) {
  return css
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/\s+/g, " ")
    .replace(/\s*([{}:;,>~+])\s*/g, "$1")
    .replace(/;}/g, "}")
    .trim();
}

function minifyJs(js) {
  return js
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/(^|[^:])\/\/.*$/gm, "$1")
    .replace(/\s+/g, " ")
    .replace(/\s*([{}();,:=+\-*/<>?])\s*/g, "$1")
    .trim();
}

function minifyInlineScripts(html) {
  return html.replace(/<script(?![^>]*\bsrc=)([^>]*)>([\s\S]*?)<\/script>/gi, (_match, attrs, code) => {
    return `<script${attrs}>${minifyJs(code)}</script>`;
  });
}

function minifyHtml(html) {
  return minifyInlineScripts(html)
    .replace(/<!--[\s\S]*?-->/g, "")
    .replace(/\s+/g, " ")
    .replace(/>\s+</g, "><")
    .replace(/\s*(<\/?(?:html|head|body|main|section|header|footer|nav|div|ul|li|p|h[1-6]|article|figure|figcaption)[^>]*>)\s*/gi, "$1")
    .trim();
}

function collectFiles(dir, predicate, files = []) {
  for (const entry of readdirSync(dir)) {
    if (entry === ".git" || entry === "dist" || entry === "scripts") continue;

    const path = join(dir, entry);
    const stat = statSync(path);

    if (stat.isDirectory()) {
      collectFiles(path, predicate, files);
    } else if (predicate(path)) {
      files.push(path);
    }
  }

  return files;
}

ensureDir(outDir);

for (const dir of assetDirs) {
  copyDir(join(root, dir), join(outDir, dir));
}

for (const file of textFiles) {
  const source = join(root, file);
  if (existsSync(source)) copyFileSync(source, join(outDir, file));
}

for (const file of collectFiles(root, (path) => extname(path).toLowerCase() === ".html")) {
  const html = readFileSync(file, "utf8");
  write(join(outDir, relative(root, file)), minifyHtml(html));
}

if (existsSync(join(root, "styles.css"))) {
  write(join(outDir, "styles.css"), minifyCss(readFileSync(join(root, "styles.css"), "utf8")));
}

if (existsSync(join(root, "music.js"))) {
  write(join(outDir, "music.js"), minifyJs(readFileSync(join(root, "music.js"), "utf8")));
} else {
  write(join(outDir, "music.js"), "");
}

console.log("Versione pubblica minificata creata in dist/");
